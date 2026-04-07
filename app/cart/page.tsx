"use client"

import Link from "next/link"
import { useCart } from "@/lib/cart-context"
import { brand } from "@/brand.config"
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react"

export default function CartPage() {
  const { items, updateQty, removeItem, subtotal, itemCount } = useCart()

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <ShoppingBag size={48} className="mx-auto text-gray-200 mb-4" />
        <h1 className="text-2xl font-bold text-gray-700 mb-2">Your cart is empty</h1>
        <p className="text-gray-400 mb-8">Add some products to get started.</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-semibold text-sm hover:opacity-90 transition-opacity"
          style={{ backgroundColor: brand.primaryColor }}
        >
          Browse Products <ArrowRight size={15} />
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-black text-gray-900 mb-8">
        Your Cart
        <span className="text-base font-normal text-gray-400 ml-3">
          {itemCount} item{itemCount !== 1 ? "s" : ""}
        </span>
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Line items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-4"
            >
              {/* Product icon */}
              <div
                className="w-20 h-20 rounded-lg flex items-center justify-center flex-shrink-0 text-3xl"
                style={{
                  background: `linear-gradient(135deg, ${item.product.gradientFrom}, ${item.product.gradientTo})`,
                }}
              >
                {item.product.icon}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{item.product.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.size}
                      {item.material && item.material !== "" && ` · ${item.material}`}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-3">
                  {/* Qty controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(item.id, item.qty - 1)}
                      className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.id, item.qty + 1)}
                      className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <Plus size={11} />
                    </button>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">
                      ${(item.unitPrice * item.qty).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      ${item.unitPrice.toLocaleString()} {item.product.unit}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 sticky top-24">
            <h2 className="font-bold text-gray-900 text-lg mb-4">Order Summary</h2>

            <div className="space-y-2 pb-4 border-b border-gray-100">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm text-gray-600">
                  <span className="truncate mr-2">
                    {item.product.name} ×{item.qty}
                  </span>
                  <span className="flex-shrink-0 font-medium">
                    ${(item.unitPrice * item.qty).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="py-3 flex justify-between text-sm text-gray-500">
              <span>Shipping</span>
              <span className="text-green-600 font-medium">Quote at checkout</span>
            </div>

            <div className="py-3 border-t border-gray-100 flex justify-between font-bold text-gray-900">
              <span>Subtotal</span>
              <span>${subtotal.toLocaleString()}</span>
            </div>

            <Link
              href="/checkout"
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: brand.primaryColor }}
            >
              Proceed to Checkout <ArrowRight size={15} />
            </Link>

            {brand.procurementSystem && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400 justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                PO numbers accepted at checkout
              </div>
            )}

            <Link
              href="/products"
              className="mt-3 w-full text-center block text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
