import { NextResponse } from "next/server"
import { endMasterSession } from "@/lib/master-auth"

export async function POST() {
  await endMasterSession()
  return NextResponse.json({ ok: true })
}
