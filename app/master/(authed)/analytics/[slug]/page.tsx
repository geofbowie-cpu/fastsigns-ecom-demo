export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import Link from "next/link"
import { getSiteAnalytics } from "@/lib/analytics-db"
import { getTenantBySlug } from "@/lib/tenant"

export const metadata: Metadata = {
  title: "Site analytics · FASTSIGNS Demo Builder",
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

function fmtDay(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export default async function SiteAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ days?: string }>
}) {
  const { slug } = await params
  const { days: daysParam } = await searchParams
  const days = [7, 30, 90].includes(Number(daysParam)) ? Number(daysParam) : 30

  const [detail, tenant] = await Promise.all([getSiteAnalytics(slug, days), getTenantBySlug(slug)])
  const name = tenant?.name ?? slug
  const maxDay = Math.max(1, ...detail.daily.map((d) => d.views))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href={`/master/analytics?days=${days}`} className="text-xs text-gray-500 hover:text-gray-800">
            ← All analytics
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Traffic for this site (last {days} days).{" "}
            <Link href={`/sites/${slug}`} className="text-blue-600 hover:underline">Open storefront ↗</Link>
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          {RANGES.map((r) => (
            <Link
              key={r.days}
              href={`/master/analytics/${slug}?days=${r.days}`}
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
        <StatCard label="Page views" value={detail.views} />
        <StatCard label="Product views" value={detail.productViews} />
        <StatCard label="Clicks" value={detail.clicks} />
        <StatCard label="Searches" value={detail.searches} />
      </div>

      {detail.totalEvents === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          No traffic recorded for this site in this range.
        </div>
      ) : (
        <>
          {/* Daily views trend */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-800">Page views per day</h2>
              <span className="text-xs text-gray-400">peak {maxDay.toLocaleString()}/day</span>
            </div>
            <div className="flex items-end gap-[2px] h-40">
              {detail.daily.map((d) => (
                <div key={d.date} className="flex-1 group relative flex items-end h-full">
                  <div
                    className="w-full bg-blue-500/80 hover:bg-blue-600 rounded-t-sm transition-colors"
                    style={{ height: `${Math.max(d.views > 0 ? 4 : 0, (d.views / maxDay) * 100)}%` }}
                    title={`${fmtDay(d.date)}: ${d.views} views`}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-gray-400">
              <span>{fmtDay(detail.daily[0].date)}</span>
              {days > 14 && <span>{fmtDay(detail.daily[Math.floor(detail.daily.length / 2)].date)}</span>}
              <span>{fmtDay(detail.daily[detail.daily.length - 1].date)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top products for THIS site */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-800">Top products</h2>
              </div>
              {detail.topProducts.length === 0 ? (
                <p className="px-4 py-6 text-xs text-gray-400">No product views yet.</p>
              ) : (
                <ol className="divide-y divide-gray-100">
                  {detail.topProducts.map((p, i) => (
                    <li key={p.slug} className="px-4 py-2.5 flex items-center gap-3 text-sm">
                      <span className="text-xs font-mono text-gray-400 w-4">{i + 1}</span>
                      <Link href={`/sites/${slug}/products/${p.slug}`} className="flex-1 text-gray-800 truncate hover:underline">
                        {p.name}
                      </Link>
                      <span className="font-semibold text-gray-900">{p.views}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* Click breakdown */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-800">Clicks</h2>
              </div>
              <ul className="divide-y divide-gray-100 text-sm">
                <li className="px-4 py-2.5 flex justify-between"><span className="text-gray-600">CTA buttons</span><span className="font-semibold text-gray-900">{detail.clickBreakdown.cta}</span></li>
                <li className="px-4 py-2.5 flex justify-between"><span className="text-gray-600">Email</span><span className="font-semibold text-gray-900">{detail.clickBreakdown.email}</span></li>
                <li className="px-4 py-2.5 flex justify-between"><span className="text-gray-600">Phone</span><span className="font-semibold text-gray-900">{detail.clickBreakdown.phone}</span></li>
                <li className="px-4 py-2.5 flex justify-between"><span className="text-gray-600">Quote requests</span><span className="font-semibold text-gray-900">{detail.quotes}</span></li>
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
