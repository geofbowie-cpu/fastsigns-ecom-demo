export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { listOrders, orderReference, type OrderRow } from "@/lib/orders-db"
import { listTenants } from "@/lib/tenant"

export const metadata: Metadata = {
  title: "Orders · FASTSIGNS Demo Builder",
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: "good" | "bad" }) {
  const valueColor =
    tone === "good" ? "text-green-600" : tone === "bad" ? "text-red-600" : "text-gray-900"
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-2xl font-bold ${valueColor}`}>{value}</div>
    </div>
  )
}

function StatusPill({ status }: { status: OrderRow["po_email_status"] }) {
  if (status === "sent") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        Sent
      </span>
    )
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Failed
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
      No record
    </span>
  )
}

export default async function OrdersPage() {
  const [orders, tenants] = await Promise.all([listOrders(), listTenants()])
  const nameBySlug = new Map(tenants.map((t) => [t.slug, t.name]))

  const sent = orders.filter((o) => o.po_email_status === "sent").length
  const failed = orders.filter((o) => o.po_email_status === "failed").length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500 mt-1">
          Every purchase order submitted across all sites, with email delivery status.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total orders" value={orders.length} />
        <StatCard label="Emails sent" value={sent} tone="good" />
        <StatCard label="Email failures" value={failed} tone={failed > 0 ? "bad" : undefined} />
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          No orders yet.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3 font-semibold">Reference</th>
                <th className="px-4 py-3 font-semibold">Site</th>
                <th className="px-4 py-3 font-semibold">Items</th>
                <th className="px-4 py-3 font-semibold">Submitted by</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Sent to</th>
                <th className="px-4 py-3 font-semibold">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => {
                const itemCount = Array.isArray(o.items)
                  ? o.items.reduce((sum, it) => sum + (it.qty ?? 0), 0)
                  : 0
                return (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-900">
                      {orderReference(o.id)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {nameBySlug.get(o.tenant_slug) ?? o.tenant_slug}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {itemCount} item{itemCount !== 1 ? "s" : ""}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{o.customer_email}</td>
                    <td className="px-4 py-3">
                      <StatusPill status={o.po_email_status} />
                      {o.po_email_error && (
                        <div className="text-[11px] text-red-500 mt-1 max-w-[200px] truncate" title={o.po_email_error}>
                          {o.po_email_error}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{o.po_email_to ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {fmtDateTime(o.po_email_sent_at ?? o.created_at)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
