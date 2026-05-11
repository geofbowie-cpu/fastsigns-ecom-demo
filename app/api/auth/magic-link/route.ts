import { NextResponse, type NextRequest } from "next/server"
import { adminClient } from "@/lib/supabase"
import { authAdminClient } from "@/lib/supabase-auth"

export async function POST(req: NextRequest) {
  let body: { email: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 })
  }

  // Check email is in the allowed list
  const { data: user } = await adminClient()
    .from("portal_users")
    .select("email")
    .eq("email", email)
    .maybeSingle()

  // Return 200 regardless to avoid email enumeration
  if (!user) return NextResponse.json({ ok: true })

  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000"

  // Generate a server-side magic link token (no PKCE, no Supabase email)
  const { data, error } = await authAdminClient().auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${siteUrl}/auth/callback` },
  })

  if (error || !data?.properties?.hashed_token) {
    console.error("generateLink error:", error)
    return NextResponse.json({ ok: true }) // silent fail
  }

  const tokenHash = data.properties.hashed_token
  const magicUrl = `${siteUrl}/auth/callback?token_hash=${tokenHash}&type=email`

  // Send via Resend
  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "FASTSIGNS Demo <noreply@authentum.com>",
      to: [email],
      subject: "Your sign-in link for FASTSIGNS Demo Builder",
      html: `
        <p>Hi,</p>
        <p>Click the link below to sign in to the FASTSIGNS Demo Builder. This link expires in 1 hour and can only be used once.</p>
        <p><a href="${magicUrl}" style="background:#1d4ed8;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:600;">Sign in to Demo Builder</a></p>
        <p style="color:#6b7280;font-size:13px;">Or copy this URL: ${magicUrl}</p>
      `,
    }),
  })

  if (!resendRes.ok) {
    console.error("Resend error:", await resendRes.text())
  }

  return NextResponse.json({ ok: true })
}
