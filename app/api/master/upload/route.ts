// Hero / logo image uploader.
// Master-auth gated. Stores in `tenant-assets` bucket and returns a public URL.

import { NextResponse } from "next/server"
import { isMasterAuthed } from "@/lib/master-auth"
import { adminClient } from "@/lib/supabase"
import { randomBytes } from "crypto"

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
])

const EXT_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
}

export async function POST(req: Request) {
  if (!(await isMasterAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: "Expected multipart form" }, { status: 400 })
  }

  const file = form.get("file")
  const slug = String(form.get("slug") ?? "").trim().toLowerCase()
  const kind = String(form.get("kind") ?? "hero").trim().toLowerCase()

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB > 10 MB)` },
      { status: 400 }
    )
  }
  const type = file.type || "application/octet-stream"
  if (!ALLOWED_TYPES.has(type)) {
    return NextResponse.json(
      { error: `Unsupported type: ${type}. Use PNG, JPG, WEBP, or SVG.` },
      { status: 400 }
    )
  }

  const ext = EXT_BY_TYPE[type] ?? "bin"
  const rand = randomBytes(6).toString("hex")
  const folder = slug && /^[a-z0-9-]+$/.test(slug) ? slug : "_unsorted"
  const key = `${folder}/${kind}-${Date.now()}-${rand}.${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())
  const sb = adminClient()
  const { error: upErr } = await sb.storage
    .from("tenant-assets")
    .upload(key, buffer, {
      contentType: type,
      upsert: false,
      cacheControl: "31536000, immutable",
    })
  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 })
  }

  const { data } = sb.storage.from("tenant-assets").getPublicUrl(key)
  return NextResponse.json({ url: data.publicUrl, key })
}
