"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  bankProducts,
  categoriesForTenant,
  type BankCategory,
  type ProductOverrides,
} from "@/lib/product-bank"
import type { Tenant } from "@/lib/tenant"
import ImageUploader from "../../../_shared/ImageUploader"

export default function EditSiteForm({
  tenant,
  categories,
}: {
  tenant: Tenant
  categories: BankCategory[]
}) {
  const router = useRouter()
  const [name, setName] = useState(tenant.name)
  const [adminEmail, setAdminEmail] = useState(tenant.admin_email ?? "")
  const [primaryColor, setPrimaryColor] = useState(
    (tenant.brand?.primaryColor as string) ?? "#1e3a5f"
  )
  const [accentColor, setAccentColor] = useState(
    (tenant.brand?.accentColor as string) ?? "#f59e0b"
  )
  const [showPricing, setShowPricing] = useState(
    (tenant.brand?.showPricing as boolean) ?? true
  )
  const [logoImage, setLogoImage] = useState((tenant.brand?.logoImage as string) ?? "")
  const [heroHeading, setHeroHeading] = useState(
    (tenant.brand?.heroHeading as string) ?? ""
  )
  const [heroSubheading, setHeroSubheading] = useState(
    (tenant.brand?.heroSubheading as string) ?? ""
  )
  const [heroBgImage, setHeroBgImage] = useState(
    (tenant.brand?.heroBgImage as string) ?? ""
  )
  const [enabled, setEnabled] = useState<Set<string>>(new Set(tenant.enabled_categories))
  const [productOverrides, setProductOverrides] = useState<ProductOverrides>(
    (tenant.product_overrides as ProductOverrides) ?? {}
  )
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function patchProductOverride(
    productSlug: string,
    patch: Partial<ProductOverrides[string]>
  ) {
    setProductOverrides((prev) => {
      const existing = prev[productSlug] ?? {}
      const next = { ...existing, ...patch }
      // drop undefined keys so we don't pollute the DB
      const cleaned: typeof next = {}
      for (const [k, v] of Object.entries(next)) {
        if (v !== undefined) (cleaned as any)[k] = v
      }
      return { ...prev, [productSlug]: cleaned }
    })
  }

  function toggleCategory(catSlug: string) {
    const next = new Set(enabled)
    if (next.has(catSlug)) next.delete(catSlug)
    else next.add(catSlug)
    setEnabled(next)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    setSaved(false)
    try {
      const brand: Record<string, unknown> = {
        ...tenant.brand,
        company: name,
        logoText: name.toUpperCase(),
        primaryColor,
        accentColor,
        showPricing,
      }
      if (logoImage.trim()) brand.logoImage = logoImage.trim()
      else delete (brand as any).logoImage
      if (heroHeading.trim()) brand.heroHeading = heroHeading.trim()
      else delete (brand as any).heroHeading
      if (heroSubheading.trim()) brand.heroSubheading = heroSubheading.trim()
      else delete (brand as any).heroSubheading
      if (heroBgImage.trim()) brand.heroBgImage = heroBgImage.trim()
      else delete (brand as any).heroBgImage

      const res = await fetch(`/api/master/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          brand,
          enabled_categories: Array.from(enabled),
          product_overrides: productOverrides,
          admin_email: adminEmail || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? "Save failed")
        return
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  async function archive() {
    if (!confirm(`Archive "${name}"? It will stop being public but can be restored.`)) return
    setBusy(true)
    try {
      const res = await fetch(`/api/master/tenants/${tenant.id}`, { method: "DELETE" })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setError(j.error ?? "Archive failed")
        return
      }
      router.push("/master")
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={save} className="space-y-8">
      <Section title="Identity">
        <Field label="Display name">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Slug" hint="Slug is fixed after creation to keep URLs stable.">
          <input
            value={tenant.slug}
            disabled
            className={`${inputCls} font-mono bg-gray-100 text-gray-500`}
          />
        </Field>
        <Field label="Admin email (optional)">
          <input
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            className={inputCls}
          />
        </Field>
      </Section>

      <Section title="Brand">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Primary color">
            <ColorInput value={primaryColor} onChange={setPrimaryColor} />
          </Field>
          <Field label="Accent color">
            <ColorInput value={accentColor} onChange={setAccentColor} />
          </Field>
        </div>
        <Field label="Pricing">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <button
              type="button"
              role="switch"
              aria-checked={showPricing}
              onClick={() => setShowPricing((v) => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                showPricing ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  showPricing ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-sm text-gray-700">
              {showPricing ? "Show pricing" : "Hide pricing"}
            </span>
          </label>
        </Field>

        <Field label="Logo">
          <ImageUploader
            value={logoImage}
            onChange={setLogoImage}
            slug={tenant.slug}
            kind="logo"
            previewAspect="3/1"
            recommendation="Recommended: ~600 × 200 px PNG with transparent background. Up to 10 MB."
          />
        </Field>
        <Field label="Hero heading">
          <input
            value={heroHeading}
            onChange={(e) => setHeroHeading(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Hero subheading">
          <textarea
            value={heroSubheading}
            onChange={(e) => setHeroSubheading(e.target.value)}
            rows={2}
            className={inputCls}
          />
        </Field>
        <Field
          label="Hero background image"
          hint="The big photo behind the hero text. Wider-than-tall works best."
        >
          <ImageUploader
            value={heroBgImage}
            onChange={setHeroBgImage}
            slug={tenant.slug}
            kind="hero"
            previewAspect="21/9"
            recommendation="Recommended: 2400 × 1100 px (≈ 21:9). Min 1600 × 720. PNG, JPG, or WEBP. Up to 10 MB."
          />
        </Field>
      </Section>

      <Section
        title="Product categories"
        hint="Pick which categories to show. Leave all unchecked to show everything."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {categories.map((cat) => {
            const on = enabled.has(cat.slug)
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => toggleCategory(cat.slug)}
                className={`flex items-start gap-3 text-left p-3 rounded-lg border-2 transition-colors ${
                  on
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-400 bg-white"
                }`}
              >
                <span className="text-2xl shrink-0">{cat.icon}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-bold text-gray-900">{cat.name}</span>
                  <span className="block text-xs text-gray-500 truncate">{cat.description}</span>
                </span>
                <span
                  className={`mt-1 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                    on ? "bg-blue-600 border-blue-600" : "border-gray-300"
                  }`}
                >
                  {on && (
                    <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3 text-white">
                      <path
                        d="M5 12l5 5L20 7"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </Section>

      {/* Products */}
      <Section
        title="Product overrides"
        hint="Disable individual products, set a custom price, or swap in a product image. Disabled products are hidden from this site."
      >
        <ProductOverridesPanel
          enabledCategories={Array.from(enabled)}
          overrides={productOverrides}
          onChange={patchProductOverride}
          tenantSlug={tenant.slug}
        />
      </Section>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={busy}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-lg"
        >
          {busy ? "Saving…" : "Save"}
        </button>
        {saved && <span className="text-sm text-green-600 font-medium">✓ Saved</span>}
        <div className="ml-auto">
          <button
            type="button"
            onClick={archive}
            disabled={busy}
            className="text-sm text-red-600 hover:text-red-700 font-medium px-3 py-2.5"
          >
            Archive
          </button>
        </div>
      </div>
    </form>
  )
}

const inputCls =
  "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-gray-900">{title}</h2>
        {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-gray-700 mb-1">{label}</span>
      {hint && <span className="block text-xs text-gray-500 mb-1.5">{hint}</span>}
      {children}
    </label>
  )
}

function ColorInput({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls} font-mono`}
      />
    </div>
  )
}

// ── Product overrides panel ────────────────────────────────────

function ProductOverridesPanel({
  enabledCategories,
  overrides,
  onChange,
  tenantSlug,
}: {
  enabledCategories: string[]
  overrides: ProductOverrides
  onChange: (slug: string, patch: Partial<ProductOverrides[string]>) => void
  tenantSlug: string
}) {
  const cats = categoriesForTenant(enabledCategories)
  // If no categories selected, show all
  const catsToShow = cats.length > 0 ? cats : []

  // Group products by category
  const productsByCat = catsToShow.map((cat) => ({
    cat,
    products: bankProducts.filter((p) => p.category === cat.slug),
  }))

  if (productsByCat.length === 0) {
    return (
      <p className="text-xs text-gray-400 italic">
        Enable at least one product category above to configure overrides.
      </p>
    )
  }

  return (
    <div className="space-y-5">
      {productsByCat.map(({ cat, products }) => (
        <div key={cat.slug}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">{cat.icon}</span>
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              {cat.name}
            </span>
          </div>
          <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
            {products.map((p) => {
              const ov = overrides[p.slug] ?? {}
              const disabled = ov.disabled ?? false
              return (
                <div
                  key={p.slug}
                  className={`flex flex-col sm:flex-row sm:items-start gap-3 p-3 transition-colors ${
                    disabled ? "bg-gray-50 opacity-60" : "bg-white"
                  }`}
                >
                  {/* Enable toggle */}
                  <button
                    type="button"
                    onClick={() => onChange(p.slug, { disabled: !disabled })}
                    title={disabled ? "Enable product" : "Disable product"}
                    className={`mt-0.5 shrink-0 w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-colors ${
                      disabled
                        ? "border-gray-300 bg-white text-gray-400 hover:border-red-300"
                        : "border-blue-500 bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                  >
                    {disabled ? (
                      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                        <path
                          d="M18 6L6 18M6 6l12 12"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                        <path
                          d="M5 12l5 5L20 7"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>

                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">{p.name}</span>
                      <span className="text-xs text-gray-400 font-mono">{p.slug}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{p.shortDesc}</p>

                    {!disabled && (
                      <div className="mt-2 flex flex-wrap gap-3 items-end">
                        {/* Price override */}
                        <label className="block">
                          <span className="block text-xs font-semibold text-gray-600 mb-1">
                            Starting price
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-gray-500">$</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder={String(p.startingPrice)}
                              value={ov.price ?? ""}
                              onChange={(e) => {
                                const v = e.target.value
                                onChange(p.slug, {
                                  price: v === "" ? undefined : parseFloat(v),
                                })
                              }}
                              className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {ov.price !== undefined && (
                              <button
                                type="button"
                                onClick={() => onChange(p.slug, { price: undefined })}
                                className="text-xs text-gray-400 hover:text-gray-600"
                                title="Reset to default"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                          {ov.price !== undefined && (
                            <span className="text-xs text-gray-400 mt-0.5 block">
                              Default: ${p.startingPrice}
                            </span>
                          )}
                        </label>

                        {/* Featured toggle */}
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={ov.featured ?? p.featured}
                            onChange={(e) =>
                              onChange(p.slug, { featured: e.target.checked })
                            }
                            className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Featured</span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Product image upload */}
                  {!disabled && (
                    <div className="w-full sm:w-36 shrink-0">
                      <span className="block text-xs font-semibold text-gray-600 mb-1">
                        Product image
                      </span>
                      <ImageUploader
                        value={ov.imageUrl ?? ""}
                        onChange={(url) => onChange(p.slug, { imageUrl: url || undefined })}
                        slug={tenantSlug}
                        kind="logo"
                        previewAspect="4/3"
                        recommendation="Product image. PNG/JPG/WEBP. Up to 10 MB."
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
