import { NextResponse, type NextRequest } from "next/server"
import { authAdminClient } from "@/lib/supabase-auth"
import { adminClient } from "@/lib/supabase"
import { startMasterSession } from "@/lib/master-auth"

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=missing_code`)
  }

  const supabase = authAdminClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user?.email) {
    return NextResponse.redirect(`${origin}/?error=invalid_link`)
  }

  const email = data.user.email.toLowerCase()

  // Verify email is in the portal allow-list
  const { data: portalUser } = await adminClient()
    .from("portal_users")
    .select("email")
    .eq("email", email)
    .maybeSingle()

  if (!portalUser) {
    return NextResponse.redirect(`${origin}/?error=not_authorized`)
  }

  // Update last sign-in timestamp
  await adminClient()
    .from("portal_users")
    .update({ last_sign_in_at: new Date().toISOString() })
    .eq("email", email)

  // Reuse the existing master session cookie so /master just works
  await startMasterSession()

  return NextResponse.redirect(`${origin}/master`)
}
