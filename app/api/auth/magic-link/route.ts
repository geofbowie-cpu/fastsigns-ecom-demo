import { NextResponse, type NextRequest } from "next/server"
import { adminClient } from "@/lib/supabase"
import { authAnonClient } from "@/lib/supabase-auth"

export async function POST(req: NextRequest) {
  let body: { email: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 })
  }

  // Check email is in the allowed list. Return 200 regardless to avoid email enumeration.
  const { data: user } = await adminClient()
    .from("portal_users")
    .select("email")
    .eq("email", email)
    .maybeSingle()

  if (!user) return NextResponse.json({ ok: true })

  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000"

  // Supabase sends the magic link via its own email service.
  const { error } = await authAnonClient().auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
      shouldCreateUser: false,
    },
  })

  if (error) {
    console.error("signInWithOtp error:", error)
    // Silent — don't leak whether the email exists.
  }

  return NextResponse.json({ ok: true })
}
