"use client"

import { useState } from "react"
import Link from "next/link"
import { useCart } from "../_cart/CartProvider"

export default function CartClient({
  slug,
  customerEmail,
  companyName,
  contactName,
  buttonColor,
  buttonTextColor,
}: {
  slug: string
  customerEmail: string | null
  companyName: string
  contactName: string
  buttonColor: string
  buttonTextColor: string
}) {
  const { items, updateQty, updateNote, removeItem, clear } = useCart()
  const [orderNotes, setOrderNotes] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ reference: string } | null>(null)

  async function submit() {
    setError(null)
    setBusy(true)
    try {
      const res = await fetch("/api/cart/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          items: items.map((i) => ({ slug: i.slug, name: i.name, qty: i.qty, note: i.note })),
          orderNotes: orderNotes.trim() || undefined,
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) { setError(j.error ?? "Something went wrong. Please try again."); return }
      setDone({ reference: j.reference })
      clear()
    } catch {
      setError("Network error. Check your connection and try again.")
    } finally {
      setBusy(false)
    }
  }

  // ── Confirmation ───────────────────────────────────────────
  if (done) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mx-auto mb-5">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Order submitted</h1>
        <p className="text-gray-500 mb-1">
          Your reference is <span className="font-bold text-gray-900">{done.reference}</span>.
        </p>
        <p className="text-gray-500 mb-8">
          {contactName ? `${contactName} will` : "Your account rep will"} follow up by email to confirm pricing, lead time, and next steps.
        </p>
        <Link
          href={`/sites/${slug}/products`}
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
          style={{ backgroundColor: buttonColor, color: buttonTextColor }}
        >
          Continue shopping
        </Link>
      </div>
    )
  }

  // ── Empty ──────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-black text-gray-900 mb-2">Your order is empty</h1>
        <p className="text-gray-500 mb-8">Add some products to get started.</p>
        <Link
          href={`/sites/${slug}/products`}
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
          style={{ backgroundColor: buttonColor, color: buttonTextColor }}
        >
          Browse products
        </Link>
      </div>
    )
  }

  // ── Review ─────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-black text-gray-900 mb-1">Review your order</h1>
      <p className="text-sm text-gray-500 mb-8">
        No payment now — this sends a request to your account rep, who follows up with pricing and lead time.
      </p>

      {/* Line items */}
      <div className="space-y-3 mb-8">
        {items.map((item) => (
          <div key={item.slug} className="bg-white rounded-xl border border-gray-100 p-4 flex gap-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 16l5-5 4 4 3-3 6 6" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold text-gray-900 text-sm">{item.name}</h3>
                <button
                  onClick={() => removeItem(item.slug)}
                  className="text-xs text-gray-400 hover:text-red-600 flex-shrink-0"
                >
                  Remove
                </button>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <div className="inline-flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => updateQty(item.slug, item.qty - 1)}
                    className="px-2.5 py-1 text-gray-600 hover:bg-gray-50 leading-none"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={item.qty}
                    onChange={(e) => updateQty(item.slug, Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-12 text-center text-sm py-1 outline-none border-x border-gray-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => updateQty(item.slug, item.qty + 1)}
                    className="px-2.5 py-1 text-gray-600 hover:bg-gray-50 leading-none"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={item.note ?? ""}
                onChange={(e) => updateNote(item.slug, e.target.value)}
                maxLength={1000}
                placeholder="Add a note (size, color, instructions)…"
                className="w-full mt-2 px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Order notes */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-8">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
          Order notes <span className="font-normal normal-case text-gray-400">(optional)</span>
        </label>
        <textarea
          value={orderNotes}
          onChange={(e) => setOrderNotes(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Delivery deadline, PO number, special instructions…"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* Submit */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        {customerEmail && (
          <p className="text-sm text-gray-500 mb-4">
            Submitting as <strong className="text-gray-900">{customerEmail}</strong>
          </p>
        )}
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        <button
          onClick={submit}
          disabled={busy}
          className="w-full py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          style={{ backgroundColor: buttonColor, color: buttonTextColor }}
        >
          {busy ? "Submitting…" : "Submit order"}
        </button>
      </div>
    </div>
  )
}
