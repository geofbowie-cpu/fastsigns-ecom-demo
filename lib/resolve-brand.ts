// Server-side brand resolver. Takes the jsonb `brand` from a tenant row and
// merges it with sensible generic defaults — so a half-filled tenant still
// renders a complete site.

import type { TenantBrand } from "@/lib/tenant"

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

const GENERIC_DEFAULTS = {
  company: "Demo Storefront",
  tagline: "Enterprise Signage & Branded Products",
  logoText: "DEMO",
  primaryColor: "#1e3a5f",
  accentColor: "#f59e0b",
  heroHeading: "Branded Signage for Every Location",
  heroSubheading:
    "Order, approve, and track signage for all your facilities — from one central storefront connected to your procurement system.",
  trustBadge1: "Fortune 500 Trusted",
  trustBadge2: "2-Year Warranty",
  trustBadge3: "Nationwide Installation",
  trustBadge4: "Net 30 / PO Accepted",
  catSectionHeading: "Shop by Category",
  catSectionSubheading: "Everything your locations need, in one place",
  featuredSectionHeading: "Most Ordered",
  featuredSectionSubheadingTpl: (company: string) => `Top products across ${company} locations`,
  enterpriseHeading: "Connects to your procurement system",
  enterpriseBody:
    "This storefront integrates with enterprise procurement platforms — COUPA, SAP Ariba, Oracle, and others. PO numbers, cost center coding, and approval routing happen at checkout.",
  enterpriseCtaText: "Start an order",
  footerTagline: "Powered by FASTSIGNS Enterprise",
  supportEmail: "support@fastsigns.com",
}

export function resolveBrand(brand: TenantBrand) {
  const primary = brand.primaryColor ?? GENERIC_DEFAULTS.primaryColor
  const accent = brand.accentColor ?? GENERIC_DEFAULTS.accentColor
  const primaryDark = brand.primaryDark ?? adjustBrightness(primary, -25)
  const primaryLight = brand.primaryLight ?? adjustBrightness(primary, 35)
  const company = brand.company ?? GENERIC_DEFAULTS.company

  return {
    company,
    tagline: brand.tagline ?? GENERIC_DEFAULTS.tagline,
    logoText: brand.logoText ?? GENERIC_DEFAULTS.logoText,
    logoImage: brand.logoImage ?? null,
    primaryColor: primary,
    primaryDark,
    primaryLight,
    accentColor: accent,
    accentDark: brand.accentDark ?? adjustBrightness(accent, -20),
    heroHeading: brand.heroHeading ?? GENERIC_DEFAULTS.heroHeading,
    heroSubheading: brand.heroSubheading ?? GENERIC_DEFAULTS.heroSubheading,
    heroCta1Text: brand.heroCta1Text ?? "Browse Products",
    heroCta1Url: brand.heroCta1Url ?? "products",
    heroCta1Color: brand.heroCta1Color ?? accent,
    heroCta2Text: brand.heroCta2Text ?? "",
    heroCta2Url: brand.heroCta2Url ?? "",
    heroBgImage: brand.heroBgImage ?? null,
    heroBgPosition: brand.heroBgPosition ?? { x: 50, y: 50 },
    heroBgZoom: brand.heroBgZoom ?? 1,
    heroBgOverlay: brand.heroBgOverlay ?? 0.5,
    heroGradientFrom: brand.heroGradientFrom ?? primaryDark,
    heroGradientTo: brand.heroGradientTo ?? primary,
    trustBadge1: brand.trustBadge1 ?? GENERIC_DEFAULTS.trustBadge1,
    trustBadge2: brand.trustBadge2 ?? GENERIC_DEFAULTS.trustBadge2,
    trustBadge3: brand.trustBadge3 ?? GENERIC_DEFAULTS.trustBadge3,
    trustBadge4: brand.trustBadge4 ?? GENERIC_DEFAULTS.trustBadge4,
    catSectionHeading: brand.catSectionHeading ?? GENERIC_DEFAULTS.catSectionHeading,
    catSectionSubheading:
      brand.catSectionSubheading ?? GENERIC_DEFAULTS.catSectionSubheading,
    featuredSectionHeading:
      brand.featuredSectionHeading ?? GENERIC_DEFAULTS.featuredSectionHeading,
    featuredSectionSubheading:
      brand.featuredSectionSubheading ??
      GENERIC_DEFAULTS.featuredSectionSubheadingTpl(company),
    enterpriseHeading: brand.enterpriseHeading ?? GENERIC_DEFAULTS.enterpriseHeading,
    enterpriseBody: brand.enterpriseBody ?? GENERIC_DEFAULTS.enterpriseBody,
    enterpriseCtaText: brand.enterpriseCtaText ?? GENERIC_DEFAULTS.enterpriseCtaText,
    footerTagline: brand.footerTagline ?? GENERIC_DEFAULTS.footerTagline,
    supportEmail: brand.supportEmail ?? GENERIC_DEFAULTS.supportEmail,
    showPricing: brand.showPricing ?? true,
    contactName: brand.contactName ?? "",
    contactEmail: brand.contactEmail ?? "",
    contactPhone: brand.contactPhone ?? "",
    orderCtaText: brand.orderCtaText ?? "Contact to order",
  }
}

export type ResolvedBrand = ReturnType<typeof resolveBrand>
