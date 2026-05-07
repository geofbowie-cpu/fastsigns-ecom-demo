// Brandfetch proxy — pre-fills brand fields when creating a new tenant.
// Also rehosts the fetched logo into Supabase Storage so the tenant doesn't
// depend on Brandfetch's CDN long-term.

import { NextResponse } from "next/server"
import { isMasterAuthed } from "@/lib/master-auth"
import { fetchBrand } from "@/lib/brandfetch"
import { adminClient } from "@/lib/supabase"
import { randomBytes } from "crypto"

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
  if (!(await isMasterAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const domain = String(body.domain ?? "").trim()
  const slug = body.slug ? String(body.slug).trim().toLowerCase() : null
  if (!domain) {
    return NextResponse.json({ error: "domain is required" }, { status: 400 })
  }
  try {
    const hit = await fetchBrand(domain)
    let hostedLogoUrl: string | null = null
    if (hit.logoUrl) {
      hostedLogoUrl = await rehostLogo(hit.logoUrl, slug)
    }
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
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
