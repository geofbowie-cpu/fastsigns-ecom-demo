import { NextResponse } from "next/server"
import { authAdminClient } from "@/lib/supabase-auth"
import { adminClient } from "@/lib/supabase"
import { setTenantSessionOnResponse } from "@/lib/tenant-auth"

export async function POST(req: Request) {
  let body: { access_token: string; slug: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { access_token, slug } = body
  if (!access_token || !slug) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 })
  }

  // Validate the token with Supabase
  const { data, error } = await authAdminClient().auth.getUser(access_token)
  if (error || !data.user?.email) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }

  const email = data.user.email.toLowerCase()

  // Log visitor
  const { data: tenant } = await adminClient()
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .maybeSingle()

  if (tenant) {
    await adminClient()
      .from("tenant_visitors")
      .upsert(
        { tenant_id: tenant.id, email, last_seen_at: new Date().toISOString(), sign_in_count: 1 },
        { onConflict: "tenant_id,email", ignoreDuplicates: false }
      )
    try {
      await adminClient().rpc("increment_visitor_count", {
        p_tenant_id: tenant.id,
        p_email: email,
      })
    } catch { /* optional */ }
  }

  const res = NextResponse.json({ ok: true })
  setTenantSessionOnResponse(res, slug, email)
  return res
}
