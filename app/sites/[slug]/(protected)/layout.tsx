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

  // No tenant = let the page handle notFound
  if (!tenant) return <>{children}</>

  // No domain restriction = public
  const domains = tenant.allowed_domains ?? []
  if (domains.length === 0) return <>{children}</>

  // Master admins can always preview any site
  if (await isMasterAuthed()) return <>{children}</>

  // Check tenant session cookie
  const store = await cookies()
  const raw = store.get(cookieName(slug))?.value
  const email = getTenantSession(slug, raw)

  if (!email) redirect(`/sites/${slug}/login`)

  return <>{children}</>
}
