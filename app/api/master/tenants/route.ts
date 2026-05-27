import { NextResponse } from "next/server"
import { listTenants } from "@/lib/tenant"
import { assertMasterAuth, apiError, parseBody } from "@/lib/api-helpers"
import { logger } from "@/lib/logger"
import { TenantCreateSchema } from "@/lib/schemas"
import { serviceCreateTenant } from "@/lib/services/tenant-service"

export async function GET() {
  const unauth = await assertMasterAuth()
  if (unauth) return unauth
  try {
    const rows = await listTenants()
    return NextResponse.json({ tenants: rows })
  } catch (e: any) {
    logger.error("tenants.list failed", { error: e.message })
    return apiError(e.message, 500)
  }
}

export async function POST(req: Request) {
  const unauth = await assertMasterAuth()
  if (unauth) return unauth
  const result = TenantCreateSchema.safeParse(await parseBody(req))
  if (!result.success) return apiError(result.error.issues[0].message)
  try {
    const t = await serviceCreateTenant(result.data)
    return NextResponse.json({ tenant: t })
  } catch (e: any) {
    logger.error("tenants.create failed", { error: e.message, slug: result.data.slug })
    return apiError(e.message, 400)
  }
}
