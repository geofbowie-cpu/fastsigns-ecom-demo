import { NextResponse } from "next/server"
import { isMasterAuthed } from "@/lib/master-auth"
import { createClient } from "@supabase/supabase-js"
import sharp from "sharp"

// Force Node.js runtime — Sharp uses native bindings, not available in Edge
export const runtime = "nodejs"

const OUTPUT_WIDTH = 800
const OUTPUT_HEIGHT = 600
const LOGO_MAX_W = 180
const LOGO_MAX_H = 80
const LOGO_PADDING = 16
const BAR_HEIGHT = 48

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "")
  const full = clean.length === 3
    ? clean.split("").map((c) => c + c).join("")
    : clean
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  }
}

async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
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
  } = body

  if (!product_image_url) {
    return NextResponse.json({ error: "product_image_url is required" }, { status: 400 })
  }

  try {
    const { r, g, b } = hexToRgb(primary_color)

    // 1. Fetch and resize the product image to fill canvas
    const productBuf = await fetchBuffer(product_image_url)
    const base = await sharp(productBuf)
      .resize(OUTPUT_WIDTH, OUTPUT_HEIGHT - BAR_HEIGHT, {
        fit: "cover",
        position: "center",
      })
      .toBuffer()

    // 2. Build the brand bar (solid color strip at bottom)
    const bar = await sharp({
      create: {
        width: OUTPUT_WIDTH,
        height: BAR_HEIGHT,
        channels: 4,
        background: { r, g, b, alpha: 1 },
      },
    })
      .png()
      .toBuffer()

    // 3. If company name, render it as SVG text over the bar
    const labelSvg = company_name.trim()
      ? Buffer.from(
          `<svg width="${OUTPUT_WIDTH}" height="${BAR_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
            <text
              x="${logo_url ? LOGO_MAX_W + LOGO_PADDING * 2 + 8 : 20}"
              y="${BAR_HEIGHT / 2 + 7}"
              font-family="Arial, Helvetica, sans-serif"
              font-size="20"
              font-weight="bold"
              fill="white"
              opacity="0.9"
            >${company_name.trim().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</text>
          </svg>`
        )
      : null

    // 4. Stack base image + bar into full canvas
    const composite: sharp.OverlayOptions[] = [
      { input: bar, top: OUTPUT_HEIGHT - BAR_HEIGHT, left: 0 },
    ]

    if (labelSvg) {
      composite.push({
        input: labelSvg,
        top: OUTPUT_HEIGHT - BAR_HEIGHT,
        left: 0,
      })
    }

    // 5. If logo URL provided, fetch + resize + place in bar
    if (logo_url?.trim()) {
      try {
        const logoBuf = await fetchBuffer(logo_url.trim())
        const resizedLogo = await sharp(logoBuf)
          .resize(LOGO_MAX_W, LOGO_MAX_H, { fit: "inside", background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer()

        const logoMeta = await sharp(resizedLogo).metadata()
        const logoH = logoMeta.height ?? LOGO_MAX_H
        const logoTop = OUTPUT_HEIGHT - BAR_HEIGHT + Math.floor((BAR_HEIGHT - logoH) / 2)

        composite.push({
          input: resizedLogo,
          top: Math.max(0, logoTop),
          left: LOGO_PADDING,
        })
      } catch (e) {
        // Logo fetch failed — skip it, still produce branded image
        console.warn("Logo fetch failed, skipping:", e)
      }
    }

    const finalBuf = await sharp({
      create: {
        width: OUTPUT_WIDTH,
        height: OUTPUT_HEIGHT,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: base, top: 0, left: 0 }, ...composite])
      .jpeg({ quality: 88 })
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
