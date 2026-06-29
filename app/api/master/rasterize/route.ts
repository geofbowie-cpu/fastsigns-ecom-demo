import { NextRequest, NextResponse } from "next/server"
import sharp from "sharp"

export const runtime = "nodejs"

// Rasterizes an SVG (from our own storage) to a clean transparent PNG using
// Sharp. The browser's <canvas> rasterizes SVG filters with green chroma
// fringing on high-contrast edges; Sharp does not. The logo editor proxies
// SVG logos through here so the composited product image stays clean.
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url")
  if (!url) return new NextResponse("missing url", { status: 400 })

  // SSRF guard — only rasterize assets from our own Supabase storage.
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base || !url.startsWith(base)) {
    return new NextResponse("forbidden host", { status: 403 })
  }

  try {
    const resp = await fetch(url)
    if (!resp.ok) return new NextResponse("fetch failed", { status: 502 })
    const buf = Buffer.from(await resp.arrayBuffer())

    const png = await sharp(buf, { density: 384 })
      .resize(1400, 1400, { fit: "inside", withoutEnlargement: false })
      .png()
      .toBuffer()

    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    })
  } catch (e: any) {
    return new NextResponse(e?.message ?? "rasterize failed", { status: 500 })
  }
}
