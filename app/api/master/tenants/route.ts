import { NextResponse } from "next/server"
import { isMasterAuthed } from "@/lib/master-auth"
import { createTenant, listTenants } from "@/lib/tenant"

export async function GET() {
  if (!(await isMasterAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const rows = await listTenants()
    return NextResponse.json({ tenants: rows })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  if (!(await isMasterAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const { slug, name, brand, enabled_categories, admin_email } = body
  if (!slug || !name) {
    return NextResponse.json({ error: "slug and name required" }, { status: 400 })
  }
  try {
    const t = await createTenant({ slug, name, brand, enabled_categories, admin_email })
    return NextResponse.json({ tenant: t })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
