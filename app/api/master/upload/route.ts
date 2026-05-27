// Hero / logo image uploader.
// Master-auth gated. Stores in `tenant-assets` bucket and returns a public URL.

import { NextResponse } from "next/server"
import { adminClient } from "@/lib/supabase"
import { randomBytes } from "crypto"
import { assertMasterAuth, apiError } from "@/lib/api-helpers"
import { logger } from "@/lib/logger"

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
  const unauth = await assertMasterAuth()
  if (unauth) return unauth

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return apiError("Expected multipart form")
  }

  const file = form.get("file")
  const slug = String(form.get("slug") ?? "").trim().toLowerCase()
  const kind = String(form.get("kind") ?? "hero").trim().toLowerCase()

  if (!(file instanceof Blob)) {
    return apiError("Missing file")
  }
  if (file.size > MAX_BYTES) {
    return apiError(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB > 10 MB)`)
  }
  const type = file.type || "application/octet-stream"
  if (!ALLOWED_TYPES.has(type)) {
    return apiError(`Unsupported type: ${type}. Use PNG, JPG, WEBP, or SVG.`)
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
    logger.error("upload.store failed", { error: upErr.message, key })
    return apiError(upErr.message, 500)
  }

  const { data } = sb.storage.from("tenant-assets").getPublicUrl(key)
  logger.info("upload.complete", { key, size: buffer.byteLength })
  return NextResponse.json({ url: data.publicUrl, key })
}
