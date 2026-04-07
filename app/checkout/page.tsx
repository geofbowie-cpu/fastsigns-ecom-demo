"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCart } from "@/lib/cart-context"
import { brand } from "@/brand.config"
import { ChevronRight, Building2, CreditCard, AlertCircle, Zap } from "lucide-react"

type FormData = {
  firstName: string
  lastName: string
  email: string
  company: string
  phone: string
  address: string
  city: string
  state: string
  zip: string
  country: string
  poNumber: string
  costCenter: string
  approver: string
  orderNotes: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, clearCart } = useCart()
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    company: brand.company,
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
    poNumber: "",
    costCenter: brand.costCenters[0],
    approver: brand.approvers[0],
    orderNotes: "",
  })

  function set(key: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    // Simulate API call
    const mockPO = `PO-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`
    setTimeout(() => {
      clearCart()
      router.push(`/order-confirmation?po=${mockPO}&approver=${encodeURIComponent(form.approver)}&total=${subtotal}`)
    }, 1500)
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 mb-4">No items in cart.</p>
        <Link href="/products" className="text-sm underline" style={{ color: brand.primaryColor }}>
          Browse Products
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-8">
        <Link href="/cart" className="hover:text-gray-700">Cart</Link>
        <ChevronRight size={13} />
        <span className="text-gray-700 font-medium">Checkout</span>
      </nav>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">

            {/* Procurement Integration Banner */}
            {brand.procurementSystem && (
              <div
                className="rounded-xl border-2 p-5"
                style={{ borderColor: brand.accentColor, backgroundColor: `${brand.accentColor}10` }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={16} style={{ color: brand.accentColor }} />
                  <span className="font-bold text-sm text-gray-800">
                    Procurement Integration — {brand.procurementLabel}
                  </span>
                  <span className="ml-auto flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                    Connected
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  This order will be routed through your {brand.procurementLabel} instance.
                  Attach a PO number and select your cost center — no credit card required.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      PO Number <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. PO-2025-00142"
                      value={form.poNumber}
                      onChange={(e) => set("poNumber", e.target.value)}
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent bg-white"
                      style={{ '--tw-ring-color': brand.primaryColor } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Cost Center <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={form.costCenter}
                      onChange={(e) => set("costCenter", e.target.value)}
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2"
                    >
                      {brand.costCenters.map((cc) => (
                        <option key={cc}>{cc}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Approval Routing
                  </label>
                  <select
                    value={form.approver}
                    onChange={(e) => set("approver", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                  >
                    {brand.approvers.map((a) => (
                      <option key={a}>{a}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1.5">
                    Orders over $500 require manager approval before entering production.
                  </p>
                </div>
              </div>
            )}

            {/* Shipping info */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <Building2 size={16} className="text-gray-400" />
                <h2 className="font-bold text-gray-900">Shipping Information</h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    First Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.firstName}
                    onChange={(e) => set("firstName", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-gray-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Last Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.lastName}
                    onChange={(e) => set("lastName", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-gray-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-gray-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-gray-500 bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Company
                  </label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) => set("company", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-gray-500 bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Shipping Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                    placeholder="Street address"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-gray-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    City <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-gray-500 bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      State
                    </label>
                    <input
                      type="text"
                      value={form.state}
                      onChange={(e) => set("state", e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-gray-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      ZIP <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.zip}
                      onChange={(e) => set("zip", e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-gray-500 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Billing */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard size={16} className="text-gray-400" />
                <h2 className="font-bold text-gray-900">Billing</h2>
              </div>
              <div className="flex items-start gap-3 bg-blue-50 rounded-lg px-4 py-3 border border-blue-100">
                <AlertCircle size={15} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                  This account is configured for <strong>Net 30 invoicing</strong>.
                  No payment is required at time of order.
                  {brand.procurementSystem && ` Invoice will be routed through ${brand.procurementLabel}.`}
                </p>
              </div>
            </div>

            {/* Order notes */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-4">Order Notes</h2>
              <textarea
                rows={3}
                placeholder="Special instructions, file upload notes, installation requirements…"
                value={form.orderNotes}
                onChange={(e) => set("orderNotes", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-gray-500 bg-white resize-none"
              />
            </div>
          </div>

          {/* Order summary sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 sticky top-24">
              <h2 className="font-bold text-gray-900 text-lg mb-4">Order Summary</h2>

              <div className="space-y-3 pb-4 border-b border-gray-100">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${item.product.gradientFrom}, ${item.product.gradientTo})`,
                      }}
                    >
                      {item.product.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-gray-800 truncate">{item.product.name}</div>
                      <div className="text-xs text-gray-400">{item.size} · ×{item.qty}</div>
                    </div>
                    <div className="text-sm font-bold text-gray-900 flex-shrink-0">
                      ${(item.unitPrice * item.qty).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="py-3 flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span className="font-medium text-gray-800">${subtotal.toLocaleString()}</span>
              </div>
              <div className="pb-3 flex justify-between text-sm text-gray-500 border-b border-gray-100">
                <span>Shipping</span>
                <span className="text-gray-400 text-xs">Calculated post-approval</span>
              </div>
              <div className="pt-3 flex justify-between font-bold text-gray-900">
                <span>Estimated Total</span>
                <span>${subtotal.toLocaleString()}</span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: brand.primaryColor }}
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting Order…
                  </>
                ) : (
                  "Submit Order"
                )}
              </button>

              <p className="text-xs text-gray-400 text-center mt-3">
                By submitting, your order enters the approval queue.
                You'll receive a confirmation email with your PO number.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
