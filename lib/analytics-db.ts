import { adminClient } from "@/lib/supabase"

type EventRow = {
  tenant_slug: string
  event: string
  props: Record<string, unknown>
  created_at: string
}

export type SiteStat = {
  slug: string
  views: number
  productViews: number
  clicks: number // cta + email + phone
  searches: number
  quotes: number
}
export type TopProduct = { slug: string; name: string; views: number }
export type AnalyticsSummary = {
  days: number
  totalViews: number
  totalClicks: number
  totalEvents: number
  perSite: SiteStat[]
  topProducts: TopProduct[]
}

const CLICK_EVENTS = new Set(["cta_click", "email_click", "phone_click"])

/** Aggregates site_events over the last `days` days into per-site + top-product stats. */
export async function getAnalytics(days = 30): Promise<AnalyticsSummary> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString()
  const { data, error } = await adminClient()
    .from("site_events")
    .select("tenant_slug,event,props,created_at")
    .gte("created_at", since)
    .limit(100_000)
  if (error) throw new Error(error.message)
  const rows = (data ?? []) as EventRow[]

  const site = new Map<string, SiteStat>()
  const products = new Map<string, TopProduct>()
  let totalViews = 0
  let totalClicks = 0

  for (const r of rows) {
    const s =
      site.get(r.tenant_slug) ??
      { slug: r.tenant_slug, views: 0, productViews: 0, clicks: 0, searches: 0, quotes: 0 }
    if (r.event === "page_view") {
      s.views++
      totalViews++
    } else if (r.event === "product_view") {
      s.productViews++
      const ps = String(r.props?.product_slug ?? "")
      if (ps) {
        const p = products.get(ps) ?? { slug: ps, name: String(r.props?.product_name ?? ps), views: 0 }
        p.views++
        products.set(ps, p)
      }
    } else if (CLICK_EVENTS.has(r.event)) {
      s.clicks++
      totalClicks++
    } else if (r.event === "search") {
      s.searches++
    } else if (r.event === "quote_request") {
      s.quotes++
    }
    site.set(r.tenant_slug, s)
  }

  return {
    days,
    totalViews,
    totalClicks,
    totalEvents: rows.length,
    perSite: Array.from(site.values()).sort((a, b) => b.views - a.views),
    topProducts: Array.from(products.values()).sort((a, b) => b.views - a.views).slice(0, 15),
  }
}

export type DayPoint = { date: string; views: number }
export type SiteDetail = {
  slug: string
  days: number
  views: number
  productViews: number
  clicks: number
  searches: number
  quotes: number
  clickBreakdown: { cta: number; email: number; phone: number }
  topProducts: TopProduct[]
  daily: DayPoint[]
  totalEvents: number
}

/** Detailed analytics for a single site: totals, click breakdown, top products, daily views. */
export async function getSiteAnalytics(slug: string, days = 30): Promise<SiteDetail> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString()
  const { data, error } = await adminClient()
    .from("site_events")
    .select("event,props,created_at")
    .eq("tenant_slug", slug)
    .gte("created_at", since)
    .limit(100_000)
  if (error) throw new Error(error.message)
  const rows = (data ?? []) as Omit<EventRow, "tenant_slug">[]

  const products = new Map<string, TopProduct>()
  const byDay = new Map<string, number>()
  let views = 0, productViews = 0, searches = 0, quotes = 0
  let cta = 0, email = 0, phone = 0

  for (const r of rows) {
    switch (r.event) {
      case "page_view": {
        views++
        const day = String(r.created_at).slice(0, 10)
        byDay.set(day, (byDay.get(day) ?? 0) + 1)
        break
      }
      case "product_view": {
        productViews++
        const ps = String(r.props?.product_slug ?? "")
        if (ps) {
          const p = products.get(ps) ?? { slug: ps, name: String(r.props?.product_name ?? ps), views: 0 }
          p.views++
          products.set(ps, p)
        }
        break
      }
      case "cta_click": cta++; break
      case "email_click": email++; break
      case "phone_click": phone++; break
      case "search": searches++; break
      case "quote_request": quotes++; break
    }
  }

  // Fill every day in the range, oldest → newest, so the chart has no gaps.
  const daily: DayPoint[] = []
  const now = Date.now()
  for (let i = days - 1; i >= 0; i--) {
    const key = new Date(now - i * 86_400_000).toISOString().slice(0, 10)
    daily.push({ date: key, views: byDay.get(key) ?? 0 })
  }

  return {
    slug,
    days,
    views,
    productViews,
    searches,
    quotes,
    clicks: cta + email + phone,
    clickBreakdown: { cta, email, phone },
    topProducts: Array.from(products.values()).sort((a, b) => b.views - a.views).slice(0, 15),
    daily,
    totalEvents: rows.length,
  }
}
