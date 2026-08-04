import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { getTenantBySlug } from "@/lib/tenant"
import { getTenantSession, cookieName } from "@/lib/tenant-auth"
import { isMasterAuthed } from "@/lib/master-auth"
import { resolveBrand } from "@/lib/resolve-brand"
import CartProvider from "./_cart/CartProvider"
import CartButton from "./_cart/CartButton"
import PageViewTracker from "./_analytics/PageViewTracker"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) return { title: "Storefront" }
  const b = resolveBrand(tenant.brand)
  return {
    title: `${b.company} — Storefront`,
    description: b.heroSubheading,
  }
}

export default async function ProtectedSiteLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)

  const isDemo = tenant?.status === "demo"

  // No tenant = let the page handle notFound
  if (!tenant) return <>{children}</>

  const b = resolveBrand(tenant.brand)
  const isAdmin = await isMasterAuthed()

  // Cart/ordering is a per-site opt-in (off by default, incl. Reddy Ice).
  const content = tenant.enable_cart ? (
    <CartProvider slug={slug}>
      {children}
      <CartButton slug={slug} buttonColor={b.buttonColor} buttonTextColor={b.buttonTextColor} />
    </CartProvider>
  ) : (
    children
  )

  const wrap = (
    <>
      {content}
      <PageViewTracker slug={slug} disabled={isAdmin} />
      {isDemo && <DemoBanner />}
    </>
  )

  // Gating disabled (default) — anyone can browse
  if (!tenant.require_login) return wrap

  // Master admins can always preview any site
  if (isAdmin) return wrap

  // Check tenant session cookie
  const domains = tenant.allowed_domains ?? []
  const store = await cookies()
  const raw = store.get(cookieName(slug))?.value
  const email = getTenantSession(slug, raw)

  if (!email) redirect(`/sites/${slug}/login`)

  // If the user's email domain isn't in the allowlist, reject
  if (domains.length > 0) {
    const userDomain = email.split("@")[1]?.toLowerCase()
    if (!domains.includes(userDomain)) redirect(`/sites/${slug}/login`)
  }

  return wrap
}

function DemoBanner() {
  return (
    <div className="fixed bottom-0 inset-x-0 z-[100] bg-amber-400 text-amber-950 text-xs font-semibold text-center py-2 px-4 shadow-lg">
      ⚠️ This website is for demonstration purposes only.
    </div>
  )
}
