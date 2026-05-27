import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { archiveTenant, deleteTenant } from "@/lib/tenant"
import { assertMasterAuth, apiError, parseBody } from "@/lib/api-helpers"
import { logger } from "@/lib/logger"
import { TenantPatchSchema } from "@/lib/schemas"
import { serviceUpdateTenant } from "@/lib/services/tenant-service"

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const unauth = await assertMasterAuth()
  if (unauth) return unauth
  const { id } = await ctx.params
  const result = TenantPatchSchema.safeParse(await parseBody(req))
  if (!result.success) return apiError(result.error.issues[0].message)
  try {
    const t = await serviceUpdateTenant(id, result.data)
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
    logger.error("tenants.patch failed", { error: e.message, id })
    return apiError(e.message, 400)
  }
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const unauth = await assertMasterAuth()
  if (unauth) return unauth
  const { id } = await ctx.params
  const { searchParams } = new URL(req.url)
  const permanent = searchParams.get("permanent") === "true"
  try {
    if (permanent) {
      await deleteTenant(id)
    } else {
      await archiveTenant(id)
    }
    logger.info("tenant.delete", { id, permanent })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    logger.error("tenants.delete failed", { error: e.message, id })
    return apiError(e.message, 400)
  }
}
