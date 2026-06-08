"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCart } from "./CartProvider"

// Floating cart pill shown on every storefront page (when cart is enabled).
// Hidden on the cart page itself.
export default function CartButton({
  slug,
  buttonColor,
  buttonTextColor,
}: {
  slug: string
  buttonColor: string
  buttonTextColor: string
}) {
  const { count } = useCart()
  const pathname = usePathname()

  // Don't show the floating button while on the cart page.
  if (pathname === `/sites/${slug}/cart`) return null
  if (count === 0) return null

  return (
    <Link
      href={`/sites/${slug}/cart`}
      className="fixed bottom-14 right-5 z-[90] flex items-center gap-2 pl-4 pr-5 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-[1.03] transition-all font-bold text-sm"
      style={{ backgroundColor: buttonColor, color: buttonTextColor }}
      aria-label={`Review order, ${count} item${count === 1 ? "" : "s"}`}
    >
      <span className="relative inline-flex">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        <span
          className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-white text-[11px] font-black flex items-center justify-center"
          style={{ color: buttonColor }}
        >
          {count}
        </span>
      </span>
      Review order
    </Link>
  )
}
