import { z } from "zod"

// ── Tenants ──────────────────────────────────────────────────
export const TenantCreateSchema = z.object({
  slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/, { message: "slug must be lowercase alphanumeric + hyphens" }),
  name: z.string().min(1).max(120),
  brand: z.record(z.string(), z.unknown()).optional(),
  enabled_categories: z.array(z.string()).optional(),
  admin_email: z.string().email().nullable().optional(),
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
  archived: z.boolean().optional(),
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

// ── Users ────────────────────────────────────────────────────
export const UserEmailSchema = z.object({
  email: z.string().email(),
})

// ── Brandfetch ───────────────────────────────────────────────
export const BrandfetchSchema = z.object({
  domain: z.string().min(1).max(253),
  slug: z.string().optional(),
})
