"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import type { Product } from "@/brand.config"

export type CartItem = {
  id: string // slug + size + material
  product: Product
  size: string
  material: string
  qty: number
  unitPrice: number
}

type CartContextType = {
  items: CartItem[]
  addItem: (product: Product, size: string, material: string, qty: number) => void
  updateQty: (id: string, qty: number) => void
  removeItem: (id: string) => void
  clearCart: () => void
  itemCount: number
  subtotal: number
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem("cart")
      if (stored) setItems(JSON.parse(stored))
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items))
  }, [items])

  function addItem(product: Product, size: string, material: string, qty: number) {
    const id = `${product.slug}::${size}::${material}`
    setItems((prev) => {
      const existing = prev.find((i) => i.id === id)
      if (existing) {
        return prev.map((i) => (i.id === id ? { ...i, qty: i.qty + qty } : i))
      }
      return [...prev, { id, product, size, material, qty, unitPrice: product.startingPrice }]
    })
  }

  function updateQty(id: string, qty: number) {
    if (qty < 1) return removeItem(id)
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty } : i)))
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  function clearCart() {
    setItems([])
  }

  const itemCount = items.reduce((sum, i) => sum + i.qty, 0)
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0)

  return (
    <CartContext.Provider value={{ items, addItem, updateQty, removeItem, clearCart, itemCount, subtotal }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used inside CartProvider")
  return ctx
}
