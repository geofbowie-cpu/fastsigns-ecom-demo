import { NextResponse } from "next/server"
import { isMasterAuthed } from "@/lib/master-auth"
import { apiError } from "@/lib/api-helpers"

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY

export async function GET(req: Request) {
  if (!(await isMasterAuthed())) return apiError("Unauthorized", 401)
  if (!ACCESS_KEY) return apiError("UNSPLASH_ACCESS_KEY not configured", 503)

  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")?.trim()
  const track = searchParams.get("track")?.trim()

  // ── Download-tracking ping (required by Unsplash TOS when a photo is used) ──
  if (track) {
    await fetch(`https://api.unsplash.com/photos/${track}/download`, {
      headers: { Authorization: `Client-ID ${ACCESS_KEY}` },
    }).catch(() => {}) // fire-and-forget; failure is non-fatal
    return NextResponse.json({ ok: true })
  }

  // ── Photo search ──────────────────────────────────────────────────────────
  if (!q) return apiError("q is required", 400)

  const url = new URL("https://api.unsplash.com/search/photos")
  url.searchParams.set("query", q)
  url.searchParams.set("per_page", "24")
  url.searchParams.set("orientation", "landscape")
  url.searchParams.set("content_filter", "high")

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Client-ID ${ACCESS_KEY}` },
    next: { revalidate: 300 }, // cache results 5 min
  })

  if (!res.ok) {
    const text = await res.text()
    return apiError(`Unsplash error: ${res.status} ${text}`, 502)
  }

  const data = await res.json()

  const photos = (data.results ?? []).map((p: any) => ({
    id: p.id,
    thumb: p.urls.small,   // ~400px — fast grid preview
    regular: p.urls.regular, // ~1080px — actual hero image
    full: p.urls.full,
    alt: p.alt_description ?? p.description ?? "",
    photographer: p.user.name,
    photographerUrl: `${p.user.links.html}?utm_source=fastsigns_demo&utm_medium=referral`,
    photoUrl: `${p.links.html}?utm_source=fastsigns_demo&utm_medium=referral`,
    color: p.color, // dominant color for placeholder
  }))

  return NextResponse.json({ photos, total: data.total })
}
