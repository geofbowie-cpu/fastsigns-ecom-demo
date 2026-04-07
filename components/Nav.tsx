"use client"

import Link from "next/link"
import { useCart } from "@/lib/cart-context"
import { useBrandStore } from "@/lib/brand-store"
import { ShoppingCart, Menu, X, ChevronDown } from "lucide-react"
import { useState } from "react"
import { categories } from "@/brand.config"

export default function Nav() {
  const { itemCount } = useCart()
  const { brand } = useBrandStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)

  const textColor = brand.navTextColor ?? "#ffffff"
  const textMuted = textColor + "cc" // ~80% opacity via hex

  return (
    <nav className="sticky top-0 z-50 shadow-md" style={{ backgroundColor: brand.navBgColor }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            {brand.logoImage ? (
              <img src={brand.logoImage} alt={brand.company} className="h-8 w-auto" />
            ) : (
              <span className="font-black text-xl tracking-widest" style={{ color: textColor }}>
                {brand.logoText}
              </span>
            )}
            <span className="text-sm font-medium hidden sm:block" style={{ color: textMuted }}>
              {brand.tagline}
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <div
              className="relative"
              onMouseEnter={() => setCategoriesOpen(true)}
              onMouseLeave={() => setCategoriesOpen(false)}
            >
              <button
                className="flex items-center gap-1 text-sm font-medium transition-opacity hover:opacity-100"
                style={{ color: textMuted }}
              >
                Products <ChevronDown size={14} />
              </button>
              {categoriesOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-xl py-2 border border-gray-100">
                  <Link
                    href="/products"
                    className="block px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 border-b border-gray-100 mb-1"
                  >
                    All Products
                  </Link>
                  {categories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/products?category=${cat.slug}`}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/products"
              className="text-sm font-medium transition-opacity hover:opacity-100"
              style={{ color: textMuted }}
            >
              Catalog
            </Link>

            <Link
              href="/cart"
              className="relative flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-100"
              style={{ color: textMuted }}
            >
              <ShoppingCart size={18} />
              <span>Cart</span>
              {itemCount > 0 && (
                <span
                  className="absolute -top-2 -right-3 min-w-[18px] h-[18px] rounded-full text-xs font-bold flex items-center justify-center px-1"
                  style={{ backgroundColor: brand.accentColor, color: "#000" }}
                >
                  {itemCount}
                </span>
              )}
            </Link>

            <Link
              href="/admin/login"
              className="text-sm font-medium px-4 py-1.5 rounded transition-opacity hover:opacity-100"
              style={{
                color: textColor,
                border: `1px solid ${textColor}66`,
              }}
            >
              Sign In
            </Link>
          </div>

          {/* Mobile: cart + hamburger */}
          <div className="flex items-center gap-3 md:hidden">
            <Link href="/cart" className="relative" style={{ color: textColor }}>
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span
                  className="absolute -top-2 -right-2 min-w-[16px] h-[16px] rounded-full text-[10px] font-bold flex items-center justify-center"
                  style={{ backgroundColor: brand.accentColor, color: "#000" }}
                >
                  {itemCount}
                </span>
              )}
            </Link>
            <button onClick={() => setMobileOpen(!mobileOpen)} style={{ color: textColor }}>
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-4 py-3 space-y-1">
            <Link
              href="/products"
              className="block py-2 text-sm font-semibold text-gray-900"
              onClick={() => setMobileOpen(false)}
            >
              All Products
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                className="flex items-center gap-2 py-2 text-sm text-gray-700"
                onClick={() => setMobileOpen(false)}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </Link>
            ))}
            <div className="pt-2 border-t border-gray-100">
              <Link
                href="/admin/login"
                className="block w-full text-sm font-medium py-2 rounded text-center text-white"
                style={{ backgroundColor: brand.navBgColor }}
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
