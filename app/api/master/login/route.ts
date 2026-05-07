import { NextResponse } from "next/server"
import { checkMasterPassword, startMasterSession } from "@/lib/master-auth"

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: "" }))
  if (typeof password !== "string" || !checkMasterPassword(password)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 })
  }
  await startMasterSession()
  return NextResponse.json({ ok: true })
}
