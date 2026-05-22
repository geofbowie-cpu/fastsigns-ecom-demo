export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import Link from "next/link"
import { Suspense } from "react"
import { getTenantBySlug } from "@/lib/tenant"
import { resolveBrand } from "@/lib/resolve-brand"
import { getProducts, getCategories } from "@/lib/products-db"
import { isMasterAuthed } from "@/lib/master-auth"
import SearchInput from "./SearchInput"

export default async function TenantProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ category?: string; q?: string }>
}) {
  const { slug } = await params
  const { category, q } = await searchParams
  const [tenant, isAdmin] = await Promise.all([
    getTenantBySlug(slug),
    isMasterAuthed(),
  ])
  if (!tenant) notFound()

  const b = resolveBrand(tenant.brand)
  const [cats, all] = await Promise.all([
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

  // Filter by category and/or search query
  const query = q?.trim().toLowerCase() ?? ""
  const filtered = all.filter((p) => {
    const matchCat = category ? p.category === category : true
    const matchQ = query
      ? p.name.toLowerCase().includes(query) ||
        p.shortDesc.toLowerCase().includes(query) ||
        (p.description?.toLowerCase().includes(query) ?? false)
      : true
    return matchCat && matchQ
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {tenant.status === "live" && b.contactEmail && (
        <div className="bg-gray-900 text-white text-xs px-4 py-2 flex items-center justify-end gap-4">
          {b.contactName && <span className="text-gray-400">Your rep: <span className="text-white font-medium">{b.contactName}</span></span>}
          <a href={`mailto:${b.contactEmail}`} className="text-blue-300 hover:text-blue-200">{b.contactEmail}</a>
          {b.contactPhone && <a href={`tel:${b.contactPhone}`} className="text-gray-300 hover:text-white">{b.contactPhone}</a>}
        </div>
      )}
      {isAdmin && (
        <div className="sticky top-0 z-50 bg-gray-900 border-b border-yellow-500 text-white text-xs flex items-center justify-between px-4 py-2">
          <span className="text-yellow-400 font-semibold">
            ⚡ Admin preview — {tenant.name}
            <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-semibold ${tenant.status === "live" ? "bg-green-500 text-white" : "bg-blue-500 text-white"}`}>
              {tenant.status === "live" ? "LIVE" : "DEMO"}
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
          <Link href={`/sites/${slug}`} className="text-white/80 text-sm hover:text-white">
            ← Home
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header + search */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900">All products</h1>
            <p className="text-sm text-gray-500 mt-1">
              {filtered.length} product{filtered.length !== 1 ? "s" : ""}
              {query && <> matching &ldquo;<span className="font-medium text-gray-700">{q}</span>&rdquo;</>}
              {" · "}{b.company}
            </p>
          </div>
          <div className="w-full sm:w-72">
            <Suspense>
              <SearchInput defaultValue={q} primaryColor={b.primaryColor} />
            </Suspense>
          </div>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href={query ? `/sites/${slug}/products?q=${encodeURIComponent(q!)}` : `/sites/${slug}/products`}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
              !category
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
            }`}
          >
            All
          </Link>
          {cats.map((c) => {
            const href = query
              ? `/sites/${slug}/products?category=${c.slug}&q=${encodeURIComponent(q!)}`
              : `/sites/${slug}/products?category=${c.slug}`
            return (
              <Link
                key={c.slug}
                href={href}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
                  category === c.slug
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                }`}
              >
                {c.name}
              </Link>
            )
          })}
        </div>

        {/* No results */}
        {filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-3">🔍</div>
            <p className="font-semibold text-gray-600">No products found</p>
            <p className="text-sm mt-1">Try a different search or category.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((p) => (
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
                  className="h-36 w-full object-cover group-hover:scale-[1.02] transition-transform"
                />
              ) : (
                <div
                  className="h-36 flex items-center justify-center"
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
                    style={{ color: b.primaryColor }}
                  >
                    {b.orderCtaText} →
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
