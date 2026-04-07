"use client"

import { CartProvider } from "@/lib/cart-context"
import { BrandProvider } from "@/lib/brand-store"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <BrandProvider>{children}</BrandProvider>
    </CartProvider>
  )
}
