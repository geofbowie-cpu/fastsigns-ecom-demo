"use client"

import { useState } from "react"
import Link from "next/link"
import { useCart } from "./CartProvider"
import { effectiveMin, effectiveStep, normalizeQty, minLabel } from "@/lib/order-qty"

export default function AddToCartButton({
  slug,
  product,
  buttonColor,
  buttonTextColor,
}: {
  slug: string
  product: { slug: string; name: string; imageUrl?: string; unit?: string; minOrderQty?: number; orderIncrement?: number }
  buttonColor: string
  buttonTextColor: string
}) {
  const { addItem } = useCart()
  const min = effectiveMin(product.minOrderQty)
  const step = effectiveStep(product.orderIncrement)
  const hint = minLabel(product.minOrderQty, product.orderIncrement)
  const [qty, setQty] = useState(min)
  const [note, setNote] = useState("")
  const [added, setAdded] = useState(false)

  function add() {
    addItem({
      slug: product.slug,
      name: product.name,
      imageUrl: product.imageUrl,
      unit: product.unit,
      qty: normalizeQty(qty, product.minOrderQty, product.orderIncrement),
      note: note.trim() || undefined,
      minQty: product.minOrderQty,
      increment: product.orderIncrement,
    })
    setAdded(true)
    setNote("")
    setQty(min)
    setTimeout(() => setAdded(false), 4000)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
      <h3 className="font-bold text-gray-900 text-lg">Add to order</h3>

      {/* Quantity */}
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
          Quantity
        </label>
        <div className="inline-flex items-center border border-gray-300 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(min, q - step))}
            className="px-3 py-2 text-gray-600 hover:bg-gray-50 text-lg leading-none"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <input
            type="number"
            min={min}
            step={step}
            value={qty}
            onChange={(e) => setQty(Math.max(min, parseInt(e.target.value) || min))}
            onBlur={() => setQty(normalizeQty(qty, product.minOrderQty, product.orderIncrement))}
            className="w-16 text-center text-sm py-2 outline-none border-x border-gray-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="button"
            onClick={() => setQty((q) => q + step)}
            className="px-3 py-2 text-gray-600 hover:bg-gray-50 text-lg leading-none"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        {hint && <p className="text-xs text-gray-400 mt-1.5">{hint}</p>}
      </div>

      {/* Note */}
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
          Note <span className="font-normal normal-case text-gray-400">(optional — size, color, instructions)</span>
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          maxLength={1000}
          placeholder="e.g. 3ft × 6ft, double-sided"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <button
        type="button"
        onClick={add}
        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
        style={{ backgroundColor: buttonColor, color: buttonTextColor }}
      >
        Add to order
      </button>

      {added && (
        <div className="flex items-center justify-between gap-2 text-sm bg-green-50 border border-green-200 text-green-800 rounded-lg px-3 py-2">
          <span>✓ Added to your order</span>
          <Link href={`/sites/${slug}/cart`} className="font-semibold underline hover:no-underline">
            Review order
          </Link>
        </div>
      )}
    </div>
  )
}
