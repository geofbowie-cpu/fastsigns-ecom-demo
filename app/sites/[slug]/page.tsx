import { notFound } from "next/navigation"
import Link from "next/link"
import { getTenantBySlug } from "@/lib/tenant"
import { resolveBrand } from "@/lib/resolve-brand"
import { categoriesForTenant, productsForTenant } from "@/lib/product-bank"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) return { title: "Not found" }
  const b = resolveBrand(tenant.brand)
  return {
    title: `${b.company} — Storefront`,
    description: b.heroSubheading,
  }
}

export default async function TenantHomePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()

  const b = resolveBrand(tenant.brand)
  const cats = categoriesForTenant(tenant.enabled_categories)
  const products = productsForTenant(tenant.enabled_categories)
  const featured = products.filter((p) => p.featured).slice(0, 4)

  const trustBadges = [b.trustBadge1, b.trustBadge2, b.trustBadge3, b.trustBadge4].filter(
    Boolean
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Nav */}
      <nav
        className="sticky top-0 z-30 shadow-md"
        style={{ backgroundColor: b.primaryColor }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href={`/sites/${slug}`} className="flex items-center gap-2">
              {b.logoImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.logoImage} alt={b.company} className="h-8 w-auto" />
              ) : (
                <span className="text-white font-black tracking-wide text-lg">
                  {b.logoText}
                </span>
              )}
            </Link>
            <div className="flex items-center gap-6">
              <span className="text-white/80 text-sm hidden sm:inline">{b.tagline}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden min-h-[480px] md:min-h-[560px]">
        {b.heroBgImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={b.heroBgImage}
              alt=""
              aria-hidden
              className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
              style={{
                objectPosition: `${b.heroBgPosition.x}% ${b.heroBgPosition.y}%`,
                transform:
                  b.heroBgZoom !== 1 ? `scale(${b.heroBgZoom})` : undefined,
                transformOrigin: `${b.heroBgPosition.x}% ${b.heroBgPosition.y}%`,
              }}
            />
            <div
              className="absolute inset-0"
              style={{ backgroundColor: `rgba(0,0,0,${b.heroBgOverlay})` }}
            />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${b.heroGradientFrom} 0%, ${b.heroGradientTo} 100%)`,
            }}
          />
        )}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
              {b.heroHeading}
            </h1>
            <p className="text-lg text-white/80 leading-relaxed mb-8 max-w-xl">
              {b.heroSubheading}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/sites/${slug}/${b.heroCta1Url}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: b.heroCta1Color, color: "#000" }}
              >
                {b.heroCta1Text} →
              </Link>
              {b.heroCta2Text && (
                <Link
                  href={`/sites/${slug}/${b.heroCta2Url}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm bg-white/10 text-white border border-white/20 hover:bg-white/20"
                >
                  {b.heroCta2Text}
                </Link>
              )}
            </div>
            {trustBadges.length > 0 && (
              <div className="flex flex-wrap gap-4 mt-8">
                {trustBadges.map((t) => (
                  <div
                    key={t}
                    className="text-white/70 text-xs flex items-center gap-1.5"
                  >
                    <span className="text-green-400">✓</span> {t}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 w-full">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">{b.catSectionHeading}</h2>
          <p className="text-gray-500 text-sm mt-1">{b.catSectionSubheading}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {cats.map((cat) => (
            <div
              key={cat.slug}
              className="bg-white rounded-xl p-4 text-center border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="text-3xl mb-2">{cat.icon}</div>
              <div className="text-xs font-semibold text-gray-800 leading-tight">
                {cat.name}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="bg-white border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                {b.featuredSectionHeading}
              </h2>
              <p className="text-gray-500 text-sm mt-1">{b.featuredSectionSubheading}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((p) => (
                <div
                  key={p.slug}
                  className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div
                    className="h-40 flex items-center justify-center text-5xl"
                    style={{
                      background: `linear-gradient(135deg, ${p.gradientFrom} 0%, ${p.gradientTo} 100%)`,
                    }}
                  >
                    {p.icon}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 text-sm">{p.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.shortDesc}</p>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-xs text-gray-500">from</span>
                      <span className="font-bold text-gray-900">${p.startingPrice}</span>
                      <span className="text-xs text-gray-500">/ {p.unit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer
        className="mt-auto py-8"
        style={{ backgroundColor: b.primaryDark, color: "#ffffff" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/70">
          <span>{b.footerTagline}</span>
          <span>{b.supportEmail}</span>
        </div>
      </footer>
    </div>
  )
}
