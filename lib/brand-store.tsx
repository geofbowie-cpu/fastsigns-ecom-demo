"use client"

import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { brand as defaultBrand } from "@/brand.config"

const STORAGE_KEY = "ecom_brand_reddy_v1"

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
export type BrandOverrides = Partial<{
  // Identity
  company: string
  tagline: string
  logoText: string
  logoImage: string | null
  // Nav
  navBgColor: string
  navTextColor: string
  // Colors
  primaryColor: string
  primaryDark: string
  primaryLight: string
  accentColor: string
  // Hero copy
  heroHeading: string
  heroSubheading: string
  // Hero CTA 1 (primary)
  heroCta1Text: string
  heroCta1Url: string
  heroCta1Color: string
  // Hero CTA 2 (secondary / ghost)
  heroCta2Text: string
  heroCta2Url: string
  // Hero background
  heroBgImage: string | null
  heroBgPosition: { x: number; y: number }
  heroBgZoom: number
  heroBgOverlay: number        // 0–0.85
  heroGradientFrom: string
  heroGradientTo: string
  // Trust badges
  trustBadge1: string
  trustBadge2: string
  trustBadge3: string
  trustBadge4: string
  // Category section
  catSectionHeading: string
  catSectionSubheading: string
  // Featured section
  featuredSectionHeading: string
  featuredSectionSubheading: string
  // Enterprise callout
  enterpriseHeading: string
  enterpriseBody: string
  enterpriseCtaText: string
}>

// ─────────────────────────────────────────────────────────────
// Color helpers
// ─────────────────────────────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0"))
      .join("")
  )
}

function adjustBrightness(hex: string, amount: number): string {
  try {
    const [r, g, b] = hexToRgb(hex)
    return rgbToHex(r + amount, g + amount, b + amount)
  } catch {
    return hex
  }
}

// ─────────────────────────────────────────────────────────────
// buildBrand — merge overrides with brand.config defaults
// ─────────────────────────────────────────────────────────────
export function buildBrand(overrides: BrandOverrides) {
  const base = { ...defaultBrand, ...overrides }

  if (overrides.primaryColor) {
    if (!overrides.primaryDark) base.primaryDark = adjustBrightness(overrides.primaryColor, -25)
    if (!overrides.primaryLight) base.primaryLight = adjustBrightness(overrides.primaryColor, 35)
  }

  const accentColor = overrides.accentColor ?? base.accentColor

  return {
    ...base,
    navBgColor: overrides.navBgColor ?? base.primaryColor,
    navTextColor: overrides.navTextColor ?? "#ffffff",
    heroBgImage: overrides.heroBgImage ?? null,
    heroBgPosition: overrides.heroBgPosition ?? { x: 50, y: 50 },
    heroBgZoom: overrides.heroBgZoom ?? 1,
    heroBgOverlay: overrides.heroBgOverlay ?? 0.5,
    heroCta1Text: overrides.heroCta1Text ?? (base as any).heroCta1Text ?? base.heroCtaText ?? "Shop Now",
    heroCta1Url: overrides.heroCta1Url ?? (base as any).heroCta1Url ?? "/products",
    heroCta1Color: overrides.heroCta1Color ?? (base as any).heroCta1Color ?? accentColor,
    heroCta2Text: overrides.heroCta2Text ?? (base as any).heroCta2Text ?? "Trade Show Displays",
    heroCta2Url: overrides.heroCta2Url ?? (base as any).heroCta2Url ?? "/products?category=trade-show",
    heroGradientFrom: overrides.heroGradientFrom ?? (base as any).heroGradientFrom ?? base.primaryDark,
    heroGradientTo: overrides.heroGradientTo ?? (base as any).heroGradientTo ?? base.primaryColor,
    trustBadge1: overrides.trustBadge1 ?? (base as any).trustBadge1 ?? "Fortune 500 Trusted",
    trustBadge2: overrides.trustBadge2 ?? (base as any).trustBadge2 ?? "2-Year Warranty",
    trustBadge3: overrides.trustBadge3 ?? (base as any).trustBadge3 ?? "Nationwide Installation",
    trustBadge4: overrides.trustBadge4 ?? (base as any).trustBadge4 ?? "Net 30 / PO Accepted",
    catSectionHeading: overrides.catSectionHeading ?? (base as any).catSectionHeading ?? "Shop by Category",
    catSectionSubheading: overrides.catSectionSubheading ?? (base as any).catSectionSubheading ?? "Everything your locations need, in one place",
    featuredSectionHeading: overrides.featuredSectionHeading ?? (base as any).featuredSectionHeading ?? "Most Ordered",
    featuredSectionSubheading: overrides.featuredSectionSubheading ?? (base as any).featuredSectionSubheading ?? `Top products across ${base.company} locations`,
    enterpriseHeading: overrides.enterpriseHeading ?? (base as any).enterpriseHeading ?? "Connects to your procurement system",
    enterpriseBody: overrides.enterpriseBody ?? (base as any).enterpriseBody ?? "This storefront integrates directly with enterprise procurement platforms — COUPA, SAP Ariba, Oracle, and others. PO numbers, cost center coding, and approval routing happen right at checkout. No shadow spend. No rogue ordering.",
    enterpriseCtaText: overrides.enterpriseCtaText ?? (base as any).enterpriseCtaText ?? "Start an order",
  }
}

function loadOverrides(): BrandOverrides {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

// ─────────────────────────────────────────────────────────────
// Context — BrandProvider lives at the root layout so all pages
// share one React state instance. When save() is called from
// settings, React re-renders every consumer automatically.
// ─────────────────────────────────────────────────────────────
type BrandStoreValue = {
  brand: ReturnType<typeof buildBrand>
  overrides: BrandOverrides
  save: (updates: BrandOverrides) => void
  reset: () => void
  saved: boolean
}

const BrandContext = createContext<BrandStoreValue | null>(null)

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [overrides, setOverrides] = useState<BrandOverrides>({})
  const [saved, setSaved] = useState(false)

  // Load from localStorage after hydration
  useEffect(() => {
    setOverrides(loadOverrides())
  }, [])

  const save = useCallback((updates: BrandOverrides) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updates))
    } catch {}
    setOverrides({ ...updates })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }, [])

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {}
    setOverrides({})
  }, [])

  return (
    <BrandContext.Provider value={{ brand: buildBrand(overrides), overrides, save, reset, saved }}>
      {children}
    </BrandContext.Provider>
  )
}

export function useBrandStore() {
  const ctx = useContext(BrandContext)
  if (!ctx) throw new Error("useBrandStore must be used within BrandProvider")
  return ctx
}
