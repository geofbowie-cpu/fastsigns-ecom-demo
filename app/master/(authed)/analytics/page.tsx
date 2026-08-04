export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import Link from "next/link"
import { getAnalytics } from "@/lib/analytics-db"
import { listTenants } from "@/lib/tenant"

export const metadata: Metadata = {
  title: "Analytics · FASTSIGNS Demo Builder",
}

const RANGES = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
]

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</div>
    </div>
  )
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>
}) {
  const { days: daysParam } = await searchParams
  const days = [7, 30, 90].includes(Number(daysParam)) ? Number(daysParam) : 30

  const [summary, tenants] = await Promise.all([getAnalytics(days), listTenants()])
  const nameBySlug = new Map(tenants.map((t) => [t.slug, t.name]))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Traffic and engagement across all sites (last {days} days). Captured in-app —
            admin previews are excluded.
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          {RANGES.map((r) => (
            <Link
              key={r.days}
              href={`/master/analytics?days=${r.days}`}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${
                days === r.days
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Page views" value={summary.totalViews} />
        <StatCard label="Clicks (call/email/CTA)" value={summary.totalClicks} />
        <StatCard label="Sites with traffic" value={summary.perSite.length} />
        <StatCard label="Total events" value={summary.totalEvents} />
      </div>

      {summary.totalEvents === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          No traffic recorded yet in this range. Data appears as prospects visit the sites.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Per-site table */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-800">By site</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-2.5 font-semibold">Site</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Views</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Product views</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Clicks</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Searches</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {summary.perSite.map((s) => (
                  <tr key={s.slug} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <Link href={`/sites/${s.slug}`} className="text-gray-900 hover:underline font-medium">
                        {nameBySlug.get(s.slug) ?? s.slug}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{s.views.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{s.productViews.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{s.clicks.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{s.searches.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Top products */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-800">Top products</h2>
            </div>
            {summary.topProducts.length === 0 ? (
              <p className="px-4 py-6 text-xs text-gray-400">No product views yet.</p>
            ) : (
              <ol className="divide-y divide-gray-100">
                {summary.topProducts.map((p, i) => (
                  <li key={p.slug} className="px-4 py-2.5 flex items-center gap-3 text-sm">
                    <span className="text-xs font-mono text-gray-400 w-4">{i + 1}</span>
                    <span className="flex-1 text-gray-800 truncate">{p.name}</span>
                    <span className="font-semibold text-gray-900">{p.views}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
