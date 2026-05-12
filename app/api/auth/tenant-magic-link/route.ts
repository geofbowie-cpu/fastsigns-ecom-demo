import { NextResponse } from "next/server"
import { getTenantBySlug } from "@/lib/tenant"
import { authAnonClient } from "@/lib/supabase-auth"

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
    return NextResponse.json({ error: "This site doesn't require sign-in" }, { status: 400 })
  }

  const emailDomain = email.split("@")[1]
  if (!domains.includes(emailDomain)) {
    return NextResponse.json(
      { error: `This site is only accessible to ${domains.join(", ")} email addresses.` },
      { status: 403 }
    )
  }

  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000"

  // Use Supabase's own email delivery — no Resend needed.
  // Supabase sends the magic link; after verification it redirects to our callback.
  const { error } = await authAnonClient().auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/tenant-callback?slug=${slug}`,
      shouldCreateUser: true,
    },
  })

  if (error) {
    console.error("signInWithOtp error:", error)
    return NextResponse.json({ error: error.message ?? "Failed to send link" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
