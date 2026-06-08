export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import Link from "next/link"
import { cookies } from "next/headers"
import { getTenantBySlug } from "@/lib/tenant"
import { resolveBrand } from "@/lib/resolve-brand"
import { getTenantSession, cookieName } from "@/lib/tenant-auth"
import CartClient from "./CartClient"

export default async function CartPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant || !tenant.enable_cart) notFound()

  const b = resolveBrand(tenant.brand)

  // Who's submitting — comes from the tenant magic-link session (logged-in only).
  const store = await cookies()
  const raw = store.get(cookieName(slug))?.value
  const customerEmail = getTenantSession(slug, raw)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="sticky top-0 z-30 shadow-md" style={{ backgroundColor: b.headerBgColor }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href={`/sites/${slug}`} className="flex items-center gap-2">
            {b.logoImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b.logoImage} alt={b.company} style={{ height: b.logoHeight }} className="w-auto" />
            ) : (
              <span className="text-white font-black tracking-wide text-lg">{b.logoText}</span>
            )}
          </Link>
          <Link href={`/sites/${slug}/products`} className="text-white/80 text-sm hover:text-white">
            ← Continue shopping
          </Link>
        </div>
      </nav>

      <CartClient
        slug={slug}
        customerEmail={customerEmail}
        companyName={b.company}
        contactName={b.contactName}
        buttonColor={b.buttonColor}
        buttonTextColor={b.buttonTextColor}
      />

      <footer className="mt-16 py-8" style={{ backgroundColor: b.primaryDark, color: "#ffffff" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/70">
          <span>{b.footerTagline}</span>
          <span>{b.supportEmail}</span>
        </div>
      </footer>
    </div>
  )
}
