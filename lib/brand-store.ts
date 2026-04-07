"use client"

import { useState, useCallback } from "react"
import { brand as defaultBrand } from "@/brand.config"

const STORAGE_KEY = "ecom_brand_v1"

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
  heroCtaText: string
  // Hero background
  heroBgImage: string | null
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

export function buildBrand(overrides: BrandOverrides) {
  const base = { ...defaultBrand, ...overrides }

  // Auto-derive dark/light from primary if overridden
  if (overrides.primaryColor) {
    if (!overrides.primaryDark) base.primaryDark = adjustBrightness(overrides.primaryColor, -25)
    if (!overrides.primaryLight) base.primaryLight = adjustBrightness(overrides.primaryColor, 35)
  }

  return {
    ...base,
    // Nav
    navBgColor: overrides.navBgColor ?? base.primaryColor,
    navTextColor: overrides.navTextColor ?? "#ffffff",
    // Hero bg
    heroBgImage: overrides.heroBgImage ?? null,
    heroBgOverlay: overrides.heroBgOverlay ?? 0.5,
    heroGradientFrom: overrides.heroGradientFrom ?? base.primaryDark,
    heroGradientTo: overrides.heroGradientTo ?? base.primaryColor,
    // Trust badges
    trustBadge1: overrides.trustBadge1 ?? "Fortune 500 Trusted",
    trustBadge2: overrides.trustBadge2 ?? "2-Year Warranty",
    trustBadge3: overrides.trustBadge3 ?? "Nationwide Installation",
    trustBadge4: overrides.trustBadge4 ?? "Net 30 / PO Accepted",
    // Section copy
    catSectionHeading: overrides.catSectionHeading ?? "Shop by Category",
    catSectionSubheading: overrides.catSectionSubheading ?? "Everything your locations need, in one place",
    featuredSectionHeading: overrides.featuredSectionHeading ?? "Most Ordered",
    featuredSectionSubheading:
      overrides.featuredSectionSubheading ?? `Top products across ${base.company} locations`,
    // Enterprise callout
    enterpriseHeading: overrides.enterpriseHeading ?? "Connects to your procurement system",
    enterpriseBody:
      overrides.enterpriseBody ??
      "This storefront integrates directly with enterprise procurement platforms — COUPA, SAP Ariba, Oracle, and others. PO numbers, cost center coding, and approval routing happen right at checkout. No shadow spend. No rogue ordering.",
    enterpriseCtaText: overrides.enterpriseCtaText ?? "Start an order",
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

export function useBrandStore() {
  const [overrides, setOverrides] = useState<BrandOverrides>(loadOverrides)
  const [saved, setSaved] = useState(false)

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

  return { brand: buildBrand(overrides), overrides, save, reset, saved }
}
