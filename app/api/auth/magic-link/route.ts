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

  // Check email is in the allowed list
  const { data: user } = await adminClient()
    .from("portal_users")
    .select("email")
    .eq("email", email)
    .maybeSingle()

  if (!user) {
    // Return 200 to avoid email enumeration — UI shows the same message either way
    return NextResponse.json({ ok: true })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

  await authAnonClient().auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
      shouldCreateUser: true,
    },
  })

  return NextResponse.json({ ok: true })
}
