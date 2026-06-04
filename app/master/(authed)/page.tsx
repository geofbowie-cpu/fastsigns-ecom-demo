export const dynamic = "force-dynamic"

import Link from "next/link"
import { listTenants, type Tenant } from "@/lib/tenant"
import { adminClient } from "@/lib/supabase"
import SiteCardActions from "./_shared/SiteCardActions"

async function getVisitorCounts(): Promise<Record<string, number>> {
  const { data } = await adminClient()
    .from("tenant_visitors")
    .select("tenant_id")
  if (!data) return {}
  const counts: Record<string, number> = {}
  for (const row of data) {
    counts[row.tenant_id] = (counts[row.tenant_id] ?? 0) + 1
  }
  return counts
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  if (status === "live") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        Live
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
      Demo
    </span>
  )
}

function SiteCard({ t, visitorCount }: { t: Tenant; visitorCount: number }) {
  const primary = (t.brand?.primaryColor as string) ?? "#1e3a5f"
  const categoryLabel =
    t.enabled_categories.length === 0
      ? "All categories"
      : `${t.enabled_categories.length} categor${t.enabled_categories.length === 1 ? "y" : "ies"}`

  return (
    <div className="group bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md hover:-translate-y-px transition-all overflow-hidden flex flex-col">
      {/* Clickable area → edit */}
      <Link href={`/master/sites/${t.id}/edit`} className="flex-1">
        {/* Brand header */}
        <div
          className="h-24 relative flex items-center justify-center"
          style={{ backgroundColor: primary }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/30" />
          <div className="absolute top-2.5 right-2.5">
            <StatusPill status={t.status} />
          </div>
          <div className="relative z-10">
            {t.brand?.logoImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={t.brand.logoImage as string} alt={t.name} className="h-10 w-auto" />
            ) : (
              <span className="text-white font-black text-lg tracking-wide drop-shadow-sm">
                {(t.brand?.logoText as string) ?? t.name}
              </span>
            )}
          </div>
        </div>

        {/* Card body */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-gray-900 truncate leading-tight">{t.name}</h3>
            {t.require_login && (
              <svg className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            )}
          </div>
          <div className="mt-1 text-xs text-gray-400 font-mono">/sites/{t.slug}</div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">
              {categoryLabel}
            </span>
            {visitorCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {visitorCount}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Card footer — actions (outside the Link so clicks don't navigate) */}
      <div className="border-t border-gray-100 px-4 py-2 flex items-center justify-between">
        <Link
          href={`/sites/${t.slug}`}
          target="_blank"
          className="text-[11px] text-gray-400 hover:text-blue-600 font-medium flex items-center gap-1"
        >
          Preview
          <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </Link>
        <SiteCardActions id={t.id} slug={t.slug} name={t.name} />
      </div>
    </div>
  )
}

export default async function MasterDashboard() {
  let tenants: Tenant[] = []
  let fetchError: string | null = null
  let visitorCounts: Record<string, number> = {}

  try {
    ;[tenants, visitorCounts] = await Promise.all([listTenants(), getVisitorCounts()])
  } catch (e: unknown) {
    fetchError = e instanceof Error ? e.message : String(e)
  }

  const active = tenants.filter((t) => !t.archived)
  const live = tenants.filter((t) => !t.archived && t.status === "live")
  const demo = tenants.filter((t) => !t.archived && t.status !== "live")
  const archived = tenants.filter((t) => t.archived)
  const totalVisitors = Object.values(visitorCounts).reduce((a, b) => a + b, 0)

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Sites</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {live.length} live · {demo.length} demo
            {archived.length > 0 ? ` · ${archived.length} archived` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/master/import"
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-400 bg-white px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m-4-4l4-4 4 4" />
            </svg>
            Import
          </Link>
          <Link
            href="/master/sites/new"
            className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-1.5 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New site
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total sites" value={tenants.length} />
        <StatCard label="Live sites" value={live.length} />
        <StatCard label="Demo sites" value={demo.length} />
        <StatCard label="Total visitors" value={totalVisitors} />
      </div>

      {fetchError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <div className="font-semibold mb-1">Couldn&apos;t load tenants</div>
          <div className="font-mono text-xs">{fetchError}</div>
        </div>
      )}

      {!fetchError && (
        <div className="space-y-10">
          {/* Active sites — unified grid */}
          {active.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Active
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {active.map((t) => (
                  <SiteCard key={t.id} t={t} visitorCount={visitorCounts[t.id] ?? 0} />
                ))}
              </div>
            </div>
          )}

          {active.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <svg className="w-10 h-10 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <p className="text-sm">No sites yet. Create your first one above.</p>
            </div>
          )}

          {/* Archived — collapsible */}
          {archived.length > 0 && (
            <details className="group">
              <summary className="flex items-center gap-2 cursor-pointer list-none text-sm font-medium text-gray-400 hover:text-gray-600 select-none mb-4">
                <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                Archived ({archived.length})
              </summary>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
                {archived.map((t) => (
                  <SiteCard key={t.id} t={t} visitorCount={visitorCounts[t.id] ?? 0} />
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
