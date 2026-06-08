"use client"

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react"

export type CartItem = {
  slug: string
  name: string
  imageUrl?: string
  unit?: string
  qty: number
  note?: string
}

type CartContextValue = {
  items: CartItem[]
  count: number
  addItem: (item: Omit<CartItem, "qty"> & { qty?: number }) => void
  updateQty: (slug: string, qty: number) => void
  updateNote: (slug: string, note: string) => void
  removeItem: (slug: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within a CartProvider")
  return ctx
}

export default function CartProvider({
  slug,
  children,
}: {
  slug: string
  children: React.ReactNode
}) {
  const storageKey = `ecom_cart_${slug}`
  const [items, setItems] = useState<CartItem[]>([])
  const hydrated = useRef(false)

  // Hydrate once from localStorage.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setItems(parsed)
      }
    } catch {
      /* ignore malformed cart */
    }
    hydrated.current = true
  }, [storageKey])

  // Persist after hydration so we don't clobber stored cart with the initial [].
  useEffect(() => {
    if (!hydrated.current) return
    try {
      localStorage.setItem(storageKey, JSON.stringify(items))
    } catch {
      /* storage full / unavailable — non-fatal */
    }
  }, [items, storageKey])

  const addItem = useCallback<CartContextValue["addItem"]>((item) => {
    setItems((prev) => {
      const qty = item.qty ?? 1
      const existing = prev.find((i) => i.slug === item.slug)
      if (existing) {
        return prev.map((i) =>
          i.slug === item.slug ? { ...i, qty: i.qty + qty } : i
        )
      }
      return [...prev, { ...item, qty }]
    })
  }, [])

  const updateQty = useCallback((slug: string, qty: number) => {
    setItems((prev) =>
      prev.map((i) => (i.slug === slug ? { ...i, qty: Math.max(1, qty) } : i))
    )
  }, [])

  const updateNote = useCallback((slug: string, note: string) => {
    setItems((prev) => prev.map((i) => (i.slug === slug ? { ...i, note } : i)))
  }, [])

  const removeItem = useCallback((slug: string) => {
    setItems((prev) => prev.filter((i) => i.slug !== slug))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const count = items.reduce((sum, i) => sum + i.qty, 0)

  return (
    <CartContext.Provider
      value={{ items, count, addItem, updateQty, updateNote, removeItem, clear }}
    >
      {children}
    </CartContext.Provider>
  )
}
