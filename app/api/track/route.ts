import { NextResponse } from "next/server"
import { adminClient } from "@/lib/supabase"

export const runtime = "nodejs"

// Public beacon for in-app traffic/event logging. Insert-only into site_events.
// Whitelisted events + bounded props keep it from being a general write hole.
const ALLOWED = new Set([
  "page_view",
  "product_view",
  "cta_click",
  "email_click",
  "phone_click",
  "search",
  "quote_request",
  "category_click",
])

export async function POST(req: Request) {
  let body: { event?: string; tenant_slug?: string; props?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const event = typeof body.event === "string" ? body.event : ""
  const tenant_slug =
    typeof body.tenant_slug === "string" ? body.tenant_slug.slice(0, 80) : ""
  if (!ALLOWED.has(event) || !tenant_slug) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  // Bound the props payload so a bad/hostile client can't store megabytes.
  let props: unknown = body.props ?? {}
  try {
    if (JSON.stringify(props).length > 2000) props = {}
  } catch {
    props = {}
  }

  try {
    await adminClient().from("site_events").insert({ tenant_slug, event, props })
  } catch {
    // Never surface storage errors to the beacon caller.
  }
  return NextResponse.json({ ok: true })
}
