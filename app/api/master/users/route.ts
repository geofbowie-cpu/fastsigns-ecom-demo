import { NextResponse } from "next/server"
import { adminClient } from "@/lib/supabase"
import { assertMasterAuth, apiError, parseBody } from "@/lib/api-helpers"
import { logger } from "@/lib/logger"
import { UserEmailSchema } from "@/lib/schemas"

export async function GET() {
  const unauth = await assertMasterAuth()
  if (unauth) return unauth
  const { data, error } = await adminClient()
    .from("portal_users")
    .select("email, created_at, last_sign_in_at")
    .order("created_at", { ascending: false })
  if (error) {
    logger.error("users.list failed", { error: error.message })
    return apiError(error.message, 500)
  }
  return NextResponse.json({ users: data })
}

export async function POST(req: Request) {
  const unauth = await assertMasterAuth()
  if (unauth) return unauth
  const result = UserEmailSchema.safeParse(await parseBody(req))
  if (!result.success) return apiError(result.error.issues[0].message)
  const clean = result.data.email.trim().toLowerCase()
  const { error } = await adminClient()
    .from("portal_users")
    .upsert({ email: clean }, { onConflict: "email", ignoreDuplicates: true })
  if (error) {
    logger.error("users.create failed", { error: error.message, email: clean })
    return apiError(error.message, 500)
  }
  logger.info("users.upsert", { email: clean })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const unauth = await assertMasterAuth()
  if (unauth) return unauth
  const result = UserEmailSchema.safeParse(await parseBody(req))
  if (!result.success) return apiError(result.error.issues[0].message)
  const clean = result.data.email.trim().toLowerCase()
  const { error } = await adminClient().from("portal_users").delete().eq("email", clean)
  if (error) {
    logger.error("users.delete failed", { error: error.message, email: clean })
    return apiError(error.message, 500)
  }
  logger.info("users.delete", { email: clean })
  return NextResponse.json({ ok: true })
}
