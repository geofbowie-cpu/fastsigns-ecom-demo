// v2 design-system typefaces. Loaded as CSS variables only — applied to
// elements that opt in via the `.variable` classNames below. The global
// body font (set in app/layout.tsx) is untouched, so live sites are
// unaffected until a surface explicitly adopts these.

import { Plus_Jakarta_Sans, Inter } from "next/font/google"

// Display — headings, hero, section titles. Confident geometric grotesque.
export const fontDisplay = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
})

// Body — paragraphs, UI, labels. Clean, highly legible.
export const fontBody = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
})

/** Apply on a v2 surface wrapper to expose both font variables to its subtree. */
export const v2FontVars = `${fontDisplay.variable} ${fontBody.variable}`
