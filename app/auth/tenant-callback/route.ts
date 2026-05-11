import { NextResponse, type NextRequest } from "next/server"
import { authAdminClient } from "@/lib/supabase-auth"
import { adminClient } from "@/lib/supabase"
import { setTenantSessionOnResponse } from "@/lib/tenant-auth"

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type")
  const slug = searchParams.get("slug")

  if (!tokenHash || !type || !slug) {
    return NextResponse.redirect(`${origin}/?error=missing_code`)
  }

  const { data, error } = await authAdminClient().auth.verifyOtp({
    token_hash: tokenHash,
    type: type as "email",
  })

  if (error || !data.user?.email) {
    console.error("tenant verifyOtp error:", error)
    return NextResponse.redirect(`${origin}/sites/${slug}/login?error=invalid_link`)
  }

  const email = data.user.email.toLowerCase()

  // Log / upsert visitor record
  const { data: tenant } = await adminClient()
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .maybeSingle()

  if (tenant) {
    await adminClient()
      .from("tenant_visitors")
      .upsert(
        {
          tenant_id: tenant.id,
          email,
          last_seen_at: new Date().toISOString(),
          sign_in_count: 1,
        },
        {
          onConflict: "tenant_id,email",
          ignoreDuplicates: false,
        }
      )

    // Increment sign_in_count via raw SQL workaround
    await adminClient().rpc("increment_visitor_count", {
      p_tenant_id: tenant.id,
      p_email: email,
    }).then(() => {}).catch(() => {}) // optional — don't fail if RPC doesn't exist yet
  }

  const res = NextResponse.redirect(`${origin}/sites/${slug}`)
  setTenantSessionOnResponse(res, slug, email)
  return res
}
