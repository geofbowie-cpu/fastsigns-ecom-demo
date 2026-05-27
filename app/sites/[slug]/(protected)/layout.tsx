import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { getTenantBySlug } from "@/lib/tenant"
import { getTenantSession, cookieName } from "@/lib/tenant-auth"
import { isMasterAuthed } from "@/lib/master-auth"

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

  const wrap = (
    <>
      {children}
      {isDemo && <DemoBanner />}
    </>
  )

  // Gating disabled (default) — anyone can browse
  if (!tenant.require_login) return wrap

  // Master admins can always preview any site
  if (await isMasterAuthed()) return wrap

  // Check tenant session cookie
  const domains = tenant.allowed_domains ?? []
  const store = await cookies()
  const raw = store.get(cookieName(slug))?.value
  const email = getTenantSession(slug, raw)

  if (!email) redirect(`/${slug}/login`)

  // If the user's email domain isn't in the allowlist, reject
  if (domains.length > 0) {
    const userDomain = email.split("@")[1]?.toLowerCase()
    if (!domains.includes(userDomain)) redirect(`/${slug}/login`)
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
