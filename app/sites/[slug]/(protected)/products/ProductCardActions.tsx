"use client"

import { useState } from "react"
import Link from "next/link"
import { useCartOptional } from "../_cart/CartProvider"
import { effectiveMin, effectiveStep, normalizeQty, minLabel } from "@/lib/order-qty"

interface Props {
  tenantSlug: string
  product: { slug: string; name: string; imageUrl?: string; unit?: string; minOrderQty?: number; orderIncrement?: number }
  buttonColor: string
  buttonTextColor: string
}

export default function ProductCardActions({
  tenantSlug,
  product,
  buttonColor,
  buttonTextColor,
}: Props) {
  const cart = useCartOptional()
  const showCart = cart !== null

  const min = effectiveMin(product.minOrderQty)
  const step = effectiveStep(product.orderIncrement)
  const hint = minLabel(product.minOrderQty, product.orderIncrement)

  const [qty, setQty] = useState(min)
  const [added, setAdded] = useState(false)

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault() // card is inside a link-like div — don't navigate
    if (!cart) return
    cart.addItem({
      slug: product.slug,
      name: product.name,
      imageUrl: product.imageUrl,
      unit: product.unit,
      qty: normalizeQty(qty, product.minOrderQty, product.orderIncrement),
      minQty: product.minOrderQty,
      increment: product.orderIncrement,
    })
    setAdded(true)
    setQty(min)
    setTimeout(() => setAdded(false), 2500)
  }

  return (
    <div className="px-4 pb-4 pt-1 space-y-2">
      {/* Details link */}
      <Link
        href={`/sites/${tenantSlug}/products/${product.slug}`}
        onClick={(e) => e.stopPropagation()}
        className="block w-full text-center py-2 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-colors"
      >
        Details →
      </Link>

      {/* Cart row */}
      {showCart && (
        added ? (
          <div className="flex items-center justify-between text-xs bg-green-50 border border-green-200 text-green-800 rounded-lg px-3 py-2">
            <span className="font-medium">✓ Added</span>
            <Link
              href={`/sites/${tenantSlug}/cart`}
              onClick={(e) => e.stopPropagation()}
              className="font-semibold underline hover:no-underline"
            >
              Review order
            </Link>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {/* −/qty/+ stepper */}
              <div className="inline-flex items-center border border-gray-200 rounded-lg overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setQty((q) => Math.max(min, q - step)) }}
                  className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-50 text-sm leading-none select-none"
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
                  onBlur={(e) => { e.preventDefault(); setQty(normalizeQty(qty, product.minOrderQty, product.orderIncrement)) }}
                  onClick={(e) => e.preventDefault()}
                  className="w-10 text-center text-xs py-1.5 outline-none border-x border-gray-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setQty((q) => q + step) }}
                  className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-50 text-sm leading-none select-none"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              {/* Add button */}
              <button
                type="button"
                onClick={handleAdd}
                className="flex-1 py-1.5 text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: buttonColor, color: buttonTextColor }}
              >
                Add to order
              </button>
            </div>
            {hint && <p className="text-[10px] text-gray-400 leading-tight">{hint}</p>}
          </div>
        )
      )}
    </div>
  )
}
