import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getTenantBySlug } from "@/lib/tenant"
import { resolveBrand } from "@/lib/resolve-brand"
import { getTenantSession, cookieName } from "@/lib/tenant-auth"
import { createOrder, orderReference } from "@/lib/orders-db"
import { sendPurchaseOrderEmail } from "@/lib/email"
import { apiError, parseBody } from "@/lib/api-helpers"
import { logger } from "@/lib/logger"
import { CartSubmitSchema } from "@/lib/schemas"

export async function POST(req: Request) {
  const result = CartSubmitSchema.safeParse(await parseBody(req))
  if (!result.success) return apiError(result.error.issues[0].message)
  const { slug, items, orderNotes } = result.data

  const tenant = await getTenantBySlug(slug)
  if (!tenant) return apiError("Site not found", 404)
  if (!tenant.enable_cart) return apiError("Ordering isn't enabled for this site.", 400)

  // Must be signed in (cart is a logged-in function).
  const store = await cookies()
  const raw = store.get(cookieName(slug))?.value
  const customerEmail = getTenantSession(slug, raw)
  if (!customerEmail) {
    return apiError("Please sign in to submit your order.", 401)
  }

  // Belt-and-suspenders domain check (the session already enforced this).
  const domains = tenant.allowed_domains ?? []
  if (domains.length > 0) {
    const dom = customerEmail.split("@")[1]?.toLowerCase()
    if (!domains.includes(dom)) {
      return apiError("Your account isn't authorized to order on this site.", 403)
    }
  }

  const b = resolveBrand(tenant.brand)
  const repEmail = b.contactEmail || b.supportEmail
  if (!repEmail) {
    logger.error("cart.submit no rep email", { slug })
    return apiError("This site has no order recipient configured. Contact support.", 500)
  }

  // Persist the order first so it's never lost, even if email delivery fails.
  let orderId: string
  try {
    orderId = await createOrder({
      tenantId: tenant.id,
      tenantSlug: slug,
      customerEmail,
      items,
      orderNotes,
    })
  } catch (e) {
    logger.error("cart.submit insert failed", { slug, error: e instanceof Error ? e.message : String(e) })
    return apiError("Couldn't save your order. Please try again.", 500)
  }

  const reference = orderReference(orderId)

  // Email the PO to the rep (best-effort — order is already saved).
  const sent = await sendPurchaseOrderEmail({
    to: repEmail,
    reference,
    companyName: b.company,
    customerEmail,
    items: items.map((i) => ({ name: i.name, qty: i.qty, note: i.note })),
    orderNotes,
    brandColor: b.primaryColor,
  })

  if (!sent.ok) {
    logger.error("cart.submit email failed", { slug, reference, error: sent.error })
    // Order is persisted; surface success so the customer isn't stuck, but the
    // failure is logged for follow-up.
  } else {
    logger.info("cart.submit ok", { slug, reference, items: items.length })
  }

  return NextResponse.json({ ok: true, reference })
}
