import { NextResponse } from "next/server"
import { isMasterAuthed } from "@/lib/master-auth"
import { adminClient } from "@/lib/supabase"

export async function GET() {
  if (!(await isMasterAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { data, error } = await adminClient()
    .from("portal_users")
    .select("email, created_at, last_sign_in_at")
    .order("created_at", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ users: data })
}

export async function POST(req: Request) {
  if (!(await isMasterAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { email } = await req.json()
  const clean = email?.trim().toLowerCase()
  if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 })
  }
  const { error } = await adminClient()
    .from("portal_users")
    .upsert({ email: clean }, { onConflict: "email", ignoreDuplicates: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  if (!(await isMasterAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { email } = await req.json()
  const clean = email?.trim().toLowerCase()
  if (!clean) return NextResponse.json({ error: "Email required" }, { status: 400 })
  const { error } = await adminClient().from("portal_users").delete().eq("email", clean)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
