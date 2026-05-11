import { NextResponse } from "next/server"
import { getTenantBySlug } from "@/lib/tenant"
import { authAdminClient } from "@/lib/supabase-auth"

export async function POST(req: Request) {
  let body: { email: string; slug: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  const slug = body.slug?.trim().toLowerCase()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 })
  }
  if (!slug) return NextResponse.json({ error: "Slug required" }, { status: 400 })

  const tenant = await getTenantBySlug(slug)
  if (!tenant) return NextResponse.json({ error: "Site not found" }, { status: 404 })

  const domains = tenant.allowed_domains ?? []
  if (domains.length === 0) {
    // No restriction — shouldn't be hitting this endpoint
    return NextResponse.json({ error: "This site doesn't require sign-in" }, { status: 400 })
  }

  // Check domain
  const emailDomain = email.split("@")[1]
  if (!domains.includes(emailDomain)) {
    return NextResponse.json(
      { error: `This site is only accessible to ${domains.join(", ")} email addresses.` },
      { status: 403 }
    )
  }

  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000"

  // Generate a one-time token via Supabase admin
  const { data, error } = await authAdminClient().auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${siteUrl}/auth/tenant-callback` },
  })

  if (error || !data?.properties?.hashed_token) {
    console.error("generateLink error:", error)
    return NextResponse.json({ error: "Failed to generate link" }, { status: 500 })
  }

  const tokenHash = data.properties.hashed_token
  const magicUrl = `${siteUrl}/auth/tenant-callback?token_hash=${tokenHash}&type=email&slug=${slug}`

  const companyName = (tenant.brand?.company as string) ?? tenant.name

  // Send via Resend
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "FASTSIGNS Demo <noreply@authentum.com>",
      to: [email],
      subject: `Your sign-in link for ${companyName} — FASTSIGNS`,
      html: `
        <p>Hi,</p>
        <p>Click below to view the <strong>${companyName}</strong> FASTSIGNS demo portal. This link expires in 1 hour and can only be used once.</p>
        <p><a href="${magicUrl}" style="background:#1d4ed8;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:600;">View ${companyName} portal →</a></p>
        <p style="color:#6b7280;font-size:13px;">Or copy: ${magicUrl}</p>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px;">If you didn't request this, you can safely ignore it.</p>
      `,
    }),
  })

  return NextResponse.json({ ok: true })
}
