import { NextResponse } from "next/server"
import { endMasterSession } from "@/lib/master-auth"

export async function POST(req: Request) {
  await endMasterSession()
  const origin = new URL(req.url).origin
  return NextResponse.redirect(`${origin}/master/login`, { status: 303 })
}
