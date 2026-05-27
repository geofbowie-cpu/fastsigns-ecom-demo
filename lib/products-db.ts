// Server-only. Async product/category queries against ecom_demos.products
// and ecom_demos.categories in Supabase. Replaces the static bankProducts /
// bankCategories arrays as the runtime source of truth.
//
// Built-in products have import_tag = NULL.
// Imported products have import_tag = the batch tag string from the CSV import.

import { adminClient } from "@/lib/supabase"
import type { BankProduct, BankCategory, ProductOverrides } from "@/lib/product-bank"

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type DbProduct = BankProduct & { import_tag: string | null }
export type DbCategory = BankCategory

// ─────────────────────────────────────────────────────────────
// Read helpers
// ─────────────────────────────────────────────────────────────

/** All distinct import tags that exist in the products table. */
export async function listImportTags(): Promise<string[]> {
  const { data, error } = await adminClient()
    .from("products")
    .select("import_tag")
    .not("import_tag", "is", null)
    .order("import_tag")
  if (error) {
    console.error("listImportTags failed:", error.message)
    return []
  }
  const seen = new Set<string>()
  for (const row of data ?? []) {
    if (row.import_tag) seen.add(row.import_tag)
  }
  return Array.from(seen)
}

/**
 * Fetch products for a tenant.
 *
 * - Built-in products (import_tag IS NULL) are filtered by enabledCategories
 *   (all if empty).
 * - Imported products are pulled in if their import_tag is in importTags.
 * - Per-product overrides (price / imageUrl / featured / disabled) are applied.
 */
export async function getProducts(opts: {
  enabledCategories?: string[]
  importTags?: string[]
  overrides?: ProductOverrides
}): Promise<BankProduct[]> {
  const { enabledCategories = [], importTags = [], overrides = {} } = opts

  let query = adminClient().from("products").select("*").order("name")

  if (enabledCategories.length > 0 && importTags.length > 0) {
    query = query.or(
      `and(import_tag.is.null,category.in.(${enabledCategories.join(",")})),import_tag.in.(${importTags.join(",")})`
    )
  } else if (enabledCategories.length > 0) {
    query = query.is("import_tag", null).in("category", enabledCategories)
  } else if (importTags.length > 0) {
    // All built-in + matching import tags
    query = query.or(`import_tag.is.null,import_tag.in.(${importTags.join(",")})`)
  }
  // else: no filter → return everything

  const { data, error } = await query
  if (error) {
    console.error("getProducts failed:", error.message)
    return []
  }

  return (data ?? [])
    .filter((p) => !overrides[p.slug]?.disabled)
    .map((p) => {
      const row = dbRowToProduct(p)
      const ov = overrides[row.slug]
      if (!ov) return row
      return {
        ...row,
        startingPrice: ov.price ?? row.startingPrice,
        imageUrl: ov.imageUrl ?? row.imageUrl,
        featured: ov.featured ?? row.featured,
      }
    })
}

/**
 * Fetch categories that are actually represented by the filtered product set.
 */
export async function getCategories(opts: {
  enabledCategories?: string[]
  importTags?: string[]
}): Promise<BankCategory[]> {
  const { enabledCategories = [], importTags = [] } = opts

  // Get the distinct category slugs from the product query first
  let productQuery = adminClient()
    .from("products")
    .select("category")

  if (enabledCategories.length > 0 && importTags.length > 0) {
    productQuery = productQuery.or(
      `and(import_tag.is.null,category.in.(${enabledCategories.join(",")})),import_tag.in.(${importTags.join(",")})`
    )
  } else if (enabledCategories.length > 0) {
    productQuery = productQuery.is("import_tag", null).in("category", enabledCategories)
  } else if (importTags.length > 0) {
    productQuery = productQuery.or(`import_tag.is.null,import_tag.in.(${importTags.join(",")})`)
  }

  const { data: productRows, error: productErr } = await productQuery
  if (productErr) {
    console.error("getCategories (products) failed:", productErr.message)
    return []
  }

  const slugSet = new Set((productRows ?? []).map((r: any) => r.category as string))
  if (slugSet.size === 0) {
    // Fall back: return all categories from DB
    const { data, error } = await adminClient()
      .from("categories")
      .select("*")
      .order("name")
    if (error) return []
    return (data ?? []).map(dbRowToCategory)
  }

  const { data, error } = await adminClient()
    .from("categories")
    .select("*")
    .in("slug", Array.from(slugSet))
    .order("name")
  if (error) {
    console.error("getCategories failed:", error.message)
    return []
  }
  return (data ?? []).map(dbRowToCategory)
}

/** All categories (for the master edit form checkbox list). */
export async function getAllCategories(): Promise<BankCategory[]> {
  const { data, error } = await adminClient()
    .from("categories")
    .select("*")
    .order("name")
  if (error) {
    console.error("getAllCategories failed:", error.message)
    return []
  }
  return (data ?? []).map(dbRowToCategory)
}

/** All products (for the master edit form overrides panel). */
export async function getAllProducts(): Promise<DbProduct[]> {
  const { data, error } = await adminClient()
    .from("products")
    .select("*")
    .order("category")
    .order("name")
  if (error) {
    console.error("getAllProducts failed:", error.message)
    return []
  }
  return (data ?? []).map((r) => ({ ...dbRowToProduct(r), import_tag: r.import_tag ?? null }))
}

// ─────────────────────────────────────────────────────────────
// Write helpers (used by import route)
// ─────────────────────────────────────────────────────────────

export type ProductUpsertRow = {
  slug: string
  name: string
  category: string
  short_desc?: string
  description?: string
  sizes?: string[]
  materials?: string[]
  starting_price?: number
  unit?: string
  gradient_from?: string
  gradient_to?: string
  icon?: string
  featured?: boolean
  tags?: string[]
  lead_time?: string
  image_url?: string | null
  import_tag?: string | null
}

export async function upsertProducts(rows: ProductUpsertRow[]): Promise<{
  inserted: number
  updated: number
  error?: string
}> {
  const { data, error } = await adminClient()
    .from("products")
    .upsert(rows, { onConflict: "slug", ignoreDuplicates: false })
    .select("slug")
  if (error) return { inserted: 0, updated: 0, error: error.message }
  return { inserted: data?.length ?? 0, updated: 0 }
}

export async function deleteProduct(slug: string): Promise<void> {
  const { error } = await adminClient().from("products").delete().eq("slug", slug)
  if (error) throw new Error(error.message)
}

export async function upsertProduct(row: ProductUpsertRow): Promise<DbProduct> {
  const { data, error } = await adminClient()
    .from("products")
    .upsert(row, { onConflict: "slug" })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return { ...dbRowToProduct(data), import_tag: data.import_tag ?? null }
}

export async function getProductBySlug(slug: string): Promise<DbProduct | null> {
  const { data } = await adminClient().from("products").select("*").eq("slug", slug).maybeSingle()
  if (!data) return null
  return { ...dbRowToProduct(data), import_tag: data.import_tag ?? null }
}

export async function upsertCategories(
  rows: { slug: string; name: string; icon?: string; description?: string }[]
): Promise<void> {
  await adminClient()
    .from("categories")
    .upsert(rows, { onConflict: "slug", ignoreDuplicates: false })
}

export type CategoryUpsertRow = {
  slug: string
  name: string
  icon?: string
  description?: string
  image_url?: string | null
  product_slugs?: string[]
}

export async function upsertCategory(row: CategoryUpsertRow): Promise<BankCategory> {
  const { data, error } = await adminClient()
    .from("categories")
    .upsert(row, { onConflict: "slug" })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return dbRowToCategory(data)
}

export async function deleteCategory(slug: string): Promise<void> {
  const { error } = await adminClient()
    .from("categories")
    .delete()
    .eq("slug", slug)
  if (error) throw new Error(error.message)
}

// ─────────────────────────────────────────────────────────────
// Row mappers
// ─────────────────────────────────────────────────────────────

function dbRowToProduct(r: any): BankProduct {
  return {
    slug: r.slug,
    name: r.name,
    category: r.category,
    shortDesc: r.short_desc ?? "",
    description: r.description ?? "",
    sizes: r.sizes ?? [],
    materials: r.materials ?? [],
    startingPrice: Number(r.starting_price ?? 0),
    unit: r.unit ?? "per unit",
    gradientFrom: r.gradient_from ?? "#1e3a5f",
    gradientTo: r.gradient_to ?? "#2d6a9f",
    icon: r.icon ?? "📦",
    featured: r.featured ?? false,
    tags: r.tags ?? [],
    leadTime: r.lead_time ?? "",
    imageUrl: r.image_url ?? undefined,
  }
}

function dbRowToCategory(r: any): BankCategory {
  return {
    slug: r.slug,
    name: r.name,
    icon: r.icon ?? "📦",
    description: r.description ?? "",
    imageUrl: r.image_url ?? undefined,
    productSlugs: r.product_slugs ?? [],
  }
}
