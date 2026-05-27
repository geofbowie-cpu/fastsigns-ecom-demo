// Brandfetch proxy — pre-fills brand fields when creating a new tenant.
// Also rehosts the fetched logo into Supabase Storage so the tenant doesn't
// depend on Brandfetch's CDN long-term.

import { NextResponse } from "next/server"
import { fetchBrand } from "@/lib/brandfetch"
import { adminClient } from "@/lib/supabase"
import { randomBytes } from "crypto"
import { assertMasterAuth, apiError, parseBody } from "@/lib/api-helpers"
import { logger } from "@/lib/logger"
import { BrandfetchSchema } from "@/lib/schemas"

const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
}

async function rehostLogo(
  url: string,
  slug: string | null
): Promise<string | null> {
  try {
    const resp = await fetch(url, { cache: "no-store" })
    if (!resp.ok) return null
    const type = resp.headers.get("content-type") ?? "image/png"
    const ext = MIME_TO_EXT[type.split(";")[0].trim()] ?? "png"
    const buf = Buffer.from(await resp.arrayBuffer())
    if (buf.byteLength > 10 * 1024 * 1024) return null
    const folder = slug && /^[a-z0-9-]+$/.test(slug) ? slug : "_brandfetch"
    const key = `${folder}/logo-bf-${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`
    const sb = adminClient()
    const { error } = await sb.storage.from("tenant-assets").upload(key, buf, {
      contentType: type,
      upsert: false,
      cacheControl: "31536000, immutable",
    })
    if (error) return null
    return sb.storage.from("tenant-assets").getPublicUrl(key).data.publicUrl
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  const unauth = await assertMasterAuth()
  if (unauth) return unauth
  const result = BrandfetchSchema.safeParse(await parseBody(req))
  if (!result.success) return apiError(result.error.issues[0].message)
  const { domain, slug } = result.data
  const cleanSlug = slug ? slug.trim().toLowerCase() : null
  try {
    const hit = await fetchBrand(domain)
    let hostedLogoUrl: string | null = null
    if (hit.logoUrl) {
      hostedLogoUrl = await rehostLogo(hit.logoUrl, cleanSlug)
    }
    logger.info("brandfetch.fetch", { domain, rehosted: !!hostedLogoUrl })
    return NextResponse.json({
      brand: {
        name: hit.name,
        domain: hit.domain,
        description: hit.description,
        primaryColor: hit.primaryColor,
        accentColor: hit.accentColor,
        // Prefer rehosted (immutable cache), fall back to Brandfetch CDN URL
        logoUrl: hostedLogoUrl ?? hit.logoUrl ?? null,
        logoRehosted: !!hostedLogoUrl,
      },
    })
  } catch (e: any) {
    logger.error("brandfetch.fetch failed", { error: e.message, domain })
    return apiError(e.message, 400)
  }
}
