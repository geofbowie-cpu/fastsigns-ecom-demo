import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { isMasterAuthed } from "@/lib/master-auth"
import { updateTenant, archiveTenant, deleteTenant } from "@/lib/tenant"

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await isMasterAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await ctx.params
  const body = await req.json().catch(() => ({}))
  try {
    const t = await updateTenant(id, body)
    // Bust any cached pages for this tenant's portal so prospects see the
    // changes immediately. Cover both the master edit page and the tenant
    // routes (both /sites/[slug] and the rewritten /:slug surface).
    revalidatePath(`/master/sites/${id}/edit`)
    if (t.slug) {
      revalidatePath(`/sites/${t.slug}`, "layout")
      revalidatePath(`/${t.slug}`, "layout")
    }
    return NextResponse.json({ tenant: t })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await isMasterAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await ctx.params
  const { searchParams } = new URL(req.url)
  const permanent = searchParams.get("permanent") === "true"
  try {
    if (permanent) {
      await deleteTenant(id)
    } else {
      await archiveTenant(id)
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
