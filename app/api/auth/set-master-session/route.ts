import { NextResponse } from "next/server"
import { authAdminClient } from "@/lib/supabase-auth"
import { adminClient } from "@/lib/supabase"
import { setMasterSessionOnResponse } from "@/lib/master-auth"

export async function POST(req: Request) {
  let body: { access_token: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { access_token } = body
  if (!access_token) {
    return NextResponse.json({ error: "missing_token" }, { status: 400 })
  }

  // Validate the token with Supabase
  const { data, error } = await authAdminClient().auth.getUser(access_token)
  if (error || !data.user?.email) {
    return NextResponse.json({ error: "invalid_link" }, { status: 401 })
  }

  const email = data.user.email.toLowerCase()

  // Verify email is on the master portal allow-list
  const { data: portalUser } = await adminClient()
    .from("portal_users")
    .select("email")
    .eq("email", email)
    .maybeSingle()

  if (!portalUser) {
    return NextResponse.json({ error: "not_authorized" }, { status: 403 })
  }

  await adminClient()
    .from("portal_users")
    .update({ last_sign_in_at: new Date().toISOString() })
    .eq("email", email)

  const res = NextResponse.json({ ok: true })
  setMasterSessionOnResponse(res)
  return res
}
