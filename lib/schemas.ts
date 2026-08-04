import { z } from "zod"

// ── Tenants ──────────────────────────────────────────────────
export const TenantCreateSchema = z.object({
  slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/, { message: "slug must be lowercase alphanumeric + hyphens" }),
  name: z.string().min(1).max(120),
  brand: z.record(z.string(), z.unknown()).optional(),
  enabled_categories: z.array(z.string()).optional(),
  admin_email: z.string().email().nullable().optional(),
})

export const TenantCloneSchema = z.object({
  slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/, { message: "slug must be lowercase alphanumeric + hyphens" }),
  name: z.string().min(1).max(120),
})

export const TenantPatchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  brand: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(["demo", "live"]).optional(),
  enabled_categories: z.array(z.string()).optional(),
  import_tags: z.array(z.string()).optional(),
  product_overrides: z.record(z.string(), z.unknown()).optional(),
  admin_email: z.string().email().nullable().optional(),
  allowed_domains: z.array(z.string()).optional(),
  require_login: z.boolean().optional(),
  enable_cart: z.boolean().optional(),
  archived: z.boolean().optional(),
  theme: z.enum(["legacy", "v2"]).optional(),
  featured_product_slugs: z.array(z.string()).optional(),
})

// ── Cart → purchase order ────────────────────────────────────
export const CartSubmitSchema = z.object({
  slug: z.string().min(1),
  items: z
    .array(
      z.object({
        slug: z.string().min(1),
        name: z.string().min(1).max(200),
        qty: z.number().int().min(1).max(9999),
        note: z.string().max(1000).optional(),
      })
    )
    .min(1, { message: "Your cart is empty." }),
  orderNotes: z.string().max(2000).optional(),
  contact: z.object({
    firstName: z.string().trim().min(1, { message: "First name is required." }).max(100),
    lastName: z.string().trim().min(1, { message: "Last name is required." }).max(100),
    email: z.string().trim().email({ message: "A valid business email is required." }).max(200),
    phone: z.string().trim().min(7, { message: "A valid phone number is required." }).max(40),
  }),
})

// ── Categories ───────────────────────────────────────────────
export const CategoryUpsertSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, { message: "slug must be lowercase alphanumeric + hyphens" }).optional(),
  name: z.string().min(1).max(100),
  icon: z.string().max(50).optional(),
  description: z.string().max(500).optional(),
  image_url: z.string().url().nullable().optional(),
  product_slugs: z.array(z.string()).optional(),
})

// ── Quote requests ───────────────────────────────────────────
export const QuoteRequestSchema = z.object({
  tenant_slug: z.string().min(1),
  product_slug: z.string().min(1),
  product_name: z.string().min(1).max(200),
  email: z.string().email(),
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  comments: z.string().max(2000).optional(),
})

// ── Products ─────────────────────────────────────────────────
export const ProductUpsertSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, "slug must be lowercase alphanumeric + hyphens").optional(),
  name: z.string().min(1).max(200),
  category: z.string().min(1),
  short_desc: z.string().max(500).optional(),
  description: z.string().max(5000).optional(),
  starting_price: z.number().min(0).optional(),
  unit: z.string().max(50).optional(),
  icon: z.string().max(50).optional(),
  featured: z.boolean().optional(),
  image_url: z.string().url().nullable().optional(),
  import_tag: z.string().nullable().optional(),
  lead_time: z.string().max(100).optional(),
  min_order_qty: z.number().int().min(1).max(1000000).nullable().optional(),
  order_increment: z.number().int().min(1).max(1000000).nullable().optional(),
})

// ── Users ────────────────────────────────────────────────────
export const UserEmailSchema = z.object({
  email: z.string().email(),
})

// ── Brandfetch ───────────────────────────────────────────────
export const BrandfetchSchema = z.object({
  domain: z.string().min(1).max(253),
  slug: z.string().nullable().optional(),
})
