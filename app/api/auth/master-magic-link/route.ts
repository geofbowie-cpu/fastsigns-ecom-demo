import { NextResponse } from "next/server"
import { adminClient } from "@/lib/supabase"
import { sendMagicLink } from "@/lib/send-magic-link"

export async function POST(req: Request) {
  let body: { email: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 })
  }

  // Check email is on the master allow-list
  const { data: portalUser } = await adminClient()
    .from("portal_users")
    .select("email")
    .eq("email", email)
    .maybeSingle()

  if (!portalUser) {
    return NextResponse.json(
      { error: "This email isn't authorized for admin access. Contact your administrator to be added." },
      { status: 403 }
    )
  }

  const result = await sendMagicLink({
    email,
    callbackPath: "/auth/master-callback",
    siteName: "FASTSIGNS Demo Builder",
    brandColor: "#111827",
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({ ok: true })
}
