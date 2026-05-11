import { NextResponse, type NextRequest } from "next/server"
import { authAdminClient } from "@/lib/supabase-auth"
import { adminClient } from "@/lib/supabase"
import { startMasterSession } from "@/lib/master-auth"

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type")

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${origin}/?error=missing_code`)
  }

  // Verify the token hash — no PKCE needed with this approach
  const supabase = authAdminClient()
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as "email",
  })

  if (error || !data.user?.email) {
    console.error("verifyOtp error:", error)
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

  // Set master session cookie and redirect into the app
  await startMasterSession()

  return NextResponse.redirect(`${origin}/master`)
}
