import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { adminClient } from "@/lib/supabase"
import { startMasterSession } from "@/lib/master-auth"

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=missing_code`)
  }

  // Build a response we can write cookies onto
  const redirectSuccess = NextResponse.redirect(`${origin}/master`)
  const redirectFail = (err: string) => NextResponse.redirect(`${origin}/?error=${err}`)

  // Use @supabase/ssr so it can read the PKCE verifier cookie set during signInWithOtp
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            redirectSuccess.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user?.email) {
    return redirectFail("invalid_link")
  }

  const email = data.user.email.toLowerCase()

  // Verify email is in the portal allow-list
  const { data: portalUser } = await adminClient()
    .from("portal_users")
    .select("email")
    .eq("email", email)
    .maybeSingle()

  if (!portalUser) {
    return redirectFail("not_authorized")
  }

  // Update last sign-in timestamp
  await adminClient()
    .from("portal_users")
    .update({ last_sign_in_at: new Date().toISOString() })
    .eq("email", email)

  // Set the master session cookie (next/headers writes it into the response automatically)
  await startMasterSession()

  return redirectSuccess
}
