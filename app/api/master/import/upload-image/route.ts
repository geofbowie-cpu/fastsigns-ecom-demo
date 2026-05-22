// Single-image upload helper for bulk product imports.
//
// The main /api/master/import endpoint is capped at Vercel's 4.5 MB request
// body limit, so a multi-MB ZIP of product images can't go through it. The
// client-side import page extracts the ZIP in-browser, then POSTs each image
// here (one at a time, each well under the cap), and finally submits the CSV
// plus a small JSON manifest of slug → URL pairs to the main import endpoint.

import { NextResponse } from "next/server"
import { isMasterAuthed } from "@/lib/master-auth"
import { adminClient } from "@/lib/supabase"
import { randomBytes } from "crypto"

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB per image
const MIME_BY_EXT: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
  webp: "image/webp", svg: "image/svg+xml",
}

function slugify(s: string): string {
  return s.trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export async function POST(req: Request) {
  if (!(await isMasterAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let form: FormData
  try { form = await req.formData() }
  catch { return NextResponse.json({ error: "Expected multipart form" }, { status: 400 }) }

  const file = form.get("file")
  const rawSlug = String(form.get("slug") ?? "")
  const importTag = String(form.get("import_tag") ?? "").trim() || null

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 })
  }

  const slug = slugify(rawSlug)
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `${slug}: file too large (${(file.size / 1024 / 1024).toFixed(1)} MB > 10 MB)` },
      { status: 400 }
    )
  }

  // Pick extension from filename (we slugified it, so use the original file.type
  // or a `.bin` fallback)
  const type = file.type
  let ext = "png"
  for (const [e, m] of Object.entries(MIME_BY_EXT)) {
    if (m === type) { ext = e; break }
  }

  const folder = importTag ? `_imports/${slugify(importTag)}` : `_imports/_untagged`
  const key = `${folder}/${slug}-${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`

  const buf = Buffer.from(await file.arrayBuffer())
  const sb = adminClient()
  const { error } = await sb.storage.from("tenant-assets").upload(key, buf, {
    contentType: type || MIME_BY_EXT[ext],
    upsert: false,
    cacheControl: "31536000, immutable",
  })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const url = sb.storage.from("tenant-assets").getPublicUrl(key).data.publicUrl
  return NextResponse.json({ ok: true, slug, url })
}
