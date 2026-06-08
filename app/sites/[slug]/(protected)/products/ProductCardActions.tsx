"use client"

import { useState } from "react"
import Link from "next/link"
import { useCartOptional } from "../_cart/CartProvider"

interface Props {
  tenantSlug: string
  product: { slug: string; name: string; imageUrl?: string; unit?: string }
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

  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault() // card is inside a link-like div — don't navigate
    if (!cart) return
    cart.addItem({ slug: product.slug, name: product.name, imageUrl: product.imageUrl, unit: product.unit, qty })
    setAdded(true)
    setQty(1)
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
          <div className="flex items-center gap-2">
            {/* −/qty/+ stepper */}
            <div className="inline-flex items-center border border-gray-200 rounded-lg overflow-hidden shrink-0">
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setQty((q) => Math.max(1, q - 1)) }}
                className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-50 text-sm leading-none select-none"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                onClick={(e) => e.preventDefault()}
                className="w-8 text-center text-xs py-1.5 outline-none border-x border-gray-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setQty((q) => q + 1) }}
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
        )
      )}
    </div>
  )
}
