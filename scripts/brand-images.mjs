// Brand product images with a logo (bottom-right corner watermark).
// Usage: node scripts/brand-images.mjs <logo.png> <input-dir> <output-dir>

import sharp from "sharp"
import fs from "fs"
import path from "path"

const [, , logoPath, inputDir, outputDir] = process.argv

if (!logoPath || !inputDir || !outputDir) {
  console.error("Usage: node scripts/brand-images.mjs <logo.png> <input-dir> <output-dir>")
  process.exit(1)
}

fs.mkdirSync(outputDir, { recursive: true })

const exts = new Set([".png", ".jpg", ".jpeg", ".webp"])
const files = fs.readdirSync(inputDir).filter((f) => exts.has(path.extname(f).toLowerCase()))

if (files.length === 0) {
  console.error("No images found in", inputDir)
  process.exit(1)
}

console.log(`Branding ${files.length} image(s) with ${logoPath}`)

// Tunables
const LOGO_WIDTH_PCT = 0.18 // logo = 18% of image width
const MARGIN_PCT = 0.03 // 3% margin from edge
const LOGO_OPACITY = 0.95 // near-opaque, but not punchy

for (const file of files) {
  const inPath = path.join(inputDir, file)
  const slug = path
    .basename(file, path.extname(file))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  const outPath = path.join(outputDir, `${slug}.jpg`)

  try {
    const img = sharp(inPath)
    const meta = await img.metadata()
    const targetW = Math.round((meta.width ?? 1200) * LOGO_WIDTH_PCT)

    // Resize logo + apply opacity
    const logoBuffer = await sharp(logoPath)
      .resize({ width: targetW })
      .ensureAlpha()
      .composite([
        {
          input: Buffer.from([255, 255, 255, Math.round(255 * LOGO_OPACITY)]),
          raw: { width: 1, height: 1, channels: 4 },
          tile: true,
          blend: "dest-in",
        },
      ])
      .png()
      .toBuffer()

    const margin = Math.round((meta.width ?? 1200) * MARGIN_PCT)

    // Build a semi-transparent white pill behind the logo for legibility on busy backgrounds
    const logoMeta = await sharp(logoBuffer).metadata()
    const padX = Math.round((logoMeta.width ?? targetW) * 0.12)
    const padY = Math.round((logoMeta.height ?? 40) * 0.18)
    const pillW = (logoMeta.width ?? targetW) + padX * 2
    const pillH = (logoMeta.height ?? 40) + padY * 2

    const pillSvg = `<svg width="${pillW}" height="${pillH}"><rect x="0" y="0" width="${pillW}" height="${pillH}" rx="${Math.round(pillH / 4)}" ry="${Math.round(pillH / 4)}" fill="white" fill-opacity="0.88"/></svg>`

    await img
      .resize({ width: 1600, withoutEnlargement: true })
      .composite([
        {
          input: Buffer.from(pillSvg),
          gravity: "southeast",
          top: undefined,
          left: undefined,
        },
        // Manual offset to align logo centered inside the pill
        {
          input: logoBuffer,
          gravity: "southeast",
        },
      ])
      .jpeg({ quality: 88, mozjpeg: true })
      .toFile(outPath)

    // Re-process with proper offsets so the logo sits inside the pill
    // (sharp gravity doesn't accept margins per-overlay, so we do a 2-pass)
    const baseAgain = sharp(inPath).resize({ width: 1600, withoutEnlargement: true })
    const baseMeta = await baseAgain.metadata()
    const W = baseMeta.width ?? 1600
    const H = baseMeta.height ?? 1200

    const pillLeft = W - pillW - margin
    const pillTop = H - pillH - margin
    const logoLeft = pillLeft + padX
    const logoTop = pillTop + padY

    await sharp(inPath)
      .resize({ width: 1600, withoutEnlargement: true })
      .composite([
        { input: Buffer.from(pillSvg), left: pillLeft, top: pillTop },
        { input: logoBuffer, left: logoLeft, top: logoTop },
      ])
      .jpeg({ quality: 88, mozjpeg: true })
      .toFile(outPath)

    console.log(`  ✓ ${file} → ${path.basename(outPath)}`)
  } catch (e) {
    console.error(`  ✗ ${file}: ${e.message}`)
  }
}

console.log("Done.")
