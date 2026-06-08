import { NextResponse, type NextRequest } from "next/server"
import { authAdminClient } from "@/lib/supabase-auth"
import { adminClient } from "@/lib/supabase"
import { setTenantSessionOnResponse } from "@/lib/tenant-auth"

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type")
  const slug = searchParams.get("slug") ?? ""

  // ── Supabase implicit-flow redirect ──────────────────────────────────────
  // After verifying the magic link Supabase redirects here with the
  // access_token in the URL *hash* (e.g. #access_token=...&type=magiclink).
  // Hashes are never sent to the server, so we return a tiny HTML page whose
  // inline script reads the hash and hands it to /api/auth/set-tenant-session.
  if (!tokenHash) {
    const html = `<!doctype html><html><head><meta charset="utf-8">
<script>
(function(){
  var h = new URLSearchParams(location.hash.slice(1));
  var token = h.get('access_token');
  var slug  = new URLSearchParams(location.search).get('slug') || '';
  if (!token || !slug) { location.replace('/?error=missing_code'); return; }
  fetch('/api/auth/set-tenant-session', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ access_token: token, slug: slug })
  }).then(function(r){
    location.replace(r.ok ? '/sites/' + slug : '/sites/' + slug + '/login?error=auth_failed');
  });
})();
</script>
</head><body>Signing you in…</body></html>`
    return new Response(html, { headers: { "Content-Type": "text/html" } })
  }

  // ── Legacy token_hash flow (kept for backward compatibility) ─────────────
  if (!type || !slug) {
    return NextResponse.redirect(`${origin}/?error=missing_code`)
  }

  const { data, error } = await authAdminClient().auth.verifyOtp({
    token_hash: tokenHash,
    type: type as "magiclink" | "email",
  })

  if (error || !data.user?.email) {
    console.error("tenant verifyOtp error:", error)
    return NextResponse.redirect(`${origin}/sites/${slug}/login?error=invalid_link`)
  }

  const email = data.user.email.toLowerCase()
  await logVisitor(slug, email)

  const res = NextResponse.redirect(`${origin}/sites/${slug}`)
  setTenantSessionOnResponse(res, slug, email)
  return res
}

async function logVisitor(slug: string, email: string) {
  const { data: tenant } = await adminClient()
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .maybeSingle()

  if (!tenant) return

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
  } catch { /* optional RPC */ }
}
