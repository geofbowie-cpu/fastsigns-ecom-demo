// Receives quote-form submissions from tenant product pages (demo mode).
// Stores them in ecom_demos.quote_requests. No auth — public submission
// from any tenant portal.

import { NextResponse } from "next/server"
import { adminClient } from "@/lib/supabase"
import { getTenantBySlug } from "@/lib/tenant"
import { apiError, parseBody } from "@/lib/api-helpers"
import { logger } from "@/lib/logger"
import { QuoteRequestSchema } from "@/lib/schemas"

export async function POST(req: Request) {
  const result = QuoteRequestSchema.safeParse(await parseBody(req))
  if (!result.success) return apiError(result.error.issues[0].message)
  const body = result.data

  // Look up tenant ID for the FK
  const tenant = await getTenantBySlug(body.tenant_slug)
  if (!tenant) {
    return apiError("Tenant not found", 404)
  }

  const { error } = await adminClient()
    .from("quote_requests")
    .insert({
      tenant_id: tenant.id,
      tenant_slug: body.tenant_slug,
      product_slug: body.product_slug,
      product_name: body.product_name,
      email: body.email.trim().toLowerCase(),
      first_name: body.first_name?.trim() || null,
      last_name: body.last_name?.trim() || null,
      comments: body.comments?.trim() || null,
    })

  if (error) {
    logger.error("quote-request.insert failed", { error: error.message, tenant_slug: body.tenant_slug })
    return apiError("Failed to save request", 500)
  }

  logger.info("quote-request.created", { tenant_slug: body.tenant_slug, product_slug: body.product_slug })
  return NextResponse.json({ ok: true })
}
