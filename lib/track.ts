// Client-side analytics helper.
// Pushes structured events to window.dataLayer (Google Tag Manager).
// GTM picks these up and forwards to GA4, Mixpanel, etc. — zero config change needed.

type EventPayload = Record<string, string | number | boolean | null | undefined>

export function trackEvent(event: string, payload?: EventPayload) {
  if (typeof window === "undefined") return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dl = ((window as any).dataLayer = (window as any).dataLayer ?? [])
  dl.push({ event, ...payload })
  // Also persist to our own store for in-app analytics (fire-and-forget).
  sendToStore(event, payload)
}

// Mirror the event into our DB via a lightweight beacon. Only fires when a
// tenant_slug is present (i.e. real storefront events, not generic ones).
function sendToStore(event: string, payload?: EventPayload) {
  try {
    const tenant_slug = payload?.tenant_slug
    if (typeof tenant_slug !== "string" || !tenant_slug) return
    const body = JSON.stringify({ event, tenant_slug, props: payload ?? {} })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav = navigator as any
    if (nav?.sendBeacon) {
      nav.sendBeacon("/api/track", new Blob([body], { type: "application/json" }))
    } else {
      fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true })
    }
  } catch {
    /* analytics must never break the page */
  }
}

export function trackPageView(path: string, tenantSlug: string) {
  trackEvent("page_view", { path, tenant_slug: tenantSlug })
}

// ── Named helpers ─────────────────────────────────────────────

export function trackPhoneClick(phone: string, tenantSlug: string) {
  trackEvent("phone_click", { phone, tenant_slug: tenantSlug })
}

export function trackEmailClick(email: string, tenantSlug: string, context?: string) {
  trackEvent("email_click", { email, tenant_slug: tenantSlug, context: context ?? "contact_bar" })
}

export function trackCtaClick(label: string, destination: string, tenantSlug: string, context?: string) {
  trackEvent("cta_click", { label, destination, tenant_slug: tenantSlug, context: context ?? "hero" })
}

export function trackProductView(productSlug: string, productName: string, category: string, tenantSlug: string) {
  trackEvent("product_view", { product_slug: productSlug, product_name: productName, category, tenant_slug: tenantSlug })
}

export function trackQuoteRequest(productSlug: string, productName: string, tenantSlug: string) {
  trackEvent("quote_request", { product_slug: productSlug, product_name: productName, tenant_slug: tenantSlug })
}

export function trackCategoryClick(categorySlug: string, categoryName: string, tenantSlug: string) {
  trackEvent("category_click", { category_slug: categorySlug, category_name: categoryName, tenant_slug: tenantSlug })
}

export function trackSearch(query: string, resultCount: number, tenantSlug: string) {
  trackEvent("search", { query, result_count: resultCount, tenant_slug: tenantSlug })
}
