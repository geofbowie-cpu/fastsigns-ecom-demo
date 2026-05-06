// Reddy Ice "selfie frame" prop — v2 with cleaner SVG icons + polish.

import sharp from "sharp"
import fs from "fs"

const LOGO_PATH = "/Users/geofbowie/Documents/Cowork/reddy ice logo.png"
const OUT_PATH = "public/products/reddy-selfie-frame.jpg"

const W = 1500
const H = 1500

// Reddy Ice palette
const REDDY_BLUE = "#0057a8"
const REDDY_BLUE_DARK = "#003d7a"
const REDDY_RED = "#e31837"
const ICE_BG = "#cfe6f7" // soft icy blue background instead of yellow

// Frame geometry
const FRAME_X = 150
const FRAME_Y = 110
const FRAME_W = W - FRAME_X * 2
const FRAME_H = H - FRAME_Y - 130

const HEADER_H = 200
const FOOTER_H = 380
const BAR_H = 130

const CUT_X = FRAME_X + 90
const CUT_Y = FRAME_Y + HEADER_H
const CUT_W = FRAME_W - 180
const CUT_H = FRAME_H - HEADER_H - FOOTER_H

const FOOTER_Y = CUT_Y + CUT_H
const BAR_Y = FRAME_Y + FRAME_H - BAR_H

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

const snowflake = (cx, cy, size = 24, fill = "white", op = 0.18) => `
  <g transform="translate(${cx},${cy})" opacity="${op}" stroke="${fill}" stroke-width="2" stroke-linecap="round">
    <line x1="-${size}" y1="0" x2="${size}" y2="0"/>
    <line x1="0" y1="-${size}" x2="0" y2="${size}"/>
    <line x1="-${size * 0.7}" y1="-${size * 0.7}" x2="${size * 0.7}" y2="${size * 0.7}"/>
    <line x1="-${size * 0.7}" y1="${size * 0.7}" x2="${size * 0.7}" y2="-${size * 0.7}"/>
  </g>`

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="frame" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${REDDY_BLUE}"/>
      <stop offset="100%" stop-color="${REDDY_BLUE_DARK}"/>
    </linearGradient>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#e8f3fb"/>
      <stop offset="100%" stop-color="${ICE_BG}"/>
    </linearGradient>
    <style>
      .h1 { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 800; }
      .body { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 600; }
    </style>
  </defs>

  <!-- Studio background -->
  <rect width="100%" height="100%" fill="url(#bg)"/>

  <!-- Subtle snowflakes scattered on background -->
  ${snowflake(80, 100, 26)}
  ${snowflake(W - 80, 200, 32)}
  ${snowflake(60, H - 220, 22)}
  ${snowflake(W - 100, H - 80, 28)}
  ${snowflake(W / 2, 60, 18)}

  <!-- Frame -->
  <rect x="${FRAME_X}" y="${FRAME_Y}" width="${FRAME_W}" height="${FRAME_H}" rx="32" fill="url(#frame)"/>

  <!-- Photo cutout -->
  <rect x="${CUT_X}" y="${CUT_Y}" width="${CUT_W}" height="${CUT_H}" fill="url(#bg)" rx="10"/>
  <rect x="${CUT_X}" y="${CUT_Y}" width="${CUT_W}" height="${CUT_H}" fill="none" rx="10"
        stroke="white" stroke-opacity="0.25" stroke-width="2"/>

  <!-- Header: avatar + handle + verified -->
  <circle cx="${FRAME_X + 100}" cy="${FRAME_Y + 100}" r="50" fill="white"/>
  <text x="${FRAME_X + 175}" y="${FRAME_Y + 92}" class="h1" font-size="48" fill="white">reddyice</text>
  ${verify(FRAME_X + 410, FRAME_Y + 64)}
  <text x="${FRAME_X + 175}" y="${FRAME_Y + 132}" class="body" font-size="26" fill="white" fill-opacity="0.85">
    Facility Signage · 100 Years Strong
  </text>

  <!-- Bookmark icon top-right -->
  ${bookmark(FRAME_X + FRAME_W - 76, FRAME_Y + 60)}

  <!-- Engagement row -->
  <g transform="translate(${FRAME_X + 60}, ${FOOTER_Y + 30})">
    ${heart(0, 0)}
    <text x="56" y="32" class="h1" font-size="34" fill="white">1,124</text>
    ${chat(220, 0)}
    <text x="276" y="32" class="h1" font-size="34" fill="white">96</text>
    ${share(420, 0)}
    <text x="476" y="32" class="h1" font-size="34" fill="white">137</text>
  </g>

  <!-- Hashtags (two lines) -->
  <text x="${FRAME_X + 60}" y="${FOOTER_Y + 110}" class="body" font-size="28" fill="white">
    #StayCool  #ReddyForAnything  #ChillResponsibly
  </text>
  <text x="${FRAME_X + 60}" y="${FOOTER_Y + 148}" class="body" font-size="28" fill="white">
    #SafetyFirst  #BuiltOnIce  #100YearsStrong
  </text>

  <!-- Red bottom bar -->
  <path d="M ${FRAME_X} ${BAR_Y}
           L ${FRAME_X + FRAME_W} ${BAR_Y}
           L ${FRAME_X + FRAME_W} ${FRAME_Y + FRAME_H - 32}
           Q ${FRAME_X + FRAME_W} ${FRAME_Y + FRAME_H} ${FRAME_X + FRAME_W - 32} ${FRAME_Y + FRAME_H}
           L ${FRAME_X + 32} ${FRAME_Y + FRAME_H}
           Q ${FRAME_X} ${FRAME_Y + FRAME_H} ${FRAME_X} ${FRAME_Y + FRAME_H - 32}
           Z" fill="${REDDY_RED}"/>

  <!-- Tagline (no checkmark glyph — drawn as SVG) -->
  <g transform="translate(${W / 2 - 350}, ${BAR_Y + 50})">
    <circle cx="20" cy="20" r="22" fill="white"/>
    <path d="M10 22 l8 8 l16 -16" stroke="${REDDY_RED}" stroke-width="5"
          fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="70" y="36" class="h1" font-size="56" fill="white">Always Cool. Always Reddy.</text>
  </g>
</svg>
`

const baseBuffer = await sharp(Buffer.from(svg)).png().toBuffer()

// Composite the actual Reddy Ice logo into the white avatar circle
const logoBuffer = await sharp(LOGO_PATH).resize({ width: 88 }).png().toBuffer()
const logoMeta = await sharp(logoBuffer).metadata()

await sharp(baseBuffer)
  .composite([
    {
      input: logoBuffer,
      left: FRAME_X + 100 - Math.round((logoMeta.width ?? 88) / 2),
      top: FRAME_Y + 100 - Math.round((logoMeta.height ?? 30) / 2),
    },
  ])
  .jpeg({ quality: 92, mozjpeg: true })
  .toFile(OUT_PATH)

const stat = fs.statSync(OUT_PATH)
console.log(`Wrote ${OUT_PATH} (${(stat.size / 1024).toFixed(0)} KB)`)
