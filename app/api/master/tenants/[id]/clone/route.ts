import { NextResponse } from "next/server"
import { cloneTenant } from "@/lib/tenant"
import { assertMasterAuth, apiError, parseBody } from "@/lib/api-helpers"
import { logger } from "@/lib/logger"
import { TenantCloneSchema } from "@/lib/schemas"

// Clone an existing site (master-only) into a new demo tenant.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauth = await assertMasterAuth()
  if (unauth) return unauth

  const { id } = await params
  const result = TenantCloneSchema.safeParse(await parseBody(req))
  if (!result.success) return apiError(result.error.issues[0].message)

  try {
    const t = await cloneTenant(id, result.data)
    logger.info("tenant.clone", { sourceId: id, newSlug: t.slug })
    return NextResponse.json({ tenant: t })
  } catch (e: any) {
    logger.error("tenant.clone failed", { sourceId: id, error: e.message })
    return apiError(e.message, 400)
  }
}
