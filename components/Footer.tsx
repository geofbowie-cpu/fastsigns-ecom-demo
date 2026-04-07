"use client"

import Link from "next/link"
import { useBrandStore } from "@/lib/brand-store"
import { categories } from "@/brand.config"

export default function Footer() {
  const { brand } = useBrandStore()

  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            {brand.logoImage ? (
              <img src={brand.logoImage} alt={brand.company} className="h-8 w-auto mb-2 brightness-0 invert" />
            ) : (
              <div className="text-white font-black text-lg tracking-widest mb-2">
                {brand.logoText}
              </div>
            )}
            <p className="text-sm leading-relaxed mb-4">{brand.tagline}</p>
            <p className="text-xs text-gray-500">{brand.footerTagline}</p>
            {brand.procurementSystem && (
              <div className="mt-3 inline-flex items-center gap-1.5 text-xs bg-gray-800 rounded px-2 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"></span>
                Connected to {brand.procurementLabel}
              </div>
            )}
          </div>

          {/* Product categories */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-3 uppercase tracking-wider">
              Products
            </h4>
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/products?category=${cat.slug}`}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-3 uppercase tracking-wider">
              Support
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href={`mailto:${brand.supportEmail}`} className="hover:text-white transition-colors">
                  {brand.supportEmail}
                </a>
              </li>
              <li className="text-gray-500 text-xs mt-4 leading-relaxed">
                This is a demo storefront. Orders placed here are not processed for payment.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800 text-xs text-gray-600 flex flex-col sm:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} {brand.company}. All rights reserved.</span>
          <span>{brand.footerTagline}</span>
        </div>
      </div>
    </footer>
  )
}
