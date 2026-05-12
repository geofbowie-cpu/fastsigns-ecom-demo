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

    // Increment sign_in_count (best-effort, ignore if RPC doesn't exist)
    try {
      await adminClient().rpc("increment_visitor_count", {
        p_tenant_id: tenant.id,
        p_email: email,
      })
    } catch { /* optional RPC */ }
  }

  // If the root is rewritten to this tenant (fastsigns-demos.vercel.app),
  // send them to / so the URL stays clean. Otherwise use the slug path.
  const rootRewrittenSlugs = ["reddy-ice"]
  const redirectPath = rootRewrittenSlugs.includes(slug) ? "/" : `/sites/${slug}`
  const res = NextResponse.redirect(`${origin}${redirectPath}`)
  setTenantSessionOnResponse(res, slug, email)
  return res
}
