import { createTenant, updateTenant, type TenantInput } from "@/lib/tenant"
import { logger } from "@/lib/logger"
import type { z } from "zod"
import type { TenantCreateSchema, TenantPatchSchema } from "@/lib/schemas"

export async function serviceCreateTenant(input: z.infer<typeof TenantCreateSchema>) {
  logger.info("tenant.create", { slug: input.slug })
  return createTenant(input as TenantInput)
}

export async function serviceUpdateTenant(id: string, patch: z.infer<typeof TenantPatchSchema>) {
  logger.info("tenant.update", { id, fields: Object.keys(patch) })
  // Business rule: can't promote to live without a contact email in the brand
  if (patch.status === "live") {
    const contactEmail = (patch.brand as any)?.contactEmail
    if (!contactEmail) {
      throw new Error("A contact email is required before promoting to live")
    }
  }
  return updateTenant(id, patch as any)
}
