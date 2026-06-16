// Cart → purchase-order persistence. One row per submitted cart.
// No pricing in this phase: line items carry qty + an optional note only.

import { adminClient } from "@/lib/supabase"

export type OrderLineItem = {
  slug: string
  name: string
  qty: number
  note?: string
}

export type OrderInput = {
  tenantId: string
  tenantSlug: string
  customerEmail: string
  items: OrderLineItem[]
  orderNotes?: string
}

/** Inserts an order and returns its generated id. */
export async function createOrder(input: OrderInput): Promise<string> {
  const { data, error } = await adminClient()
    .from("orders")
    .insert({
      tenant_id: input.tenantId,
      tenant_slug: input.tenantSlug,
      customer_email: input.customerEmail.trim().toLowerCase(),
      items: input.items,
      order_notes: input.orderNotes?.trim() || null,
    })
    .select("id")
    .single()
  if (error) throw new Error(error.message)
  return data.id as string
}

/** Records the PO-email outcome on an order row (best-effort; never throws). */
export async function markOrderEmail(
  orderId: string,
  result: { to: string; status: "sent" | "failed"; error?: string }
): Promise<void> {
  const { error } = await adminClient()
    .from("orders")
    .update({
      po_email_to: result.to,
      po_email_status: result.status,
      po_email_sent_at: new Date().toISOString(),
      po_email_error: result.error ?? null,
    })
    .eq("id", orderId)
  if (error) {
    // Logging the email status must never break the request — swallow.
    console.error("markOrderEmail failed", error.message)
  }
}

/** Short human-facing reference derived from a uuid, e.g. "PO-A1B2C3". */
export function orderReference(id: string): string {
  return `PO-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`
}
