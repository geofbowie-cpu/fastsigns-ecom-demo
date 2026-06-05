export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import Link from "next/link"
import { getTenantBySlug } from "@/lib/tenant"
import { resolveBrand } from "@/lib/resolve-brand"
import { getProducts, getCategories } from "@/lib/products-db"
import { isMasterAuthed } from "@/lib/master-auth"
import CategoryIcon from "@/components/CategoryIcon"
import { PhoneLink, EmailLink } from "@/components/TrackableLink"
import HeroCtaButtons from "./_components/HeroCtaButtons"

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
  const [tenant, isAdmin] = await Promise.all([
    getTenantBySlug(slug),
    isMasterAuthed(),
  ])
  if (!tenant) notFound()

  const b = resolveBrand(tenant.brand)
  const [cats, products] = await Promise.all([
    getCategories({
      enabledCategories: tenant.enabled_categories,
      importTags: tenant.import_tags,
    }),
    getProducts({
      enabledCategories: tenant.enabled_categories,
      importTags: tenant.import_tags,
      overrides: tenant.product_overrides,
    }),
  ])
  const featured = products.filter((p) => p.featured).slice(0, 4)

  const trustBadges = [b.trustBadge1, b.trustBadge2, b.trustBadge3, b.trustBadge4].filter(
    Boolean
  )

  // v2 theme guard — route to new design if opted in
  if (tenant.theme === "v2") {
    const { default: V2HomePage } = await import("./_v2/V2HomePage")
    return <V2HomePage slug={slug} tenant={tenant} b={b} cats={cats} products={products} featured={featured} isAdmin={isAdmin} />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Live contact bar */}
      {tenant.status === "live" && b.contactEmail && (
        <div className="bg-gray-900 text-white text-xs px-4 py-2 flex items-center justify-end gap-4">
          {b.contactName && <span className="text-gray-400">Your rep: <span className="text-white font-medium">{b.contactName}</span></span>}
          <EmailLink email={b.contactEmail} tenantSlug={slug} context="contact_bar" className="text-blue-300 hover:text-blue-200">{b.contactEmail}</EmailLink>
          {b.contactPhone && <PhoneLink phone={b.contactPhone} tenantSlug={slug} className="text-gray-300 hover:text-white">{b.contactPhone}</PhoneLink>}
        </div>
      )}
      {/* Admin bar — only visible when master-authed */}
      {isAdmin && (
        <div className="sticky top-0 z-50 bg-gray-900 border-b border-yellow-500 text-white text-xs flex items-center justify-between px-4 py-2">
          <span className="text-yellow-400 font-semibold">
            ⚡ Admin preview — {tenant.name}
            <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-semibold ${tenant.status === "live" ? "bg-green-500 text-white" : "bg-blue-500 text-white"}`}>
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
      )}
      {/* Nav */}
      <nav
        className="sticky top-0 z-30 shadow-md"
        style={{ backgroundColor: b.headerBgColor }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href={`/sites/${slug}`} className="flex items-center gap-2">
              {b.logoImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.logoImage} alt={b.company} style={{ height: b.logoHeight }} className="w-auto" />
              ) : (
                <span className="font-black tracking-wide text-lg" style={{ color: b.navTextColor }}>
                  {b.logoText}
                </span>
              )}
            </Link>
            <div className="flex items-center gap-6">
              <span className="text-sm hidden sm:inline" style={{ color: b.navTextColor, opacity: 0.8 }}>{b.tagline}</span>
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
            <HeroCtaButtons
              slug={slug}
              tenantSlug={slug}
              cta1Text={b.heroCta1Text}
              cta1Url={b.heroCta1Url}
              cta1Color={b.heroCta1Color}
              cta1TextColor={b.heroCta1TextColor}
              cta1Icon={b.heroCta1Icon}
              cta2Text={b.heroCta2Text ?? undefined}
              cta2Url={b.heroCta2Url ?? undefined}
              cta2Color={b.heroCta2Color ?? undefined}
              cta2TextColor={b.heroCta2TextColor ?? undefined}
              cta2Icon={b.heroCta2Icon ?? undefined}
            />
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {cats.map((cat) => {
            const imgUrl = b.categoryImages[cat.slug] ?? cat.imageUrl
            return imgUrl ? (
              <Link
                key={cat.slug}
                href={`/sites/${slug}/products?category=${cat.slug}`}
                className="relative rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg hover:scale-[1.02] transition-all group aspect-[4/3]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgUrl} alt={cat.name} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="text-xs font-bold text-white leading-tight drop-shadow">
                    {cat.name}
                  </div>
                </div>
              </Link>
            ) : (
              <Link
                key={cat.slug}
                href={`/sites/${slug}/products?category=${cat.slug}`}
                className="bg-white rounded-xl p-4 text-center border border-gray-100 hover:shadow-md hover:border-gray-300 transition-all group"
              >
                <div className="mb-2 group-hover:scale-110 transition-transform inline-flex items-center justify-center w-8 h-8 opacity-80">
                  <CategoryIcon name={cat.icon} size={28} strokeWidth={1.5} />
                </div>
                <div className="text-xs font-semibold text-gray-800 leading-tight">
                  {cat.name}
                </div>
              </Link>
            )
          })}
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
                <Link
                  key={p.slug}
                  href={`/sites/${slug}/products/${p.slug}`}
                  className="group bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                >
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="h-40 w-full object-cover"
                    />
                  ) : (
                    <div
                      className="h-40 flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${p.gradientFrom} 0%, ${p.gradientTo} 100%)`,
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-white/70">
                        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M3 16l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 text-sm group-hover:underline">{p.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.shortDesc}</p>
                    {b.showPricing && tenant.status !== "live" && (
                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="text-xs text-gray-500">from</span>
                        <span className="font-bold text-gray-900">${p.startingPrice}</span>
                        <span className="text-xs text-gray-500">/ {p.unit}</span>
                      </div>
                    )}
                    {tenant.status === "live" && (
                      <div
                        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold"
                        style={{ color: b.buttonColor }}
                      >
                        {b.orderCtaText} →
                      </div>
                    )}
                  </div>
                </Link>
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
