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
  navTextColor?: string
  headerBgColor?: string
  logoHeight?: number
  heroCta1TextColor?: string
  // Hero
  heroHeading?: string
  heroSubheading?: string
  heroCta1Text?: string
  heroCta1Url?: string
  heroCta1Color?: string
  heroCta2Text?: string
  heroCta2Url?: string
  heroCta2Color?: string
  heroCta2TextColor?: string
  heroCta1Icon?: string
  heroCta2Icon?: string
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
  // Live portal — contact / ordering
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  orderCtaText?: string
  quoteCtaText?: string
  // Button styling
  buttonColor?: string
  buttonTextColor?: string
  // Per-tenant category card images (slug → url)
  categoryImages?: Record<string, string>
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
  import_tags: string[]
  status: "demo" | "live"
  admin_email: string | null
  archived: boolean
  allowed_domains: string[]
  require_login: boolean
  enable_cart: boolean
  theme: "legacy" | "v2"
  featured_product_slugs: string[]
  created_at: string
  updated_at: string
}

export type TenantInput = {
  slug: string
  name: string
  brand?: TenantBrand
  enabled_categories?: string[]
  admin_email?: string | null
  require_login?: boolean
  theme?: "legacy" | "v2"
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

/**
 * Clones a site: copies all config (brand, categories, product overrides,
 * theme, cart, featured list, access) into a new tenant with a new slug/name,
 * as a fresh `demo`. Does NOT copy orders/visitors (separate tables) or the
 * id/timestamps. Image URLs are shared — no storage duplication needed.
 */
export async function cloneTenant(
  sourceId: string,
  opts: { name: string; slug: string }
): Promise<Tenant> {
  const admin = adminClient()
  const { data: src, error: srcErr } = await admin
    .from("tenants")
    .select("*")
    .eq("id", sourceId)
    .single()
  if (srcErr || !src) throw new Error("Source site not found")

  const { data, error } = await admin
    .from("tenants")
    .insert({
      slug: opts.slug.toLowerCase().trim(),
      name: opts.name.trim(),
      brand: src.brand ?? {},
      enabled_categories: src.enabled_categories ?? [],
      product_overrides: src.product_overrides ?? {},
      import_tags: src.import_tags ?? [],
      theme: src.theme ?? "legacy",
      enable_cart: src.enable_cart ?? false,
      featured_product_slugs: src.featured_product_slugs ?? [],
      allowed_domains: src.allowed_domains ?? [],
      require_login: src.require_login ?? false,
      admin_email: src.admin_email ?? null,
      status: "demo",
      archived: false,
    })
    .select()
    .single()
  if (error) {
    if (error.code === "23505" || /duplicate|unique/i.test(error.message)) {
      throw new Error(`Slug "${opts.slug}" is already taken`)
    }
    throw new Error(error.message)
  }
  return data as Tenant
}

export async function updateTenant(
  id: string,
  patch: Partial<TenantInput> & { archived?: boolean; status?: "demo" | "live" }
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

export async function deleteTenant(id: string): Promise<void> {
  const { error } = await adminClient()
    .from("tenants")
    .delete()
    .eq("id", id)
  if (error) throw new Error(error.message)
}
