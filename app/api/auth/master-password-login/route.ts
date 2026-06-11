import { NextResponse } from "next/server"
import { adminClient } from "@/lib/supabase"
import { setMasterSessionOnResponse } from "@/lib/master-auth"
import { verifyPassword } from "@/lib/password"
import { apiError } from "@/lib/api-helpers"

export async function POST(req: Request) {
  let body: { email?: string; password?: string }
  try { body = await req.json() } catch {
    return apiError("Invalid JSON", 400)
  }

  const email    = body.email?.trim().toLowerCase()
  const password = body.password

  if (!email || !password) {
    return apiError("Email and password are required.", 400)
  }

  const { data: user } = await adminClient()
    .from("portal_users")
    .select("email, password_hash")
    .eq("email", email)
    .maybeSingle()

  // Deliberate vagueness — don't reveal whether the email exists.
  if (!user || !user.password_hash) {
    return apiError("Incorrect email or password.", 401)
  }

  const ok = verifyPassword(password, user.password_hash)
  if (!ok) {
    return apiError("Incorrect email or password.", 401)
  }

  // Update last_sign_in_at (best-effort)
  await adminClient()
    .from("portal_users")
    .update({ last_sign_in_at: new Date().toISOString() })
    .eq("email", email)

  const res = NextResponse.json({ ok: true })
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
