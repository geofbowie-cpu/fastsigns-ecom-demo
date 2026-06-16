// V2 Product detail page — Amazon-style utility-first layout.
// Server component: no useState, no "use client".

import { Suspense } from "react"
import Link from "next/link"
import { v2FontVars } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/v2/ui/badge"
import { Breadcrumb } from "@/components/v2/ui/breadcrumb"
import { EmailLink, PhoneLink } from "@/components/TrackableLink"
import QuoteButton from "../_components/QuoteButton"
import ProductViewTracker from "../_components/ProductViewTracker"
import AddToCartButton from "../../../_cart/AddToCartButton"
import type { ResolvedBrand } from "@/lib/resolve-brand"
import type { BankProduct, BankCategory } from "@/lib/product-bank"
import type { Tenant } from "@/lib/tenant"

export type V2ProductDetailPageProps = {
  slug: string
  tenant: Tenant
  b: ResolvedBrand
  product: BankProduct
  category: BankCategory | undefined
  related: BankProduct[]
  cats: BankCategory[]
  isAdmin: boolean
  isLive: boolean
  mailHref: string
}

// ─── sub-components (all inline, server-only) ────────────────────────────────

function AdminBar({ tenant, slug }: { tenant: Tenant; slug: string }) {
  return (
    <div className="sticky top-0 z-50 bg-gray-900 border-b border-yellow-500 text-white text-xs flex items-center justify-between px-4 py-2">
      <span className="text-yellow-400 font-semibold">
        ⚡ Admin preview — {tenant.name}
        <span
          className={cn(
            "ml-2 px-1.5 py-0.5 rounded text-xs font-semibold",
            tenant.status === "live"
              ? "bg-green-500 text-white"
              : "bg-blue-500 text-white"
          )}
        >
          {tenant.status === "live" ? "LIVE" : "DEMO"}
        </span>
      </span>
      <div className="flex items-center gap-4">
        <Link
          href={`/master/sites/${tenant.id}/edit`}
          className="text-yellow-300 hover:text-yellow-100 font-medium"
        >
          Edit site ↗
        </Link>
        <Link
          href="/master"
          className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold px-3 py-1 rounded"
        >
          ← Back to admin
        </Link>
      </div>
    </div>
  )
}

function UtilityBar({ b, slug }: { b: ResolvedBrand; slug: string }) {
  return (
    <div className="bg-ink-900 text-white text-xs px-4 py-1.5 flex items-center justify-between">
      <span className="text-ink-400 hidden sm:inline">
        Your locations, one storefront
      </span>
      {b.contactEmail && (
        <div className="flex items-center gap-4 ml-auto">
          {b.contactName && (
            <span className="text-ink-400">
              Rep:{" "}
              <span className="text-white font-medium">{b.contactName}</span>
            </span>
          )}
          <EmailLink
            email={b.contactEmail}
            tenantSlug={slug}
            context="utility_bar"
            className="text-blue-300 hover:text-blue-200"
          >
            {b.contactEmail}
          </EmailLink>
          {b.contactPhone && (
            <PhoneLink
              phone={b.contactPhone}
              tenantSlug={slug}
              className="text-ink-300 hover:text-white"
            >
              {b.contactPhone}
            </PhoneLink>
          )}
        </div>
      )}
    </div>
  )
}

function MainHeader({ b, slug }: { b: ResolvedBrand; slug: string }) {
  return (
    <header
      className="sticky top-0 z-30 shadow-soft"
      style={{ backgroundColor: b.headerBgColor }}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-4">
        {/* Logo */}
        <Link
          href={`/sites/${slug}`}
          className="flex-shrink-0 flex items-center gap-2 mr-4"
        >
          {b.logoImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={b.logoImage}
              alt={b.company}
              style={{ height: b.logoHeight }}
              className="w-auto"
            />
          ) : (
            <span
              className="font-display font-extrabold tracking-wide text-lg leading-none"
              style={{ color: b.navTextColor }}
            >
              {b.logoText}
            </span>
          )}
        </Link>

        {/* Search box — static link for product detail (no client search state needed) */}
        <Link
          href={`/sites/${slug}/products`}
          className="flex-1 max-w-2xl rounded-card border-2 border-white/20 bg-white/10 flex items-center h-10 px-3 gap-2 cursor-text hover:bg-white/15 transition-colors"
        >
          <svg
            className="h-4 w-4 flex-shrink-0"
            style={{ color: b.navTextColor, opacity: 0.6 }}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
          <span
            className="text-sm"
            style={{ color: b.navTextColor, opacity: 0.5 }}
          >
            Search products, categories…
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3 ml-4">
          <div
            className="relative flex-shrink-0"
          >
            <div
              className="flex flex-col items-center leading-none cursor-pointer"
              style={{ color: b.navTextColor }}
            >
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                />
              </svg>
              <span className="text-xs mt-0.5 font-semibold" style={{ opacity: 0.9 }}>
                Quote
              </span>
            </div>
            <span
              className="absolute -top-1 -right-2 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ backgroundColor: b.primaryColor }}
            >
              0
            </span>
          </div>

          {b.tagline && (
            <span
              className="hidden lg:inline text-xs max-w-[160px] text-right leading-tight"
              style={{ color: b.navTextColor, opacity: 0.75 }}
            >
              {b.tagline}
            </span>
          )}
        </div>
      </div>
    </header>
  )
}

function DepartmentsStrip({
  cats,
  slug,
  primaryColor,
  activeCategory,
}: {
  cats: BankCategory[]
  slug: string
  primaryColor: string
  activeCategory: string | undefined
}) {
  return (
    <nav className="bg-white border-b border-ink-200 shadow-soft">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
          <Link
            href={`/sites/${slug}/products`}
            className={cn(
              "flex-shrink-0 inline-flex items-center px-4 py-1.5 rounded-pill text-xs font-semibold transition-colors",
              !activeCategory
                ? "text-white"
                : "text-ink-700 hover:text-ink-900 bg-ink-100 hover:bg-ink-200"
            )}
            style={!activeCategory ? { backgroundColor: primaryColor } : undefined}
          >
            All Products
          </Link>
          {cats.map((cat) => (
            <Link
              key={cat.slug}
              href={`/sites/${slug}/products?category=${cat.slug}`}
              className={cn(
                "flex-shrink-0 inline-flex items-center px-4 py-1.5 rounded-pill text-xs font-medium transition-colors",
                activeCategory === cat.slug
                  ? "text-white"
                  : "text-ink-700 hover:text-ink-900 bg-ink-100 hover:bg-ink-200"
              )}
              style={
                activeCategory === cat.slug
                  ? { backgroundColor: primaryColor }
                  : undefined
              }
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

function Footer({ b }: { b: ResolvedBrand }) {
  return (
    <footer className="bg-ink-900 text-white mt-auto">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <p className="font-display font-bold text-sm mb-1">{b.company}</p>
            {b.footerTagline && (
              <p className="text-xs text-ink-400 leading-relaxed">{b.footerTagline}</p>
            )}
          </div>
          {b.supportEmail && (
            <div>
              <p className="font-semibold text-xs text-ink-400 uppercase tracking-wide mb-1">
                Support
              </p>
              <a
                href={`mailto:${b.supportEmail}`}
                className="text-xs text-blue-300 hover:text-blue-200"
              >
                {b.supportEmail}
              </a>
            </div>
          )}
          {b.tagline && (
            <div>
              <p className="font-semibold text-xs text-ink-400 uppercase tracking-wide mb-1">
                About
              </p>
              <p className="text-xs text-ink-400 leading-relaxed">{b.tagline}</p>
            </div>
          )}
        </div>
        <div className="mt-8 pt-6 border-t border-ink-600 text-[10px] text-ink-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © {new Date().getFullYear()} {b.company}. All rights reserved.
          </span>
          <span>Powered by FASTSIGNS Enterprise</span>
        </div>
      </div>
    </footer>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function V2ProductDetailPage({
  slug,
  tenant,
  b,
  product,
  category,
  related,
  cats,
  isAdmin,
  isLive,
  mailHref,
}: V2ProductDetailPageProps) {
  const ctaEmail = b.contactEmail || b.supportEmail

  return (
    <div className={cn(v2FontVars, "font-body bg-ink-50 min-h-screen flex flex-col")}>
      {/* Analytics tracker — client component, renders null */}
      <ProductViewTracker
        productSlug={product.slug}
        productName={product.name}
        category={product.category}
        tenantSlug={slug}
      />

      {/* 1. Admin bar */}
      {isAdmin && <AdminBar tenant={tenant} slug={slug} />}

      {/* 2. Utility bar */}
      <UtilityBar b={b} slug={slug} />

      {/* 3. Main header */}
      <MainHeader b={b} slug={slug} />

      {/* 4. Departments strip */}
      <DepartmentsStrip
        cats={cats}
        slug={slug}
        primaryColor={b.primaryColor}
        activeCategory={category?.slug}
      />

      {/* 5. Main content */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb
            items={[
              { label: "Home", href: `/sites/${slug}` },
              ...(category
                ? [
                    {
                      label: category.name,
                      href: `/sites/${slug}/products?category=${product.category}`,
                    },
                  ]
                : [{ label: "Products", href: `/sites/${slug}/products` }]),
              { label: product.name },
            ]}
          />
        </div>

        {/* Two-column product detail */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left: image or gradient swatch */}
          <div className="rounded-card overflow-hidden bg-white border border-ink-200 shadow-soft aspect-[4/3]">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${product.gradientFrom} 0%, ${product.gradientTo} 100%)`,
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-20 h-20 text-white/70"
                >
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M3 16l5-5 4 4 3-3 6 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Right: product info */}
          <div className="space-y-5">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {category && (
                <Badge className="text-xs">
                  {category.name}
                </Badge>
              )}
              {product.leadTime && (
                <Badge variant="success" className="text-xs">
                  {product.leadTime}
                </Badge>
              )}
            </div>

            {/* Name + short desc */}
            <div>
              <h1 className="font-display font-bold text-ink-900 text-2xl sm:text-3xl leading-tight">
                {product.name}
              </h1>
              {product.shortDesc && (
                <p className="text-base text-ink-600 mt-2 leading-relaxed">
                  {product.shortDesc}
                </p>
              )}
            </div>

            <hr className="border-ink-200" />

            {/* Full description */}
            {product.description && (
              <p className="text-sm text-ink-700 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Sizes */}
            {product.sizes.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">
                  Available sizes
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {product.sizes.map((s) => (
                    <span
                      key={s}
                      className="text-xs bg-ink-100 text-ink-700 px-3 py-1 rounded-pill font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Materials */}
            {product.materials.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">
                  Materials
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {product.materials.map((m) => (
                    <span
                      key={m}
                      className="text-xs bg-ink-100 text-ink-700 px-3 py-1 rounded-pill font-medium"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Conversion action — cart when ordering is enabled, else quote/contact */}
            {tenant.enable_cart ? (
              <AddToCartButton
                slug={slug}
                product={{ slug: product.slug, name: product.name, imageUrl: product.imageUrl, unit: product.unit, minOrderQty: product.minOrderQty, orderIncrement: product.orderIncrement }}
                buttonColor={b.buttonColor}
                buttonTextColor={b.buttonTextColor}
              />
            ) : isLive ? (
              <div className="bg-white rounded-card border border-ink-200 shadow-soft p-6 space-y-4">
                <div>
                  <h3 className="font-display font-bold text-ink-900 text-lg">
                    Ready to order?
                  </h3>
                  <p className="text-sm text-ink-600 mt-1">
                    {b.contactName
                      ? `Get in touch with ${b.contactName} to place your order or ask about custom sizing.`
                      : "Contact us to place your order or ask about custom sizing."}
                  </p>
                </div>
                {b.contactName && (
                  <p className="text-sm font-semibold text-ink-900">{b.contactName}</p>
                )}
                <EmailLink
                  email={ctaEmail}
                  href={mailHref}
                  tenantSlug={slug}
                  context="product_cta"
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-card font-bold text-sm hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: b.buttonColor, color: b.buttonTextColor }}
                >
                  {b.orderCtaText} — {product.name}
                </EmailLink>
                {b.contactPhone && (
                  <PhoneLink
                    phone={b.contactPhone}
                    tenantSlug={slug}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-card font-semibold text-sm border-2 text-ink-700 hover:bg-ink-50 transition-colors"
                    style={{ borderColor: b.buttonColor }}
                  >
                    {b.contactPhone}
                  </PhoneLink>
                )}
              </div>
            ) : (
              <Suspense>
                <QuoteButton
                  tenantSlug={slug}
                  productSlug={product.slug}
                  productName={product.name}
                  ctaText={b.quoteCtaText}
                  buttonColor={b.buttonColor}
                  buttonTextColor={b.buttonTextColor}
                  allowedDomains={tenant.allowed_domains ?? []}
                />
              </Suspense>
            )}
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display font-bold text-ink-900 text-xl mb-5">
              More in {category?.name ?? "this category"}
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  href={`/sites/${slug}/products/${p.slug}`}
                  className="group flex-shrink-0 w-56 bg-white rounded-card border border-ink-200 shadow-soft overflow-hidden hover:-translate-y-0.5 hover:shadow-elevated transition-all duration-200"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${p.gradientFrom} 0%, ${p.gradientTo} 100%)`,
                        }}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          className="w-8 h-8 text-white/60"
                        >
                          <rect
                            x="3"
                            y="3"
                            width="18"
                            height="18"
                            rx="2"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                          <path
                            d="M3 16l5-5 4 4 3-3 6 6"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-display font-semibold text-ink-900 text-sm leading-snug group-hover:underline line-clamp-2">
                      {p.name}
                    </h3>
                    <p className="text-xs text-ink-600 line-clamp-2 mt-1">{p.shortDesc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* 6. Footer */}
      <Footer b={b} />
    </div>
  )
}
