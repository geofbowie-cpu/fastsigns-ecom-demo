// Client-side analytics helper.
// Pushes structured events to window.dataLayer (Google Tag Manager).
// GTM picks these up and forwards to GA4, Mixpanel, etc. — zero config change needed.

type EventPayload = Record<string, string | number | boolean | null | undefined>

export function trackEvent(event: string, payload?: EventPayload) {
  if (typeof window === "undefined") return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dl = ((window as any).dataLayer = (window as any).dataLayer ?? [])
  dl.push({ event, ...payload })
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
