// V2 home page — Amazon-style utility-first layout driven by tenant brand data.
// Server component: no useState, no "use client".

import Link from "next/link"
import { v2FontVars } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/v2/ui/badge"
import { Breadcrumb } from "@/components/v2/ui/breadcrumb"
import { EmailLink, PhoneLink } from "@/components/TrackableLink"
import V2SearchBox from "../products/_v2/V2SearchBox"
import type { ResolvedBrand } from "@/lib/resolve-brand"
import type { BankProduct, BankCategory } from "@/lib/product-bank"
import type { Tenant } from "@/lib/tenant"

export type V2HomePageProps = {
  slug: string
  tenant: Tenant
  b: ResolvedBrand
  cats: BankCategory[]
  products: BankProduct[]
  featured: BankProduct[]
  isAdmin: boolean
}

// ─── helpers ────────────────────────────────────────────────────────────────

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr))
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
            tenant.status === "live" ? "bg-green-500 text-white" : "bg-blue-500 text-white"
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
        <Link href={`/sites/${slug}`} className="flex-shrink-0 flex items-center gap-2 mr-4">
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

        {/* Search box — navigates to the products page with the query applied */}
        <V2SearchBox slug={slug} navTextColor={b.navTextColor} />

        {/* Right side */}
        <div className="flex items-center gap-3 ml-4">
          {/* Quote cart badge */}
          <div className="relative flex-shrink-0">
            <div
              className="flex flex-col items-center leading-none cursor-pointer"
              style={{ color: b.navTextColor }}
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              <span className="text-xs mt-0.5 font-semibold" style={{ opacity: 0.9 }}>Quote</span>
            </div>
            <span
              className="absolute -top-1 -right-2 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ backgroundColor: b.primaryColor }}
            >
              0
            </span>
          </div>

          {/* Tagline — hidden on mobile */}
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
}: {
  cats: BankCategory[]
  slug: string
  primaryColor: string
}) {
  return (
    <nav className="bg-white border-b border-ink-200 shadow-soft">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
          {/* All Products pill */}
          <Link
            href={`/sites/${slug}/products`}
            className="flex-shrink-0 inline-flex items-center px-4 py-1.5 rounded-pill text-xs font-semibold transition-colors text-white"
            style={{ backgroundColor: primaryColor }}
          >
            All Products
          </Link>
          {cats.map((cat) => (
            <Link
              key={cat.slug}
              href={`/sites/${slug}/products?category=${cat.slug}`}
              className="flex-shrink-0 inline-flex items-center px-4 py-1.5 rounded-pill text-xs font-medium transition-colors text-ink-700 hover:text-ink-900 bg-ink-100 hover:bg-ink-200"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

function AnnouncementBanner({
  b,
  slug,
}: {
  b: ResolvedBrand
  slug: string
}) {
  const cta1Href = b.heroCta1Url?.startsWith("http")
    ? b.heroCta1Url
    : `/sites/${slug}/${b.heroCta1Url ?? "products"}`
  const cta2Href = b.heroCta2Text
    ? (b.heroCta2Url?.startsWith("http") ? b.heroCta2Url : `/sites/${slug}/${b.heroCta2Url ?? "products"}`)
    : null

  return (
    <div className="relative w-full overflow-hidden h-80">{/* h-80 = 320px */}
      {/* Background — image if available, otherwise brand gradient */}
      {b.heroBgImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={b.heroBgImage}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
          style={{ objectPosition: `${b.heroBgPosition?.x ?? 50}% ${b.heroBgPosition?.y ?? 50}%` }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(135deg, ${b.heroGradientFrom ?? b.primaryColor} 0%, ${b.heroGradientTo ?? b.primaryColor} 100%)` }}
        />
      )}

      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: `rgba(0,0,0,${b.heroBgOverlay ?? 0.45})` }}
      />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center px-8 md:px-16 max-w-3xl">
        {b.heroHeading && (
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white leading-tight mb-2 drop-shadow-sm">
            {b.heroHeading}
          </h2>
        )}
        {b.heroSubheading && (
          <p className="text-sm md:text-base text-white/80 mb-5 max-w-xl line-clamp-2">
            {b.heroSubheading}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          {b.heroCta1Text && (
            <Link
              href={cta1Href}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold rounded-pill hover:opacity-90 transition-opacity"
              style={{ backgroundColor: b.heroCta1Color ?? b.buttonColor, color: b.heroCta1TextColor ?? b.buttonTextColor }}
            >
              {b.heroCta1Text}{b.heroCta1Icon ? ` ${b.heroCta1Icon}` : ""}
            </Link>
          )}
          {cta2Href && b.heroCta2Text && (
            <Link
              href={cta2Href}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold rounded-pill hover:opacity-90 transition-opacity border border-white/40 text-white"
              style={b.heroCta2Color ? { backgroundColor: b.heroCta2Color, color: b.heroCta2TextColor } : { backgroundColor: "rgba(255,255,255,0.12)" }}
            >
              {b.heroCta2Text}{b.heroCta2Icon ? ` ${b.heroCta2Icon}` : ""}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

function FilterSidebar({
  cats,
  products,
  slug,
}: {
  cats: BankCategory[]
  products: BankProduct[]
  slug: string
}) {
  const leadTimes = unique(products.map((p) => p.leadTime).filter(Boolean))
  const materials = unique(
    products.flatMap((p) => (p.materials.length > 0 ? [p.materials[0]] : [])).filter(Boolean)
  ).slice(0, 6)

  return (
    <aside className="w-60 flex-shrink-0 hidden md:block">
      <div className="bg-white rounded-card shadow-soft border border-ink-200 overflow-hidden">
        {/* Category filter */}
        <details open className="group border-b border-ink-200 last:border-0">
          <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-ink-50 text-sm font-semibold text-ink-900 list-none">
            Category
            <svg className="h-4 w-4 text-ink-400 group-open:rotate-180 transition-transform" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </summary>
          <ul className="px-4 pb-3 space-y-1.5">
            <li>
              <Link
                href={`/sites/${slug}/products`}
                className="text-sm text-ink-600 hover:text-ink-900 hover:underline"
              >
                All products
              </Link>
            </li>
            {cats.map((cat) => (
              <li key={cat.slug}>
                <Link
                  href={`/sites/${slug}/products?category=${cat.slug}`}
                  className="text-sm text-ink-600 hover:text-ink-900 hover:underline"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </details>

        {/* Lead time filter */}
        {leadTimes.length > 0 && (
          <details className="group border-b border-ink-200 last:border-0">
            <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-ink-50 text-sm font-semibold text-ink-900 list-none">
              Lead Time
              <svg className="h-4 w-4 text-ink-400 group-open:rotate-180 transition-transform" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </summary>
            <ul className="px-4 pb-3 space-y-1.5">
              {leadTimes.map((lt) => (
                <li key={lt}>
                  <span className="text-sm text-ink-600">{lt}</span>
                </li>
              ))}
            </ul>
          </details>
        )}

        {/* Material filter */}
        {materials.length > 0 && (
          <details className="group border-b border-ink-200 last:border-0">
            <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-ink-50 text-sm font-semibold text-ink-900 list-none">
              Material
              <svg className="h-4 w-4 text-ink-400 group-open:rotate-180 transition-transform" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </summary>
            <ul className="px-4 pb-3 space-y-1.5">
              {materials.map((mat) => (
                <li key={mat}>
                  <span className="text-sm text-ink-600">{mat}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </aside>
  )
}

function ProductCard({
  product,
  slug,
  b,
}: {
  product: BankProduct
  slug: string
  b: ResolvedBrand
}) {
  return (
    <Link
      href={`/sites/${slug}/products/${product.slug}`}
      className="group block bg-white rounded-card shadow-soft border border-ink-200 overflow-hidden transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-elevated"
    >
      {/* Image / gradient */}
      <div className="aspect-[4/3] overflow-hidden relative">
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
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-white/60">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M3 16l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-3">
        <h3 className="font-display font-semibold text-ink-900 text-sm leading-snug group-hover:underline line-clamp-2 mb-1">
          {product.name}
        </h3>
        <p className="text-xs text-ink-600 line-clamp-2 mb-2">{product.shortDesc}</p>

        {/* Badges row */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Badge className="text-[10px] px-2 py-0.5">{product.category}</Badge>
          {product.leadTime && (
            <Badge variant="success" className="text-[10px] px-2 py-0.5">
              {product.leadTime}
            </Badge>
          )}
        </div>

        {/* CTA */}
        <div
          className="w-full text-center py-1.5 px-3 rounded-card text-xs font-semibold transition-opacity hover:opacity-90"
          style={{
            backgroundColor: b.buttonColor,
            color: b.buttonTextColor,
          }}
        >
          {b.quoteCtaText}
        </div>
      </div>
    </Link>
  )
}

function FeaturedRow({
  featured,
  slug,
  b,
}: {
  featured: BankProduct[]
  slug: string
  b: ResolvedBrand
}) {
  return (
    <section className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      <div className="mb-4">
        <h2 className="font-display font-bold text-ink-900 text-xl">
          {b.featuredSectionHeading || "Featured products"}
        </h2>
        {b.featuredSectionSubheading && (
          <p className="text-sm text-ink-600 mt-0.5">{b.featuredSectionSubheading}</p>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {featured.map((p) => (
          <ProductCard key={p.slug} product={p} slug={slug} b={b} />
        ))}
      </div>
    </section>
  )
}

function ProductGrid({
  products,
  cats,
  slug,
  b,
}: {
  products: BankProduct[]
  cats: BankCategory[]
  slug: string
  b: ResolvedBrand
}) {
  return (
    <div className="flex-1 min-w-0">
      {/* Breadcrumb + count */}
      <div className="flex items-center justify-between mb-4">
        <Breadcrumb
          items={[
            { label: "Home", href: `/sites/${slug}` },
            { label: "All products" },
          ]}
        />
        <span className="text-xs text-ink-600 font-medium">
          {products.length} product{products.length !== 1 ? "s" : ""}
        </span>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-card border border-ink-200 shadow-soft">
          <svg className="h-10 w-10 text-ink-400 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
          </svg>
          <p className="font-display font-semibold text-ink-900 text-sm mb-1">No products yet</p>
          <p className="text-xs text-ink-600 max-w-xs">
            Check back soon — products are being added to this storefront.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {products.map((p) => (
            <ProductCard key={p.slug} product={p} slug={slug} b={b} />
          ))}
        </div>
      )}
    </div>
  )
}

function Footer({ b }: { b: ResolvedBrand }) {
  return (
    <footer className="bg-ink-900 text-white mt-auto">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Company */}
          <div>
            <p className="font-display font-bold text-sm mb-1">{b.company}</p>
            {b.footerTagline && (
              <p className="text-xs text-ink-400 leading-relaxed">{b.footerTagline}</p>
            )}
          </div>
          {/* Support */}
          {b.supportEmail && (
            <div>
              <p className="font-semibold text-xs text-ink-400 uppercase tracking-wide mb-1">Support</p>
              <a
                href={`mailto:${b.supportEmail}`}
                className="text-xs text-blue-300 hover:text-blue-200"
              >
                {b.supportEmail}
              </a>
            </div>
          )}
          {/* Tagline */}
          {b.tagline && (
            <div>
              <p className="font-semibold text-xs text-ink-400 uppercase tracking-wide mb-1">About</p>
              <p className="text-xs text-ink-400 leading-relaxed">{b.tagline}</p>
            </div>
          )}
        </div>
        <div className="mt-8 pt-6 border-t border-ink-600 text-[10px] text-ink-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} {b.company}. All rights reserved.</span>
          <span>Powered by FASTSIGNS Enterprise</span>
        </div>
      </div>
    </footer>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function V2HomePage({
  slug,
  tenant,
  b,
  cats,
  products,
  featured,
  isAdmin,
}: V2HomePageProps) {
  return (
    <div className={cn(v2FontVars, "font-body bg-ink-50 min-h-screen flex flex-col")}>
      {/* 1. Admin bar */}
      {isAdmin && <AdminBar tenant={tenant} slug={slug} />}

      {/* 2. Utility bar */}
      <UtilityBar b={b} slug={slug} />

      {/* 3. Main header */}
      <MainHeader b={b} slug={slug} />

      {/* 4. Departments strip */}
      <DepartmentsStrip cats={cats} slug={slug} primaryColor={b.primaryColor} />

      {/* 5. Announcement banner */}
      <AnnouncementBanner b={b} slug={slug} />

      {/* 5b. Featured products (admin-curated order) */}
      {featured.length > 0 && <FeaturedRow featured={featured} slug={slug} b={b} />}

      {/* 6. Main browse area */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-start gap-6">
          {/* Left sidebar */}
          <FilterSidebar cats={cats} products={products} slug={slug} />

          {/* Right grid */}
          <ProductGrid products={products} cats={cats} slug={slug} b={b} />
        </div>
      </main>

      {/* 7. Footer */}
      <Footer b={b} />
    </div>
  )
}
