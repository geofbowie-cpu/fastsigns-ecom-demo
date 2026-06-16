import { NextResponse } from "next/server"
import { getTenantBySlug } from "@/lib/tenant"
import { resolveBrand } from "@/lib/resolve-brand"
import { createOrder, orderReference, markOrderEmail } from "@/lib/orders-db"
import { getProducts } from "@/lib/products-db"
import { sendPurchaseOrderEmail, sendOrderConfirmationEmail } from "@/lib/email"
import { apiError, parseBody } from "@/lib/api-helpers"
import { logger } from "@/lib/logger"
import { CartSubmitSchema } from "@/lib/schemas"
import { isValidQty, effectiveMin, effectiveStep } from "@/lib/order-qty"

export async function POST(req: Request) {
  const result = CartSubmitSchema.safeParse(await parseBody(req))
  if (!result.success) return apiError(result.error.issues[0].message)
  const { slug, items, orderNotes, contact } = result.data

  const tenant = await getTenantBySlug(slug)
  if (!tenant) return apiError("Site not found", 404)
  if (!tenant.enable_cart) return apiError("Ordering isn't enabled for this site.", 400)

  // The submitter identity is the contact they provide on the cart form.
  // (Tenant session email, when present, is kept only for reference.)
  const customerEmail = contact.email

  // Enforce vendor minimums / pack increments authoritatively (client can't bypass).
  const products = await getProducts({
    enabledCategories: tenant.enabled_categories,
    importTags: tenant.import_tags,
    overrides: tenant.product_overrides,
  })
  const productBySlug = new Map(products.map((p) => [p.slug, p]))
  for (const it of items) {
    const p = productBySlug.get(it.slug)
    if (!p) continue // unknown product → no minimum to enforce
    if (!isValidQty(it.qty, p.minOrderQty, p.orderIncrement)) {
      const m = effectiveMin(p.minOrderQty)
      const step = effectiveStep(p.orderIncrement)
      const msg =
        step > 1
          ? `${p.name} must be ordered in packs of ${step} (minimum ${m}).`
          : `${p.name} has a minimum order quantity of ${m}.`
      return apiError(msg, 400)
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
      contact,
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
    contact,
    tenantSlug: slug,
    items: items.map((i) => ({ slug: i.slug, name: i.name, qty: i.qty, note: i.note })),
    orderNotes,
    brandColor: b.primaryColor,
  })

  // Record delivery outcome on the order row (queryable audit trail).
  await markOrderEmail(orderId, {
    to: repEmail,
    status: sent.ok ? "sent" : "failed",
    error: sent.ok ? undefined : sent.error,
  })

  if (!sent.ok) {
    logger.error("cart.submit email failed", { slug, reference, error: sent.error })
    // Order is persisted; surface success so the customer isn't stuck, but the
    // failure is logged for follow-up.
  } else {
    logger.info("cart.submit ok", { slug, reference, items: items.length })
  }

  // Confirmation to the customer (best-effort — never blocks the order).
  const confirm = await sendOrderConfirmationEmail({
    to: contact.email,
    firstName: contact.firstName,
    repName: b.contactName,
    repEmail,
    reference,
    items: items.map((i) => ({ name: i.name, qty: i.qty })),
  })
  if (!confirm.ok) {
    logger.error("cart.submit confirmation failed", { slug, reference, error: confirm.error })
  }

  return NextResponse.json({ ok: true, reference })
}
