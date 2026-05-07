import { NextResponse } from "next/server"
import { isMasterAuthed } from "@/lib/master-auth"
import { createClient } from "@supabase/supabase-js"
import sharp from "sharp"

export const runtime = "nodejs"

// Logo occupies up to this fraction of the image width/height
const LOGO_SCALE = 0.38
// White pill behind logo: padding around logo in px
const PILL_PAD_X = 24
const PILL_PAD_Y = 16
// Pill opacity 0–255
const PILL_ALPHA = 220

async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

// position: center | bottom-right | bottom-left | top-right | top-left
type Position = "center" | "bottom-right" | "bottom-left" | "top-right" | "top-left"

function logoOffset(
  pos: Position,
  imgW: number,
  imgH: number,
  pillW: number,
  pillH: number,
  margin = 24
): { top: number; left: number } {
  switch (pos) {
    case "top-left":     return { top: margin, left: margin }
    case "top-right":    return { top: margin, left: imgW - pillW - margin }
    case "bottom-left":  return { top: imgH - pillH - margin, left: margin }
    case "bottom-right": return { top: imgH - pillH - margin, left: imgW - pillW - margin }
    case "center":
    default:
      return {
        top:  Math.round((imgH - pillH) / 2),
        left: Math.round((imgW - pillW) / 2),
      }
  }
}

export async function POST(req: Request) {
  if (!(await isMasterAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: {
    product_image_url: string
    logo_url?: string
    primary_color?: string
    company_name?: string
    tenant_slug: string
    position?: Position
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const {
    product_image_url,
    logo_url,
    primary_color = "#1e3a5f",
    company_name = "",
    tenant_slug,
    position = "center",
  } = body

  if (!product_image_url) {
    return NextResponse.json({ error: "product_image_url is required" }, { status: 400 })
  }

  if (!logo_url?.trim() && !company_name.trim()) {
    return NextResponse.json({ error: "Provide a logo URL or company name to brand with" }, { status: 400 })
  }

  try {
    // 1. Fetch product image and get its natural dimensions
    const productBuf = await fetchBuffer(product_image_url)
    const productMeta = await sharp(productBuf).metadata()
    const imgW = productMeta.width ?? 800
    const imgH = productMeta.height ?? 600

    // Max logo size based on image dimensions
    const logoMaxW = Math.round(imgW * LOGO_SCALE)
    const logoMaxH = Math.round(imgH * LOGO_SCALE)

    // 2. Build the logo/text layer
    let logoLayer: Buffer | null = null
    let logoW = 0
    let logoH = 0

    if (logo_url?.trim()) {
      try {
        const rawLogo = await fetchBuffer(logo_url.trim())
        logoLayer = await sharp(rawLogo)
          .resize(logoMaxW, logoMaxH, {
            fit: "inside",
            withoutEnlargement: false,
          })
          .png()
          .toBuffer()

        const lm = await sharp(logoLayer).metadata()
        logoW = lm.width ?? logoMaxW
        logoH = lm.height ?? logoMaxH
      } catch (e) {
        console.warn("Logo fetch/resize failed:", e)
      }
    }

    // Fallback to company name text if no logo
    if (!logoLayer && company_name.trim()) {
      const fontSize = Math.max(24, Math.round(imgW * 0.05))
      const textW = Math.round(company_name.length * fontSize * 0.6)
      const textH = Math.round(fontSize * 1.4)
      const hex = primary_color.replace("#", "")
      logoLayer = Buffer.from(
        `<svg width="${textW}" height="${textH}" xmlns="http://www.w3.org/2000/svg">
          <text
            x="0" y="${textH - Math.round(textH * 0.2)}"
            font-family="Arial, Helvetica, sans-serif"
            font-size="${fontSize}"
            font-weight="900"
            fill="#${hex}"
          >${company_name.trim().replace(/&/g, "&amp;").replace(/</g, "&lt;")}</text>
        </svg>`
      )
      logoW = textW
      logoH = textH
    }

    if (!logoLayer) {
      return NextResponse.json({ error: "Could not build logo layer" }, { status: 500 })
    }

    // 3. Build a white rounded-rect pill behind the logo for contrast
    const pillW = logoW + PILL_PAD_X * 2
    const pillH = logoH + PILL_PAD_Y * 2
    const radius = Math.round(Math.min(pillW, pillH) * 0.15)

    const pillSvg = Buffer.from(
      `<svg width="${pillW}" height="${pillH}" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="${pillW}" height="${pillH}"
          rx="${radius}" ry="${radius}"
          fill="white" fill-opacity="${(PILL_ALPHA / 255).toFixed(3)}" />
      </svg>`
    )

    // 4. Composite: pill first, then logo on top of pill
    const overlay = await sharp({
      create: { width: pillW, height: pillH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .composite([
        { input: pillSvg, top: 0, left: 0 },
        { input: logoLayer, top: PILL_PAD_Y, left: PILL_PAD_X },
      ])
      .png()
      .toBuffer()

    // 5. Place the overlay on the product image at the chosen position
    const { top, left } = logoOffset(position, imgW, imgH, pillW, pillH)

    const finalBuf = await sharp(productBuf)
      .composite([{ input: overlay, top: Math.max(0, top), left: Math.max(0, left) }])
      .jpeg({ quality: 90 })
      .toBuffer()

    // 6. Upload to Supabase Storage
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const filename = `branded/${tenant_slug}/${Date.now()}.jpg`
    const { error: uploadError } = await supabase.storage
      .from("tenant-assets")
      .upload(filename, finalBuf, { contentType: "image/jpeg", upsert: false })

    if (uploadError) throw new Error(uploadError.message)

    const { data: urlData } = supabase.storage
      .from("tenant-assets")
      .getPublicUrl(filename)

    return NextResponse.json({ url: urlData.publicUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
