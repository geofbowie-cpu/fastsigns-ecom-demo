import { NextResponse, type NextRequest } from "next/server"
import { authAdminClient } from "@/lib/supabase-auth"
import { adminClient } from "@/lib/supabase"
import { setMasterSessionOnResponse } from "@/lib/master-auth"

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type")

  // ── Supabase implicit-flow redirect ──────────────────────────────────────
  // After verifying the magic link Supabase redirects here with the
  // access_token in the URL *hash*. Hashes never reach the server, so we
  // return a tiny page whose inline script posts the token to
  // /api/auth/set-master-session.
  if (!tokenHash) {
    const html = `<!doctype html><html><head><meta charset="utf-8">
<script>
(function(){
  var h = new URLSearchParams(location.hash.slice(1));
  var token = h.get('access_token');
  if (!token) { location.replace('/master/login?error=missing_code'); return; }
  fetch('/api/auth/set-master-session', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ access_token: token })
  }).then(function(r){
    location.replace(r.ok ? '/master' : '/master/login?error=auth_failed');
  });
})();
</script>
</head><body>Signing you in…</body></html>`
    return new Response(html, { headers: { "Content-Type": "text/html" } })
  }

  // ── Legacy token_hash flow (kept for backward compatibility) ─────────────
  if (!type) {
    return NextResponse.redirect(`${origin}/master/login?error=missing_code`)
  }

  const { data, error } = await authAdminClient().auth.verifyOtp({
    token_hash: tokenHash,
    type: type as "email",
  })

  if (error || !data.user?.email) {
    console.error("master verifyOtp error:", error)
    return NextResponse.redirect(`${origin}/master/login?error=invalid_link`)
  }

  const email = data.user.email.toLowerCase()

  // Verify email is on the allow-list
  const { data: portalUser } = await adminClient()
    .from("portal_users")
    .select("email")
    .eq("email", email)
    .maybeSingle()

  if (!portalUser) {
    return NextResponse.redirect(`${origin}/master/login?error=not_authorized`)
  }

  await adminClient()
    .from("portal_users")
    .update({ last_sign_in_at: new Date().toISOString() })
    .eq("email", email)

  const res = NextResponse.redirect(`${origin}/master`)
  setMasterSessionOnResponse(res)
  res.cookies.set("ecom_master_email", email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
  return res
}
