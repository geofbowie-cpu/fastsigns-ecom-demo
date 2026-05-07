// Build the Reddy Ice frame as a transparent overlay and composite it on top
// of the original product shot. The cutout is transparent so the model shows through.

import sharp from "sharp"
import fs from "fs"

const ORIG_PATH = "/Users/geofbowie/Documents/Cowork/AMZCP42214_STG Coro Photo Frame.png"
const LOGO_PATH = "/Users/geofbowie/Documents/Cowork/reddy ice logo.png"
const OUT_PATH = "public/products/reddy-selfie-frame-composite.jpg"

const W = 1500
const H = 1500

// Reddy Ice palette
const REDDY_BLUE = "#0057a8"
const REDDY_BLUE_DARK = "#003d7a"
const REDDY_RED = "#e31837"

// Frame coordinates — sized GENEROUSLY to fully cover the original green frame
// and navy bottom bar. Better to slightly over-cover than leave green strips.
const FX = 55
const FY = 45
const FW = 1300
const FH = 1410

// Photo cutout — only the actual photo opening (where the man is visible),
// NOT the green border. Tight to the inner edge of the original frame.
const CX = 240
const CY = 240
const CW = 840
const CH = 780

// Red bottom bar — covers the original navy "Safe to Go" bar.
const BAR_H = 280
const BAR_Y = FY + FH - BAR_H

// SVG icon helpers
const heart = (x, y, fill = "white") => `
  <path transform="translate(${x},${y}) scale(1.6)" fill="${fill}"
    d="M12 21s-7-4.35-9.5-8.5C.5 8.5 3 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 4 0 6.5 4.5 4.5 8.5C19 16.65 12 21 12 21z"/>`

const chat = (x, y, fill = "white") => `
  <path transform="translate(${x},${y}) scale(1.6)" fill="${fill}"
    d="M3 4h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-9l-5 4v-4H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/>`

const share = (x, y, fill = "white") => `
  <path transform="translate(${x},${y}) scale(1.6)" fill="${fill}"
    d="M18 8a3 3 0 1 0-2.83-4H15a3 3 0 0 0-2.83 2H7.83A3 3 0 1 0 5 12a3 3 0 0 0 2.83-2h4.34A3 3 0 0 0 15 12h.17A3 3 0 1 0 18 8zM6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>`

const bookmark = (x, y, fill = "white") => `
  <path transform="translate(${x},${y}) scale(2)" fill="${fill}"
    d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/>`

const verify = (x, y) => `
  <circle cx="${x + 14}" cy="${y + 14}" r="14" fill="white"/>
  <path d="M${x + 7} ${y + 14} l5 5 l9 -9" stroke="${REDDY_BLUE}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`

// SVG with TRANSPARENT background and TRANSPARENT cutout — only frame draws,
// so the original photo's yellow background and the man show through.
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="frame" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${REDDY_BLUE}"/>
      <stop offset="100%" stop-color="${REDDY_BLUE_DARK}"/>
    </linearGradient>
    <mask id="frameMask">
      <rect width="${W}" height="${H}" fill="black"/>
      <rect x="${FX}" y="${FY}" width="${FW}" height="${FH}" rx="28" fill="white"/>
      <rect x="${CX}" y="${CY}" width="${CW}" height="${CH}" fill="black"/>
    </mask>
    <style>
      .h1 { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 800; }
      .body { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 600; }
    </style>
  </defs>

  <!-- Blue frame body with transparent cutout -->
  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#frame)" mask="url(#frameMask)"/>

  <!-- Header: avatar + handle + verified -->
  <circle cx="${FX + 90}" cy="${FY + 80}" r="44" fill="white"/>
  <text x="${FX + 160}" y="${FY + 72}" class="h1" font-size="42" fill="white">reddyice</text>
  ${verify(FX + 370, FY + 46)}
  <text x="${FX + 160}" y="${FY + 108}" class="body" font-size="22" fill="white" fill-opacity="0.85">
    Facility Signage · 100 Years Strong
  </text>

  <!-- Bookmark icon top-right -->
  ${bookmark(FX + FW - 76, FY + 42)}

  <!-- Red bottom bar (fully covers navy + hashtag strip of the original) -->
  <path d="M ${FX} ${BAR_Y}
           L ${FX + FW} ${BAR_Y}
           L ${FX + FW} ${FY + FH - 28}
           Q ${FX + FW} ${FY + FH} ${FX + FW - 28} ${FY + FH}
           L ${FX + 28} ${FY + FH}
           Q ${FX} ${FY + FH} ${FX} ${FY + FH - 28}
           Z" fill="${REDDY_RED}"/>

  <!-- Engagement row in the BLUE strip between cutout and red bar -->
  <g transform="translate(${FX + 50}, ${CY + CH + 30})">
    ${heart(0, 0)}
    <text x="56" y="32" class="h1" font-size="30" fill="white">1,124</text>
    ${chat(210, 0)}
    <text x="266" y="32" class="h1" font-size="30" fill="white">96</text>
    ${share(390, 0)}
    <text x="446" y="32" class="h1" font-size="30" fill="white">137</text>
  </g>

  <!-- Hashtags in the BLUE strip below the engagement row -->
  <text x="${FX + 50}" y="${CY + CH + 110}" class="body" font-size="22" fill="white" fill-opacity="0.95">
    #StayCool  #ReddyForAnything  #ChillResponsibly  #SafetyFirst  #BuiltOnIce
  </text>

  <!-- Tagline centered in the red bar -->
  <g transform="translate(${W / 2 - 360}, ${BAR_Y + BAR_H / 2 - 25})">
    <circle cx="22" cy="22" r="24" fill="white"/>
    <path d="M11 24 l8 8 l16 -16" stroke="${REDDY_RED}" stroke-width="5"
          fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="72" y="40" class="h1" font-size="52" fill="white">Always Cool. Always Reddy.</text>
  </g>
</svg>
`

// 1. Render the Reddy Ice frame to a transparent PNG
const frameBuffer = await sharp(Buffer.from(svg)).png().toBuffer()

// 2. Drop the actual Reddy Ice logo PNG into the white avatar circle
const logoBuffer = await sharp(LOGO_PATH).resize({ width: 78 }).png().toBuffer()
const logoMeta = await sharp(logoBuffer).metadata()
const overlayBuffer = await sharp(frameBuffer)
  .composite([
    {
      input: logoBuffer,
      left: FX + 90 - Math.round((logoMeta.width ?? 78) / 2),
      top: FY + 80 - Math.round((logoMeta.height ?? 27) / 2),
    },
  ])
  .png()
  .toBuffer()

// 3. Composite the Reddy Ice frame on top of the original photo
await sharp(ORIG_PATH)
  .composite([{ input: overlayBuffer, top: 0, left: 0 }])
  .jpeg({ quality: 92, mozjpeg: true })
  .toFile(OUT_PATH)

const stat = fs.statSync(OUT_PATH)
console.log(`Wrote ${OUT_PATH} (${(stat.size / 1024).toFixed(0)} KB)`)
