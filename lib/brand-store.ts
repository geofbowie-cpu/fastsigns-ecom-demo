"use client"

import { useState, useEffect, useCallback } from "react"
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
  // Hero CTA 1 (primary)
  heroCta1Text: string
  heroCta1Url: string
  heroCta1Color: string
  // Hero CTA 2 (secondary / ghost)
  heroCta2Text: string
  heroCta2Url: string
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

// ─────────────────────────────────────────────────────────────
// Module-level singleton — all useBrandStore() calls share state.
// Without this, each component reads localStorage once on mount
// and never sees updates made by other components.
// ─────────────────────────────────────────────────────────────
function loadOverrides(): BrandOverrides {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

let _overrides: BrandOverrides = {}
const _listeners = new Set<() => void>()

function initStore() {
  if (typeof window !== "undefined" && Object.keys(_overrides).length === 0) {
    _overrides = loadOverrides()
  }
}

function notifyAll() {
  _listeners.forEach((fn) => fn())
}

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

export function buildBrand(overrides: BrandOverrides) {
  const base = { ...defaultBrand, ...overrides }

  // Auto-derive dark/light from primary if overridden
  if (overrides.primaryColor) {
    if (!overrides.primaryDark) base.primaryDark = adjustBrightness(overrides.primaryColor, -25)
    if (!overrides.primaryLight) base.primaryLight = adjustBrightness(overrides.primaryColor, 35)
  }

  const accentColor = overrides.accentColor ?? base.accentColor

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
    // Hero CTAs
    heroCta1Text: overrides.heroCta1Text ?? base.heroCtaText ?? "Shop Now",
    heroCta1Url: overrides.heroCta1Url ?? "/products",
    heroCta1Color: overrides.heroCta1Color ?? accentColor,
    heroCta2Text: overrides.heroCta2Text ?? "Trade Show Displays",
    heroCta2Url: overrides.heroCta2Url ?? "/products?category=trade-show",
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

export function useBrandStore() {
  // Subscribe to singleton — force re-render when notifyAll() fires
  const [tick, setTick] = useState(0)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    initStore()
    setTick((t) => t + 1) // pick up any overrides loaded after SSR
    const handler = () => setTick((t) => t + 1)
    _listeners.add(handler)
    return () => { _listeners.delete(handler) }
  }, [])

  const save = useCallback((updates: BrandOverrides) => {
    _overrides = { ...updates }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(_overrides))
    } catch {}
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    notifyAll()
  }, [])

  const reset = useCallback(() => {
    _overrides = {}
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {}
    notifyAll()
  }, [])

  // Suppress unused warning — tick drives re-renders, brand is derived fresh each render
  void tick

  return { brand: buildBrand(_overrides), overrides: _overrides, save, reset, saved }
}
