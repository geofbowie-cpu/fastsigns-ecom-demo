export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import Link from "next/link"
import { getTenantBySlug } from "@/lib/tenant"
import { resolveBrand } from "@/lib/resolve-brand"
import { getProducts, getCategories } from "@/lib/products-db"
import { isMasterAuthed } from "@/lib/master-auth"

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>
}) {
  const { slug, productSlug } = await params
  const [tenant, isAdmin] = await Promise.all([
    getTenantBySlug(slug),
    isMasterAuthed(),
  ])
  if (!tenant) notFound()

  const b = resolveBrand(tenant.brand)
  const [all, cats] = await Promise.all([
    getProducts({
      enabledCategories: tenant.enabled_categories,
      importTags: tenant.import_tags,
      overrides: tenant.product_overrides,
    }),
    getCategories({
      enabledCategories: tenant.enabled_categories,
      importTags: tenant.import_tags,
    }),
  ])

  const product = all.find((p) => p.slug === productSlug)
  if (!product) notFound()

  const category = cats.find((c) => c.slug === product.category)
  const related = all
    .filter((p) => p.category === product.category && p.slug !== product.slug)
    .slice(0, 3)

  const isLive = tenant.status === "live"
  const mailSubject = encodeURIComponent(`Order inquiry: ${product.name}`)
  // Fall back to supportEmail if the tenant has no contactEmail. supportEmail
  // is always populated via resolveBrand (defaults to support@fastsigns.com).
  const ctaEmail = b.contactEmail || b.supportEmail
  const mailHref = `mailto:${ctaEmail}?subject=${mailSubject}`

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Live contact bar */}
      {isLive && b.contactEmail && (
        <div className="bg-gray-900 text-white text-xs px-4 py-2 flex items-center justify-end gap-4">
          {b.contactName && (
            <span className="text-gray-400">
              Your rep: <span className="text-white font-medium">{b.contactName}</span>
            </span>
          )}
          <a href={`mailto:${b.contactEmail}`} className="text-blue-300 hover:text-blue-200">
            {b.contactEmail}
          </a>
          {b.contactPhone && (
            <a href={`tel:${b.contactPhone}`} className="text-gray-300 hover:text-white">
              {b.contactPhone}
            </a>
          )}
        </div>
      )}

      {/* Admin bar */}
      {isAdmin && (
        <div className="sticky top-0 z-50 bg-gray-900 border-b border-yellow-500 text-white text-xs flex items-center justify-between px-4 py-2">
          <span className="text-yellow-400 font-semibold">
            ⚡ Admin preview — {tenant.name}
            <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-semibold ${isLive ? "bg-green-500 text-white" : "bg-blue-500 text-white"}`}>
              {isLive ? "LIVE" : "DEMO"}
            </span>
          </span>
          <div className="flex items-center gap-4">
            <Link href={`/master/sites/${tenant.id}/edit`} className="text-yellow-300 hover:text-yellow-100 font-medium">
              Edit site ↗
            </Link>
            <Link href="/master" className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold px-3 py-1 rounded">
              ← Back to admin
            </Link>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="sticky top-0 z-30 shadow-md" style={{ backgroundColor: b.primaryColor }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href={`/sites/${slug}`} className="flex items-center gap-2">
            {b.logoImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b.logoImage} alt={b.company} className="h-8 w-auto" />
            ) : (
              <span className="text-white font-black tracking-wide text-lg">{b.logoText}</span>
            )}
          </Link>
          <Link href={`/sites/${slug}/products`} className="text-white/80 text-sm hover:text-white">
            ← All products
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-400 mb-6">
          <Link href={`/sites/${slug}`} className="hover:text-gray-600">Home</Link>
          <span>/</span>
          <Link href={`/sites/${slug}/products`} className="hover:text-gray-600">Products</Link>
          {category && (
            <>
              <span>/</span>
              <Link href={`/sites/${slug}/products?category=${category.slug}`} className="hover:text-gray-600">
                {category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-gray-600 font-medium">{product.name}</span>
        </nav>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Image */}
          <div className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full aspect-[4/3] object-cover"
              />
            ) : (
              <div
                className="w-full aspect-[4/3] flex items-center justify-center text-8xl"
                style={{
                  background: `linear-gradient(135deg, ${product.gradientFrom} 0%, ${product.gradientTo} 100%)`,
                }}
              >
                {product.icon}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Category tag */}
            {category && (
              <Link
                href={`/sites/${slug}/products?category=${category.slug}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                {category.icon} {category.name}
              </Link>
            )}

            <div>
              <h1 className="text-3xl font-black text-gray-900 leading-tight">{product.name}</h1>
              <p className="text-gray-500 mt-2 leading-relaxed">
                {product.description || product.shortDesc}
              </p>
            </div>

            {/* Specs grid */}
            {(product.sizes.length > 0 || product.materials.length > 0 || product.leadTime) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {product.sizes.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Available sizes</div>
                    <div className="flex flex-wrap gap-1.5">
                      {product.sizes.map((s) => (
                        <span key={s} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {product.materials.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Materials</div>
                    <div className="flex flex-wrap gap-1.5">
                      {product.materials.map((m) => (
                        <span key={m} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{m}</span>
                      ))}
                    </div>
                  </div>
                )}
                {product.leadTime && (
                  <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Lead time</div>
                    <div className="text-sm font-semibold text-gray-800">{product.leadTime}</div>
                  </div>
                )}
              </div>
            )}

            {/* Pricing — demo only */}
            {b.showPricing && !isLive && product.startingPrice > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Starting price</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-gray-900">${product.startingPrice}</span>
                  <span className="text-sm text-gray-500">/ {product.unit}</span>
                </div>
              </div>
            )}

            {/* CTA */}
            {isLive ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Ready to order?</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {b.contactName
                      ? `Get in touch with ${b.contactName} to place your order or ask about custom sizing.`
                      : "Contact us to place your order or ask about custom sizing and pricing."}
                  </p>
                </div>
                <a
                  href={mailHref}
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: b.primaryColor }}
                >
                  ✉ {b.orderCtaText} — {product.name}
                </a>
                {b.contactPhone && (
                  <a
                    href={`tel:${b.contactPhone}`}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm border-2 text-gray-700 hover:bg-gray-50"
                    style={{ borderColor: b.primaryColor }}
                  >
                    📞 {b.contactPhone}
                  </a>
                )}
              </div>
            ) : (
              <a
                href={mailHref}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white hover:opacity-90"
                style={{ backgroundColor: b.primaryColor }}
              >
                ✉ Get a quote →
              </a>
            )}
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-bold text-gray-900 mb-6">More in {category?.name ?? "this category"}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  href={`/sites/${slug}/products/${p.slug}`}
                  className="group bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                >
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt={p.name} className="h-36 w-full object-cover" />
                  ) : (
                    <div
                      className="h-36 flex items-center justify-center text-5xl"
                      style={{ background: `linear-gradient(135deg, ${p.gradientFrom} 0%, ${p.gradientTo} 100%)` }}
                    >
                      {p.icon}
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 text-sm group-hover:underline">{p.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.shortDesc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-16 py-8" style={{ backgroundColor: b.primaryDark, color: "#ffffff" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/70">
          <span>{b.footerTagline}</span>
          <span>{b.supportEmail}</span>
        </div>
      </footer>
    </div>
  )
}
