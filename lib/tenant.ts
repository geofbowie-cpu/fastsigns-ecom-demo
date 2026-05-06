// Tenant data model + server-side fetchers.
// `brand` is a flexible jsonb blob that mirrors brand.config.ts shape.

import { adminClient, publicClient } from "@/lib/supabase"
import type { ProductOverrides } from "@/lib/product-bank"

export type TenantBrand = {
  // Identity
  company?: string
  tagline?: string
  logoText?: string
  logoImage?: string | null
  // Colors
  primaryColor?: string
  primaryDark?: string
  primaryLight?: string
  accentColor?: string
  accentDark?: string
  // Hero
  heroHeading?: string
  heroSubheading?: string
  heroCta1Text?: string
  heroCta1Url?: string
  heroCta1Color?: string
  heroCta2Text?: string
  heroCta2Url?: string
  heroBgImage?: string | null
  heroBgPosition?: { x: number; y: number }
  heroBgZoom?: number
  heroBgOverlay?: number
  heroGradientFrom?: string
  heroGradientTo?: string
  // Trust
  trustBadge1?: string
  trustBadge2?: string
  trustBadge3?: string
  trustBadge4?: string
  // Sections
  catSectionHeading?: string
  catSectionSubheading?: string
  featuredSectionHeading?: string
  featuredSectionSubheading?: string
  enterpriseHeading?: string
  enterpriseBody?: string
  enterpriseCtaText?: string
  // Footer / support
  footerTagline?: string
  supportEmail?: string
  // Display
  showPricing?: boolean
  // Procurement
  procurementSystem?: "COUPA" | "SAP Ariba" | "Oracle" | "Custom" | null
  procurementLabel?: string
  costCenters?: string[]
  approvers?: string[]
}

export type Tenant = {
  id: string
  slug: string
  name: string
  brand: TenantBrand
  enabled_categories: string[]
  product_overrides: ProductOverrides
  admin_email: string | null
  archived: boolean
  created_at: string
  updated_at: string
}

export type TenantInput = {
  slug: string
  name: string
  brand?: TenantBrand
  enabled_categories?: string[]
  admin_email?: string | null
}

// ─────────────────────────────────────────────────────────────
// Read paths (public)
// ─────────────────────────────────────────────────────────────

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const { data, error } = await publicClient()
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .eq("archived", false)
    .maybeSingle()
  if (error) {
    console.error("getTenantBySlug failed:", error.message)
    return null
  }
  return (data as Tenant) ?? null
}

export async function listTenants(): Promise<Tenant[]> {
  const { data, error } = await adminClient()
    .from("tenants")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) throw new Error(error.message)
  return (data as Tenant[]) ?? []
}

// ─────────────────────────────────────────────────────────────
// Write paths (admin / service-role only)
// ─────────────────────────────────────────────────────────────

export async function createTenant(input: TenantInput): Promise<Tenant> {
  const { data, error } = await adminClient()
    .from("tenants")
    .insert({
      slug: input.slug.toLowerCase().trim(),
      name: input.name.trim(),
      brand: input.brand ?? {},
      enabled_categories: input.enabled_categories ?? [],
      admin_email: input.admin_email ?? null,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Tenant
}

export async function updateTenant(
  id: string,
  patch: Partial<TenantInput> & { archived?: boolean }
): Promise<Tenant> {
  const { data, error } = await adminClient()
    .from("tenants")
    .update(patch)
    .eq("id", id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Tenant
}

export async function archiveTenant(id: string): Promise<void> {
  const { error } = await adminClient()
    .from("tenants")
    .update({ archived: true })
    .eq("id", id)
  if (error) throw new Error(error.message)
}
