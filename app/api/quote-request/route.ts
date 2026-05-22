// Receives quote-form submissions from tenant product pages (demo mode).
// Stores them in ecom_demos.quote_requests. No auth — public submission
// from any tenant portal.

import { NextResponse } from "next/server"
import { adminClient } from "@/lib/supabase"
import { getTenantBySlug } from "@/lib/tenant"

export async function POST(req: Request) {
  let body: {
    tenant_slug: string
    product_slug: string
    product_name: string
    email: string
    first_name?: string
    last_name?: string
    comments?: string
  }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const email = body.email?.trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
  }
  if (!body.tenant_slug || !body.product_slug || !body.product_name) {
    return NextResponse.json({ error: "Missing tenant or product info" }, { status: 400 })
  }

  // Look up tenant ID for the FK
  const tenant = await getTenantBySlug(body.tenant_slug)
  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
  }

  const { error } = await adminClient()
    .from("quote_requests")
    .insert({
      tenant_id: tenant.id,
      tenant_slug: body.tenant_slug,
      product_slug: body.product_slug,
      product_name: body.product_name,
      email,
      first_name: body.first_name?.trim() || null,
      last_name: body.last_name?.trim() || null,
      comments: body.comments?.trim() || null,
    })

  if (error) {
    console.error("quote_requests insert error:", error)
    return NextResponse.json({ error: "Failed to save request" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
