// CSV + ZIP product import endpoint.
//
// POST multipart/form-data:
//   csv        File  — required. See CSV_COLUMNS below.
//   zip        File  — optional. Images named {slug}.png/.jpg/.webp
//                      are extracted and uploaded to Supabase Storage,
//                      then linked as image_url on that product.
//   import_tag string — optional batch label (e.g. "reddy-2024").
//                       Products without a tag are treated as built-ins.
//   mode       "add" | "replace" — default "add". "replace" deletes all
//                       existing products with this import_tag first.

import { NextResponse } from "next/server"
import { adminClient } from "@/lib/supabase"
import { assertMasterAuth, apiError } from "@/lib/api-helpers"
import { logger } from "@/lib/logger"
import { upsertProducts, upsertCategories } from "@/lib/products-db"
import Papa from "papaparse"
import JSZip from "jszip"
import { randomBytes } from "crypto"

// ─────────────────────────────────────────────────────────────
// CSV column spec
// ─────────────────────────────────────────────────────────────
//
// Required: slug, name, category
// Optional: starting_price (defaults to 0), short_desc, description, unit,
//           icon, featured, lead_time, image_url, gradient_from, gradient_to,
//           sizes (pipe-separated), materials (pipe-separated), tags (pipe-separated),
//           category_name, category_icon, category_description
//           (if category_name is present, the category row is auto-created)
//
// Slug / category values are auto-slugified (lowercased, non-alphanumerics →
// hyphens). ZIP image filenames are slugified the same way before matching, so
// `Exit_ADA.jpg` in the ZIP matches a CSV slug of `exit_ADA` or `exit-ada`.

const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
}

export async function POST(req: Request) {
  const unauth = await assertMasterAuth()
  if (unauth) return unauth

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return apiError("Expected multipart/form-data")
  }

  const csvFile = formData.get("csv") as File | null
  const zipFile = formData.get("zip") as File | null
  const manifestRaw = formData.get("image_manifest") as string | null
  const importTag = (formData.get("import_tag") as string | null)?.trim() || null
  const mode = (formData.get("mode") as string | null) ?? "add"

  if (!csvFile) {
    return apiError("csv file is required")
  }

  // ── 1. Parse CSV ────────────────────────────────────────────
  // Many shared templates put a description row (column comments) above the
  // real header row. Detect this: if the first non-empty line doesn't contain
  // a "slug" column but the next one does, drop the first line.
  let csvText = await csvFile.text()
  csvText = stripDescriptionRow(csvText)

  const { data: rows, errors: parseErrors } = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
  })

  if (parseErrors.length > 0) {
    return apiError(`CSV parse error: ${parseErrors[0].message}`)
  }
  if (rows.length === 0) {
    return apiError("CSV has no data rows")
  }

  // ── 2. Resolve image map (manifest first, then optional ZIP) ───
  // Map: slug → public URL
  const zipImages: Record<string, string> = {}

  // Client-uploaded manifest avoids Vercel's 4.5 MB body cap. Images were
  // already POSTed to /api/master/import/upload-image individually.
  if (manifestRaw) {
    try {
      const parsed = JSON.parse(manifestRaw) as Record<string, string>
      for (const [slug, url] of Object.entries(parsed)) {
        if (typeof url === "string" && url) zipImages[slugify(slug)] = url
      }
    } catch {
      return apiError("image_manifest must be valid JSON")
    }
  }

  if (zipFile) {
    try {
      const zipBuf = await zipFile.arrayBuffer()
      const zip = await JSZip.loadAsync(zipBuf)
      const sb = adminClient()
      const folder = importTag
        ? `_imports/${importTag}`
        : `_imports/_untagged`

      await Promise.all(
        Object.entries(zip.files).map(async ([filename, entry]) => {
          if (entry.dir) return
          // Skip macOS resource-fork metadata that ZIPs made in Finder include.
          if (filename.startsWith("__MACOSX/") || filename.includes("/__MACOSX/")) return
          const base = filename.split("/").pop() ?? filename
          if (base.startsWith("._")) return
          const dotIdx = base.lastIndexOf(".")
          if (dotIdx < 0) return
          // Slugify the filename basename so `exit_ADA.jpg`, `Exit ADA.jpg`, and
          // `exit-ada.jpg` all match a CSV slug that resolves to `exit-ada`.
          const slug = slugify(base.slice(0, dotIdx))
          const ext = base.slice(dotIdx + 1).toLowerCase()
          const mimeMap: Record<string, string> = {
            png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
            webp: "image/webp", svg: "image/svg+xml",
          }
          const mime = mimeMap[ext]
          if (!mime) return // skip non-image files

          const buf = Buffer.from(await entry.async("arraybuffer"))
          if (buf.byteLength > 10 * 1024 * 1024) return // skip >10 MB

          const key = `${folder}/${slug}-${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`
          const { error } = await sb.storage.from("tenant-assets").upload(key, buf, {
            contentType: mime,
            upsert: false,
            cacheControl: "31536000, immutable",
          })
          if (!error) {
            zipImages[slug] = sb.storage.from("tenant-assets").getPublicUrl(key).data.publicUrl
          }
        })
      )
    } catch (e: any) {
      logger.error("import.zip failed", { error: e.message })
      return apiError(`ZIP error: ${e.message}`)
    }
  }

  // ── 3. Validate & normalise rows ────────────────────────────
  const validationErrors: string[] = []
  const categoryRows: Map<
    string,
    { slug: string; name: string; icon: string; description: string }
  > = new Map()
  const productRows: ReturnType<typeof buildProductRow>[] = []

  rows.forEach((row, i) => {
    const lineNum = i + 2 // 1-indexed + header
    // Slugify slug + category so the importer is forgiving about underscores,
    // mixed case, spaces, apostrophes, etc. — the DB always stores the clean form.
    const slug = slugify(row.slug ?? "")
    const name = row.name?.trim()
    const category = slugify(row.category ?? "")
    // starting_price is optional — defaults to 0 if missing or blank.
    const rawPrice = row.starting_price?.trim()
    const price = rawPrice ? parseFloat(rawPrice) : 0

    if (!slug) { validationErrors.push(`Row ${lineNum}: missing slug`); return }
    if (!name) { validationErrors.push(`Row ${lineNum}: missing name`); return }
    if (!category) { validationErrors.push(`Row ${lineNum}: missing category`); return }
    if (isNaN(price)) { validationErrors.push(`Row ${lineNum}: starting_price must be a number`); return }

    // Auto-register category if category_name provided
    if (row.category_name?.trim()) {
      categoryRows.set(category, {
        slug: category,
        name: row.category_name.trim(),
        icon: row.category_icon?.trim() || "📦",
        description: row.category_description?.trim() || "",
      })
    }

    // image_url: prefer ZIP match, then CSV column
    const imageUrl = zipImages[slug] ?? row.image_url?.trim() ?? null

    productRows.push(
      buildProductRow(row, slug, name, category, price, imageUrl, importTag)
    )
  })

  if (validationErrors.length > 0) {
    return NextResponse.json({ errors: validationErrors }, { status: 422 })
  }

  // ── 4. If mode=replace, delete existing import_tag rows ─────
  if (mode === "replace" && importTag) {
    const { error } = await adminClient()
      .from("products")
      .delete()
      .eq("import_tag", importTag)
    if (error) {
      logger.error("import.replace failed", { error: error.message, importTag })
      return apiError(`Failed to clear existing import: ${error.message}`, 500)
    }
  }

  // ── 5. Upsert categories then products ──────────────────────
  if (categoryRows.size > 0) {
    await upsertCategories(Array.from(categoryRows.values()))
  }

  const { inserted, error: upsertError } = await upsertProducts(productRows)
  if (upsertError) {
    logger.error("import.upsert failed", { error: upsertError, importTag })
    return apiError(upsertError, 500)
  }

  logger.info("import.complete", { importTag, products: inserted, mode })
  return NextResponse.json({
    ok: true,
    import_tag: importTag,
    products: inserted,
    images_from_zip: Object.keys(zipImages).length,
    categories_created: categoryRows.size,
    mode,
  })
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function splitPipe(val: string | undefined): string[] {
  if (!val?.trim()) return []
  return val
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean)
}

function buildProductRow(
  row: Record<string, string>,
  slug: string,
  name: string,
  category: string,
  price: number,
  imageUrl: string | null,
  importTag: string | null
) {
  return {
    slug,
    name,
    category,
    short_desc: row.short_desc?.trim() || "",
    description: row.description?.trim() || "",
    sizes: splitPipe(row.sizes),
    materials: splitPipe(row.materials),
    starting_price: price,
    unit: row.unit?.trim() || "per unit",
    gradient_from: row.gradient_from?.trim() || "#1e3a5f",
    gradient_to: row.gradient_to?.trim() || "#2d6a9f",
    icon: row.icon?.trim() || "📦",
    featured: row.featured?.trim().toLowerCase() === "true",
    tags: splitPipe(row.tags),
    lead_time: row.lead_time?.trim() || "5–7 business days",
    image_url: imageUrl || null,
    import_tag: importTag,
  }
}

/**
 * Normalize any human-typed identifier into the storage slug format:
 * lowercase, alphanumerics + hyphens only, no leading/trailing hyphens.
 *
 *   slugify("exit_ADA")            → "exit-ada"
 *   slugify("BHM Water Bottle")    → "bhm-water-bottle"
 *   slugify("indigenous_peoples'_day_drawstring")
 *                                  → "indigenous-peoples-day-drawstring"
 *
 * Applied to both CSV slug/category columns AND ZIP image filenames so that
 * mismatched casing/punctuation between the CSV and image files doesn't break
 * the match.
 */
function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

/**
 * Drop a leading description / comments row above the real header row.
 *
 * Pattern: row 1 = human-readable column descriptions, row 2 = actual column
 * names (slug, name, category, …). If row 1 has no "slug" cell but row 2 does,
 * row 1 is treated as a comment and removed.
 */
function stripDescriptionRow(csv: string): string {
  // Cheap header sniff via Papa — we just want to see if row 1's parsed cells
  // contain a "slug" entry once normalized.
  const probe1 = Papa.parse<string[]>(csv, { skipEmptyLines: true, preview: 2 })
  const r1 = probe1.data[0] ?? []
  const r2 = probe1.data[1] ?? []
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "_")
  const r1HasSlug = r1.some((c) => norm(c) === "slug")
  const r2HasSlug = r2.some((c) => norm(c) === "slug")
  if (!r1HasSlug && r2HasSlug) {
    // Drop the first non-empty line from the raw CSV
    const lines = csv.split(/\r?\n/)
    let dropped = false
    return lines
      .filter((line) => {
        if (dropped) return true
        if (line.trim() === "") return true // keep leading blank lines (rare)
        dropped = true
        return false
      })
      .join("\n")
  }
  return csv
}
