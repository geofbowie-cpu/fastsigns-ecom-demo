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
import { isMasterAuthed } from "@/lib/master-auth"
import { adminClient } from "@/lib/supabase"
import { upsertProducts, upsertCategories } from "@/lib/products-db"
import Papa from "papaparse"
import JSZip from "jszip"
import { randomBytes } from "crypto"

// ─────────────────────────────────────────────────────────────
// CSV column spec
// ─────────────────────────────────────────────────────────────
//
// Required: slug, name, category, starting_price
// Optional: short_desc, description, unit, icon, featured, lead_time,
//           image_url, gradient_from, gradient_to,
//           sizes (pipe-separated), materials (pipe-separated), tags (pipe-separated)
//           category_name, category_icon, category_description
//           (if category_name is present, the category row is auto-created)

const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
}

export async function POST(req: Request) {
  if (!(await isMasterAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 })
  }

  const csvFile = formData.get("csv") as File | null
  const zipFile = formData.get("zip") as File | null
  const importTag = (formData.get("import_tag") as string | null)?.trim() || null
  const mode = (formData.get("mode") as string | null) ?? "add"

  if (!csvFile) {
    return NextResponse.json({ error: "csv file is required" }, { status: 400 })
  }

  // ── 1. Parse CSV ────────────────────────────────────────────
  const csvText = await csvFile.text()
  const { data: rows, errors: parseErrors } = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
  })

  if (parseErrors.length > 0) {
    return NextResponse.json(
      { error: `CSV parse error: ${parseErrors[0].message}` },
      { status: 400 }
    )
  }
  if (rows.length === 0) {
    return NextResponse.json({ error: "CSV has no data rows" }, { status: 400 })
  }

  // ── 2. Extract ZIP images (if provided) ─────────────────────
  // Map: slug → uploaded public URL
  const zipImages: Record<string, string> = {}
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
          const base = filename.split("/").pop() ?? filename
          const dotIdx = base.lastIndexOf(".")
          if (dotIdx < 0) return
          const slug = base.slice(0, dotIdx)
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
      return NextResponse.json({ error: `ZIP error: ${e.message}` }, { status: 400 })
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
    const slug = row.slug?.trim()
    const name = row.name?.trim()
    const category = row.category?.trim()
    const price = parseFloat(row.starting_price ?? "")

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
      return NextResponse.json(
        { error: `Failed to clear existing import: ${error.message}` },
        { status: 500 }
      )
    }
  }

  // ── 5. Upsert categories then products ──────────────────────
  if (categoryRows.size > 0) {
    await upsertCategories(Array.from(categoryRows.values()))
  }

  const { inserted, error: upsertError } = await upsertProducts(productRows)
  if (upsertError) {
    return NextResponse.json({ error: upsertError }, { status: 500 })
  }

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
