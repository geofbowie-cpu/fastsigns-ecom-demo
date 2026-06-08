import { NextResponse } from "next/server"
import { adminClient } from "@/lib/supabase"
import { authAnonClient } from "@/lib/supabase-auth"

export async function POST(req: Request) {
  let body: { email: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 })
  }

  // Check email is on the master allow-list
  const { data: portalUser } = await adminClient()
    .from("portal_users")
    .select("email")
    .eq("email", email)
    .maybeSingle()

  if (!portalUser) {
    return NextResponse.json(
      { error: "This email isn't authorised for admin access." },
      { status: 403 }
    )
  }

  const siteUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : (process.env.SITE_URL ?? "http://localhost:3000")

  const { error } = await authAnonClient().auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/master-callback`,
      shouldCreateUser: true,
    },
  })

  if (error) {
    console.error("master signInWithOtp error:", error)
    return NextResponse.json({ error: error.message ?? "Failed to send link" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
