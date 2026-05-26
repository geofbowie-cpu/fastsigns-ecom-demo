"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { type BankCategory, type ProductOverrides } from "@/lib/product-bank"
import type { DbProduct } from "@/lib/products-db"
import type { Tenant } from "@/lib/tenant"
import ImageUploader from "../../../_shared/ImageUploader"
import MockupEditor from "./MockupEditor"
import CategoryIcon from "@/components/CategoryIcon"

// ── Dynamic Mockups types ──────────────────────────────────────
type DmSmartObject = { uuid: string; name: string }
type DmTemplate = {
  uuid: string
  name: string
  preview_url: string | null
  smart_objects: DmSmartObject[]
}

export default function EditSiteForm({
  tenant,
  categories,
  allProducts,
  availableImportTags,
}: {
  tenant: Tenant
  categories: BankCategory[]
  allProducts: DbProduct[]
  availableImportTags: string[]
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
    (tenant.brand?.showPricing as boolean) ?? false
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
  const [importTags, setImportTags] = useState<Set<string>>(new Set(tenant.import_tags ?? []))
  const [productOverrides, setProductOverrides] = useState<ProductOverrides>(
    (tenant.product_overrides as ProductOverrides) ?? {}
  )
  // Status
  const [status, setStatus] = useState<"demo" | "live">(tenant.status ?? "demo")
  const [contactName, setContactName] = useState((tenant.brand?.contactName as string) ?? "")
  const [contactEmail, setContactEmail] = useState((tenant.brand?.contactEmail as string) ?? "")
  const [contactPhone, setContactPhone] = useState((tenant.brand?.contactPhone as string) ?? "")
  const [orderCtaText, setOrderCtaText] = useState(
    (tenant.brand?.orderCtaText as string) ?? "Contact to order"
  )
  const [quoteCtaText, setQuoteCtaText] = useState(
    (tenant.brand?.quoteCtaText as string) ?? "Get a quote →"
  )
  // Access control
  const [allowedDomains, setAllowedDomains] = useState(
    (tenant.allowed_domains ?? []).join(", ")
  )
  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteSlugInput, setDeleteSlugInput] = useState("")

  const [navTextColor, setNavTextColor] = useState(
    (tenant.brand?.navTextColor as string) ?? "#ffffff"
  )
  const [heroCta1TextColor, setHeroCta1TextColor] = useState(
    (tenant.brand?.heroCta1TextColor as string) ?? "#000000"
  )
  const [buttonColor, setButtonColor] = useState(
    (tenant.brand?.buttonColor as string) ?? primaryColor
  )
  const [buttonTextColor, setButtonTextColor] = useState(
    (tenant.brand?.buttonTextColor as string) ?? "#ffffff"
  )
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>(
    (tenant.brand?.categoryImages as Record<string, string>) ?? {}
  )
  // Local copy of categories so we can add/remove without a page reload
  const [localCategories, setLocalCategories] = useState(categories)

  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Brand-fetch re-pull
  const defaultDomain =
    allowedDomains.split(",")[0]?.trim() ||
    adminEmail.split("@")[1]?.trim() ||
    ""
  const [bfDomain, setBfDomain] = useState(defaultDomain)
  const [bfBusy, setBfBusy] = useState(false)
  const [bfInfo, setBfInfo] = useState<string | null>(null)
  const [bfError, setBfError] = useState<string | null>(null)

  async function refetchBrand() {
    if (!bfDomain.trim()) return
    setBfBusy(true)
    setBfInfo(null)
    setBfError(null)
    try {
      const res = await fetch("/api/master/brandfetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: bfDomain.trim(), slug: tenant.slug }),
      })
      const json = await res.json()
      if (!res.ok) { setBfError(json.error ?? "Fetch failed"); return }
      const b = json.brand
      const filled: string[] = []
      if (b.primaryColor) { setPrimaryColor(b.primaryColor); filled.push("primary color") }
      if (b.accentColor)  { setAccentColor(b.accentColor);   filled.push("accent color") }
      if (b.logoUrl)      { setLogoImage(b.logoUrl);          filled.push("logo") }
      setBfInfo(filled.length ? `Applied: ${filled.join(", ")}` : "Brand found but no usable assets returned")
    } catch (e: any) {
      setBfError(e.message ?? "Fetch failed")
    } finally {
      setBfBusy(false)
    }
  }

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
        navTextColor,
        buttonColor,
        buttonTextColor,
        heroCta1Color: buttonColor,
        heroCta1TextColor: buttonTextColor,
        showPricing,
        contactName: contactName.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        orderCtaText: orderCtaText.trim() || "Contact to order",
        quoteCtaText: quoteCtaText.trim() || "Get a quote →",
        categoryImages: Object.keys(categoryImages).length > 0 ? categoryImages : undefined,
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
          status,
          enabled_categories: Array.from(enabled),
          import_tags: Array.from(importTags),
          product_overrides: productOverrides,
          admin_email: adminEmail || null,
          allowed_domains: allowedDomains
            .split(",")
            .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
            .filter(Boolean),
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
    if (!confirm(`Archive "${name}"? It will be hidden but can be restored from the DB.`)) return
    setBusy(true)
    try {
      const res = await fetch(`/api/master/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: true }),
      })
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

  async function permanentDelete() {
    if (deleteSlugInput !== tenant.slug) return
    setBusy(true)
    try {
      const res = await fetch(`/api/master/tenants/${tenant.id}?permanent=true`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setError(j.error ?? "Delete failed")
        setShowDeleteConfirm(false)
        return
      }
      router.push("/master")
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={save} className="max-w-2xl space-y-4">
      <Section title="Identity">
        <Field label="Display name">
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Slug" hint="Fixed after creation.">
          <input value={tenant.slug} disabled className={`${inputCls} font-mono bg-gray-50 text-gray-400`} />
        </Field>
        <Field label="Admin email">
          <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className={inputCls} />
        </Field>
      </Section>

      <Section title="Brand">
        <Field label="Re-fetch from domain">
          <div className="flex items-center gap-1.5 flex-wrap">
            <input
              value={bfDomain}
              onChange={(e) => setBfDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), refetchBrand())}
              placeholder="nike.com"
              className="w-40 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            />
            <button
              type="button"
              onClick={refetchBrand}
              disabled={bfBusy || !bfDomain.trim()}
              className="text-xs font-semibold px-2.5 py-1 rounded border border-gray-300 hover:border-blue-400 hover:text-blue-600 disabled:opacity-40"
            >
              {bfBusy ? "…" : "Re-fetch"}
            </button>
            {bfInfo && <span className="text-xs text-green-600">{bfInfo}</span>}
            {bfError && <span className="text-xs text-red-500">{bfError}</span>}
          </div>
        </Field>
        <Field label="Colors">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {[
              { label: "Primary", value: primaryColor, onChange: setPrimaryColor },
              { label: "Accent", value: accentColor, onChange: setAccentColor },
              { label: "Nav text", value: navTextColor, onChange: setNavTextColor },
              { label: "Button bg", value: buttonColor, onChange: setButtonColor },
              { label: "Button text", value: buttonTextColor, onChange: setButtonTextColor },
            ].map(({ label, value, onChange }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-400 w-14 shrink-0">{label}</span>
                <ColorInput value={value} onChange={onChange} />
              </div>
            ))}
          </div>
        </Field>
        <Field label="Show pricing">
          <button
            type="button"
            role="switch"
            aria-checked={showPricing}
            onClick={() => setShowPricing((v) => !v)}
            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
              showPricing ? "bg-blue-600" : "bg-gray-300"
            }`}
          >
            <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${showPricing ? "translate-x-4" : "translate-x-0"}`} />
          </button>
        </Field>
        <Field label="Logo" hint="PNG with transparent bg">
          <ImageUploader
            value={logoImage} onChange={setLogoImage}
            slug={tenant.slug} kind="logo"
            previewAspect="3/1" maxPreviewHeight={72}
          />
        </Field>
        <Field label="Hero heading">
          <input value={heroHeading} onChange={(e) => setHeroHeading(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Hero subheading">
          <textarea value={heroSubheading} onChange={(e) => setHeroSubheading(e.target.value)} rows={2} className={inputCls} />
        </Field>
        <Field label="Hero image" hint="Wide photo behind hero text">
          <ImageUploader
            value={heroBgImage} onChange={setHeroBgImage}
            slug={tenant.slug} kind="hero"
            previewAspect="21/9" maxPreviewHeight={110}
          />
        </Field>
      </Section>

      {/* Import tags */}
      {availableImportTags.length > 0 && (
        <Section
          title="Imported product sets"
          hint="Select which imported batches to include on this site. Products in the batch are added to the catalog alongside any category-filtered products above."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {availableImportTags.map((tag) => {
              const on = importTags.has(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    const next = new Set(importTags)
                    if (next.has(tag)) next.delete(tag)
                    else next.add(tag)
                    setImportTags(next)
                  }}
                  className={`flex items-center gap-3 text-left p-3 rounded-lg border-2 transition-colors ${
                    on
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-gray-400 bg-white"
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" className={`w-4 h-4 shrink-0 ${on ? "text-blue-600" : "text-gray-400"}`}><path d="M20 7l-8-4-8 4m16 0v10l-8 4m-8-4V7m16 0l-8 4m-8-4l8 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span className="flex-1 min-w-0 text-sm font-mono font-semibold text-gray-900 truncate">
                    {tag}
                  </span>
                  <span
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                      on ? "bg-blue-600 border-blue-600" : "border-gray-300"
                    }`}
                  >
                    {on && (
                      <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3 text-white">
                        <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            New imports are created on the{" "}
            <a href="/master/import" className="text-blue-500 hover:underline">Import page</a>.
          </p>
        </Section>
      )}

      <Section
        title="Categories"
        hint="Toggle on/off, add card images, or create custom categories."
      >
        <CategoryManager
          categories={categories}
          enabled={enabled}
          categoryImages={categoryImages}
          tenantSlug={tenant.slug}
          allProducts={allProducts}
          onToggle={toggleCategory}
          onImageChange={(slug, url) => setCategoryImages((prev) => {
            const next = { ...prev }
            if (url) next[slug] = url
            else delete next[slug]
            return next
          })}
          onCategoryCreated={(cat) => {
            setLocalCategories((prev) => [...prev, cat])
            setEnabled((prev) => new Set([...Array.from(prev), cat.slug]))
          }}
          onCategoryDeleted={(slug) => {
            setLocalCategories((prev) => prev.filter((c) => c.slug !== slug))
            setEnabled((prev) => { const n = new Set(prev); n.delete(slug); return n })
          }}
        />
      </Section>

      {/* Products */}
      <Section
        title="Product overrides"
        hint="Disable individual products, set a custom price, or swap in a product image. Disabled products are hidden from this site."
      >
        <ProductOverridesPanel
          allProducts={allProducts}
          allCategories={localCategories}
          enabledCategories={Array.from(enabled)}
          enabledImportTags={Array.from(importTags)}
          overrides={productOverrides}
          onChange={patchProductOverride}
          tenantSlug={tenant.slug}
          brandLogoUrl={logoImage}
          brandPrimaryColor={primaryColor}
          brandCompanyName={name}
        />
      </Section>

      {/* Status / promote */}
      <Section
        title={status === "live" ? "Live portal" : "Demo site"}
        hint={status === "live" ? "Contact-to-order CTAs visible to visitors." : "Showcase only — promote when they become a customer."}
      >
        <Field label="Rep name">
          <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Jane Smith" className={inputCls} />
        </Field>
        <Field label="Contact email">
          <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="jane@fastsigns.com" className={inputCls} />
        </Field>
        <Field label="Contact phone">
          <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="(555) 555-0100" className={inputCls} />
        </Field>
        <Field label="Order CTA text" hint="Live mode — product detail order button">
          <input value={orderCtaText} onChange={(e) => setOrderCtaText(e.target.value)} placeholder="Contact to order" className={inputCls} />
        </Field>
        <Field label="Quote CTA text" hint="Demo mode — product detail quote button">
          <input value={quoteCtaText} onChange={(e) => setQuoteCtaText(e.target.value)} placeholder="Get a quote →" className={inputCls} />
        </Field>
        <Field label="Status">
          <div className="flex items-center gap-2">
            {status === "demo" ? (
              <button type="button" disabled={busy || !contactEmail.trim()} onClick={() => setStatus("live")}
                title={!contactEmail.trim() ? "Add a contact email first" : undefined}
                className="bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white text-xs font-semibold px-3 py-1.5 rounded-md">
                Promote to live
              </button>
            ) : (
              <button type="button" disabled={busy} onClick={() => setStatus("demo")}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-md border border-gray-200">
                Demote to demo
              </button>
            )}
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status === "live" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
              {status === "live" ? "● Live" : "● Demo"}
            </span>
          </div>
        </Field>
      </Section>

      {/* Access control */}
      <Section
        title="Access control"
        hint="Blank = public. Add domains to gate with magic-link login."
      >
        <Field label="Allowed domains" hint="comma-separated, e.g. nike.com">
          <input
            value={allowedDomains}
            onChange={(e) => setAllowedDomains(e.target.value)}
            placeholder="nike.com, nikegroup.com"
            className={inputCls}
          />
        </Field>
      </Section>

      {/* Danger zone */}
      <section className="border border-red-200 rounded-lg p-3">
        <h2 className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-3">Danger zone</h2>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={archive}
            disabled={busy}
            className="text-sm border border-red-300 text-red-600 hover:bg-red-50 font-medium px-4 py-2 rounded-lg"
          >
            Archive site
          </button>
          <button
            type="button"
            onClick={() => { setShowDeleteConfirm(true); setDeleteSlugInput("") }}
            disabled={busy}
            className="text-sm bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg"
          >
            Delete permanently
          </button>
        </div>

        {showDeleteConfirm && (
          <div className="mt-4 p-4 bg-red-50 border border-red-300 rounded-lg space-y-3">
            <p className="text-sm text-red-700 font-medium">
              This cannot be undone. Type <code className="font-mono bg-white px-1 rounded border border-red-200">{tenant.slug}</code> to confirm.
            </p>
            <div className="flex items-center gap-2">
              <input
                value={deleteSlugInput}
                onChange={(e) => setDeleteSlugInput(e.target.value)}
                placeholder={tenant.slug}
                className="flex-1 px-3 py-2 border border-red-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-400"
              />
              <button
                type="button"
                onClick={permanentDelete}
                disabled={busy || deleteSlugInput !== tenant.slug}
                className="bg-red-700 hover:bg-red-800 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-lg whitespace-nowrap"
              >
                {busy ? "Deleting…" : "Confirm delete"}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Floating save bar */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-white rounded-xl shadow-lg border border-gray-200 px-3 py-2">
        {saved && <span className="text-xs text-green-600 font-medium">✓ Saved</span>}
        {error && <span className="text-xs text-red-500 max-w-[180px] truncate" title={error}>{error}</span>}
        <button
          type="submit"
          disabled={busy}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-1.5 rounded-lg"
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  )
}

const inputCls =
  "w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"

function Section({
  title,
  hint,
  action,
  children,
}: {
  title: string
  hint?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-1.5 pb-1.5 border-b border-gray-100">
        <h2 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider shrink-0">{title}</h2>
        {hint && <p className="text-xs text-gray-400 truncate flex-1">{hint}</p>}
        {action && <div className="ml-auto flex items-center gap-1.5">{action}</div>}
      </div>
      <div>{children}</div>
    </section>
  )
}

function Field({
  label,
  hint,
  children,
  wide,
}: {
  label: string
  hint?: string
  children: React.ReactNode
  wide?: boolean
}) {
  return (
    <div className={`grid py-1 gap-2 ${wide ? "grid-cols-1" : "grid-cols-[140px_1fr] items-center"}`}>
      <div>
        <span className="text-xs text-gray-500">{label}</span>
        {hint && <span className="block text-[11px] text-gray-400 leading-tight">{hint}</span>}
      </div>
      <div>{children}</div>
    </div>
  )
}

// ── CategoryManager ──────────────────────────────────────────
const CAT_ICONS = [
  "Flag", "Layers", "Monitor", "Car", "Navigation", "Gift",
  "Tag", "Compass", "Star", "Palette", "Package",
]

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

function CategoryManager({
  categories,
  enabled,
  categoryImages,
  tenantSlug,
  allProducts,
  onToggle,
  onImageChange,
  onCategoryCreated,
  onCategoryDeleted,
}: {
  categories: BankCategory[]
  enabled: Set<string>
  categoryImages: Record<string, string>
  tenantSlug: string
  allProducts: DbProduct[]
  onToggle: (slug: string) => void
  onImageChange: (slug: string, url: string) => void
  onCategoryCreated: (cat: BankCategory) => void
  onCategoryDeleted: (slug: string) => void
}) {
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState("")
  const [newIcon, setNewIcon] = useState("Package")
  const [newDesc, setNewDesc] = useState("")
  const [newProductSlugs, setNewProductSlugs] = useState<Set<string>>(new Set())
  const [newProductSearch, setNewProductSearch] = useState("")
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null)

  const newSlug = slugify(newName)

  const filteredNewProducts = allProducts.filter((p) => {
    if (!newProductSearch.trim()) return true
    const q = newProductSearch.toLowerCase()
    return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
  })

  async function createCategory() {
    if (!newName.trim() || !newSlug) return
    setCreating(true)
    setCreateError(null)
    try {
      const res = await fetch("/api/master/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: newSlug,
          name: newName.trim(),
          icon: newIcon,
          description: newDesc.trim(),
          product_slugs: Array.from(newProductSlugs),
        }),
      })
      const json = await res.json()
      if (!res.ok) { setCreateError(json.error ?? "Failed"); return }
      onCategoryCreated({ ...json, productSlugs: json.productSlugs ?? [] })
      setShowNew(false)
      setNewName("")
      setNewIcon("Package")
      setNewDesc("")
      setNewProductSlugs(new Set())
    } catch (e: any) {
      setCreateError(e.message)
    } finally {
      setCreating(false)
    }
  }

  async function deleteCategory(slug: string, name: string) {
    if (!confirm(`Delete category "${name}"? This cannot be undone.`)) return
    setDeletingSlug(slug)
    try {
      const res = await fetch(`/api/master/categories?slug=${slug}`, { method: "DELETE" })
      if (res.ok) onCategoryDeleted(slug)
    } finally {
      setDeletingSlug(null)
    }
  }

  return (
    <div className="space-y-1.5">
      {categories.map((cat) => {
        const on = enabled.has(cat.slug)
        const expanded = expandedSlug === cat.slug
        const imgUrl = categoryImages[cat.slug] ?? ""
        const isCustom = (cat.productSlugs?.length ?? 0) > 0

        return (
          <div
            key={cat.slug}
            className={`border rounded-lg overflow-hidden transition-colors ${on ? "border-blue-200" : "border-gray-200"}`}
          >
            {/* Row */}
            <div className={`flex items-center gap-2 px-3 py-2 ${on ? "bg-blue-50" : "bg-white"}`}>
              {/* Toggle */}
              <button
                type="button"
                onClick={() => onToggle(cat.slug)}
                className={`shrink-0 w-8 h-8 rounded-md border-2 flex items-center justify-center transition-colors ${
                  on ? "bg-blue-600 border-blue-600" : "border-gray-300 hover:border-blue-400"
                }`}
              >
                {on && (
                  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-white">
                    <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>

              {/* Thumb */}
              {imgUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imgUrl} alt={cat.name} className="w-8 h-8 rounded object-cover shrink-0 border border-gray-100" />
              ) : (
                <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${on ? "bg-blue-100" : "bg-gray-100"}`}>
                  <CategoryIcon name={cat.icon} size={16} strokeWidth={1.5} className={on ? "text-blue-500" : "text-gray-400"} />
                </div>
              )}

              {/* Name + badges */}
              <div className="flex-1 min-w-0">
                <span className={`text-sm font-semibold ${on ? "text-blue-900" : "text-gray-700"}`}>{cat.name}</span>
                {isCustom && (
                  <span className="ml-1.5 text-[10px] font-semibold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
                    Custom · {cat.productSlugs!.length} products
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setExpandedSlug(expanded ? null : cat.slug)}
                  className="text-[11px] px-2 py-1 rounded border border-gray-200 hover:border-gray-400 text-gray-500 hover:text-gray-800"
                >
                  {expanded ? "▲" : "▼"} Image
                </button>
                {isCustom && (
                  <button
                    type="button"
                    disabled={deletingSlug === cat.slug}
                    onClick={() => deleteCategory(cat.slug, cat.name)}
                    className="text-[11px] px-2 py-1 rounded border border-red-100 text-red-400 hover:border-red-300 hover:text-red-600 disabled:opacity-40"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>

            {/* Expanded image uploader */}
            {expanded && (
              <div className="px-3 pb-3 pt-2 border-t border-gray-100 bg-gray-50">
                <div className="text-xs text-gray-500 mb-2">
                  Card image — shown as full-bleed background on the homepage category card.
                  800 × 500 px JPG or WEBP recommended.
                </div>
                <ImageUploader
                  value={imgUrl}
                  onChange={(url) => onImageChange(cat.slug, url)}
                  slug={tenantSlug}
                  kind="category"
                  previewAspect="8/5"
                  maxPreviewHeight={90}
                />
              </div>
            )}
          </div>
        )
      })}

      {/* Create custom category */}
      {!showNew ? (
        <button
          type="button"
          onClick={() => setShowNew(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-blue-600 border border-dashed border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors mt-1"
        >
          + Create custom category
        </button>
      ) : (
        <div className="border border-blue-200 rounded-lg p-4 bg-blue-50/50 space-y-3 mt-1">
          <div className="text-xs font-semibold text-gray-700">New custom category</div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-gray-500 mb-0.5">Name *</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Cold Storage"
                className={inputCls}
              />
              {newSlug && <span className="text-[10px] text-gray-400 font-mono">/{newSlug}</span>}
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 mb-0.5">Icon</label>
              <select
                value={newIcon}
                onChange={(e) => setNewIcon(e.target.value)}
                className={inputCls}
              >
                {CAT_ICONS.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-gray-500 mb-0.5">Description</label>
            <input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Signs for cold chain environments"
              className={inputCls}
            />
          </div>

          {/* Product picker */}
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">
              Products <span className="text-gray-400">(optional — picks specific products for this category)</span>
              {newProductSlugs.size > 0 && (
                <span className="ml-1.5 text-purple-700 font-semibold">{newProductSlugs.size} selected</span>
              )}
            </label>
            <input
              value={newProductSearch}
              onChange={(e) => setNewProductSearch(e.target.value)}
              placeholder="Filter products…"
              className={`${inputCls} mb-1`}
            />
            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded bg-white divide-y divide-gray-100">
              {filteredNewProducts.map((p) => {
                const sel = newProductSlugs.has(p.slug)
                return (
                  <label key={p.slug} className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-gray-50 ${sel ? "bg-blue-50" : ""}`}>
                    <input
                      type="checkbox"
                      checked={sel}
                      onChange={() => setNewProductSlugs((prev) => {
                        const n = new Set(prev)
                        n.has(p.slug) ? n.delete(p.slug) : n.add(p.slug)
                        return n
                      })}
                      className="rounded border-gray-300 text-blue-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-800 truncate">{p.name}</div>
                      <div className="text-[10px] text-gray-400 font-mono truncate">{p.category}</div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {createError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">{createError}</p>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={createCategory}
              disabled={creating || !newName.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold px-3 py-1.5 rounded"
            >
              {creating ? "Creating…" : "Create"}
            </button>
            <button type="button" onClick={() => setShowNew(false)} className="text-xs text-gray-500 hover:text-gray-700">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
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
    <div className="flex items-center gap-1.5">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-7 h-7 rounded border border-gray-300 cursor-pointer p-0.5"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls} font-mono w-24`}
      />
    </div>
  )
}

// ── Brand image (Sharp compositing) ──────────────────────────

// BrandImageButton replaced by MockupEditor modal — see below

function BrandImageButton({
  tenantSlug,
  productImageUrl,
  logoUrl,
  onUseImage,
}: {
  tenantSlug: string
  productImageUrl: string
  logoUrl: string
  primaryColor: string
  companyName: string
  onUseImage: (url: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        disabled={!productImageUrl.trim()}
        onClick={() => setOpen(true)}
        title={!productImageUrl.trim() ? "Product needs an image first" : "Open logo placement editor"}
        className="mt-1 text-xs text-blue-600 hover:text-blue-800 disabled:opacity-40 font-semibold flex items-center gap-1"
      >
        <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="7" cy="7" r="1" fill="currentColor"/></svg>
        Place logo on image
      </button>
      {open && (
        <MockupEditor
          productImageUrl={productImageUrl}
          tenantLogoUrl={logoUrl}
          tenantSlug={tenantSlug}
          onUseImage={onUseImage}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

// ── Mockup generator ──────────────────────────────────────────

function MockupGenerator({
  tenantSlug,
  productImageUrl,
  onUseImage,
}: {
  tenantSlug: string
  productImageUrl: string
  onUseImage: (url: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [templates, setTemplates] = useState<DmTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [templateError, setTemplateError] = useState<string | null>(null)

  const [selectedTemplate, setSelectedTemplate] = useState<DmTemplate | null>(null)
  const [selectedSoUuid, setSelectedSoUuid] = useState<string>("")
  const [sourceUrl, setSourceUrl] = useState(productImageUrl)
  const [rendering, setRendering] = useState(false)
  const [renderedUrl, setRenderedUrl] = useState<string | null>(null)
  const [renderError, setRenderError] = useState<string | null>(null)

  // Keep sourceUrl in sync when productImageUrl changes externally
  const prevProductImage = useRef(productImageUrl)
  useEffect(() => {
    if (productImageUrl !== prevProductImage.current) {
      prevProductImage.current = productImageUrl
      if (!renderedUrl) setSourceUrl(productImageUrl)
    }
  }, [productImageUrl, renderedUrl])

  async function loadTemplates() {
    if (templates.length > 0) return
    setLoadingTemplates(true)
    setTemplateError(null)
    try {
      const res = await fetch("/api/master/mockup/templates")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to load templates")
      setTemplates(json.templates ?? [])
    } catch (e: any) {
      setTemplateError(e.message)
    } finally {
      setLoadingTemplates(false)
    }
  }

  function handleOpen() {
    setOpen(true)
    loadTemplates()
  }

  function handleSelectTemplate(t: DmTemplate) {
    setSelectedTemplate(t)
    setSelectedSoUuid(t.smart_objects[0]?.uuid ?? "")
    setRenderedUrl(null)
    setRenderError(null)
  }

  async function handleRender() {
    if (!selectedTemplate || !selectedSoUuid || !sourceUrl.trim()) return
    setRendering(true)
    setRenderError(null)
    setRenderedUrl(null)
    try {
      const res = await fetch("/api/master/mockup/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mockup_uuid: selectedTemplate.uuid,
          smart_object_uuid: selectedSoUuid,
          image_url: sourceUrl.trim(),
          tenant_slug: tenantSlug,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Render failed")
      setRenderedUrl(json.url)
    } catch (e: any) {
      setRenderError(e.message)
    } finally {
      setRendering(false)
    }
  }

  function handleUse() {
    if (!renderedUrl) return
    onUseImage(renderedUrl)
    setOpen(false)
    setRenderedUrl(null)
    setSelectedTemplate(null)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        className="mt-1 text-xs text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-1"
      >
        <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/></svg>
        Generate mockup
      </button>
    )
  }

  return (
    <div className="mt-2 border border-purple-200 rounded-lg bg-purple-50 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-purple-800">Dynamic Mockups</span>
        <button
          type="button"
          onClick={() => { setOpen(false); setRenderedUrl(null); setRenderError(null) }}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          ✕ close
        </button>
      </div>

      {templateError && (
        <p className="text-xs text-red-600">{templateError}</p>
      )}

      {loadingTemplates && (
        <p className="text-xs text-purple-600 animate-pulse">Loading templates…</p>
      )}

      {!loadingTemplates && templates.length === 0 && !templateError && (
        <p className="text-xs text-gray-500 italic">No mockup templates found in your account.</p>
      )}

      {templates.length > 0 && (
        <>
          {/* Template grid */}
          <div>
            <span className="block text-xs font-semibold text-gray-700 mb-1.5">
              1. Pick a template
            </span>
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
              {templates.map((t) => (
                <button
                  key={t.uuid}
                  type="button"
                  onClick={() => handleSelectTemplate(t)}
                  className={`rounded-lg border-2 overflow-hidden text-left transition-all ${
                    selectedTemplate?.uuid === t.uuid
                      ? "border-purple-500 ring-1 ring-purple-400"
                      : "border-gray-200 hover:border-purple-300"
                  }`}
                >
                  {t.preview_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.preview_url}
                      alt={t.name}
                      className="w-full h-14 object-cover"
                    />
                  ) : (
                    <div className="w-full h-14 bg-gray-100 flex items-center justify-center text-gray-300">
                      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M3 16l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  )}
                  <p className="text-[10px] font-medium text-gray-700 px-1.5 py-1 truncate">
                    {t.name}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Smart object selector */}
          {selectedTemplate && selectedTemplate.smart_objects.length > 1 && (
            <div>
              <span className="block text-xs font-semibold text-gray-700 mb-1">
                2. Smart object (slot)
              </span>
              <select
                value={selectedSoUuid}
                onChange={(e) => setSelectedSoUuid(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                {selectedTemplate.smart_objects.map((so) => (
                  <option key={so.uuid} value={so.uuid}>
                    {so.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Source image URL */}
          {selectedTemplate && (
            <div>
              <span className="block text-xs font-semibold text-gray-700 mb-1">
                {selectedTemplate.smart_objects.length > 1 ? "3." : "2."} Image URL to place in mockup
              </span>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://example.com/my-artwork.png"
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <p className="text-[10px] text-gray-400 mt-0.5">
                Must be a publicly accessible URL. This is the artwork/design placed inside the mockup.
              </p>
            </div>
          )}

          {/* Render button */}
          {selectedTemplate && (
            <button
              type="button"
              disabled={rendering || !sourceUrl.trim() || !selectedSoUuid}
              onClick={handleRender}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-2"
            >
              {rendering ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" />
                  </svg>
                  Rendering…
                </>
              ) : (
                "✨ Generate mockup"
              )}
            </button>
          )}

          {renderError && (
            <p className="text-xs text-red-600">{renderError}</p>
          )}

          {/* Result preview */}
          {renderedUrl && (
            <div className="space-y-2">
              <span className="block text-xs font-semibold text-gray-700">Result</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={renderedUrl}
                alt="Generated mockup"
                className="w-full rounded-lg border border-gray-200 object-contain max-h-48"
              />
              <button
                type="button"
                onClick={handleUse}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-2 rounded-lg"
              >
                ✓ Use this as product image
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Compact product image cell ────────────────────────────────
function ProductImageCell({
  value,
  onChange,
  tenantSlug,
  productImageUrl,
  brandLogoUrl,
  brandPrimaryColor,
  brandCompanyName,
}: {
  value: string
  onChange: (url: string) => void
  tenantSlug: string
  productImageUrl: string
  brandLogoUrl: string
  brandPrimaryColor: string
  brandCompanyName: string
}) {
  const [mode, setMode] = useState<null | "lightbox" | "editor">(null)
  const [busy, setBusy] = useState(false)

  const modalContent =
    mode === "lightbox" && value ? (
      <div
        className="fixed inset-0 z-[999] bg-black/80 flex items-center justify-center p-6"
        onClick={() => setMode(null)}
      >
        <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setMode(null)}
            className="absolute -top-9 right-0 text-white/70 hover:text-white text-sm font-medium flex items-center gap-1.5"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Close
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="w-full max-h-[80vh] object-contain rounded-lg shadow-2xl" />
          <div className="flex gap-2 mt-3 justify-end">
            <button
              type="button"
              onClick={() => setMode("editor")}
              className="text-xs text-white/80 hover:text-white border border-white/30 hover:border-white/60 px-3 py-1.5 rounded-lg transition-colors"
            >
              Edit image
            </button>
            <button
              type="button"
              onClick={() => { onChange(""); setMode(null) }}
              className="text-xs text-red-400 hover:text-red-300 border border-red-400/40 hover:border-red-400/70 px-3 py-1.5 rounded-lg transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    ) : mode === "editor" ? (
      <div
        className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center p-4"
        onClick={() => setMode(null)}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-80 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-bold text-gray-900">Product image</span>
            <button type="button" onClick={() => setMode(null)} className="text-gray-400 hover:text-gray-700">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="p-4 space-y-3">
            <ImageUploader
              value={value}
              onChange={(url) => { onChange(url); if (url) setMode(null) }}
              slug={tenantSlug}
              kind="logo"
              previewAspect="4/3"
              maxPreviewHeight={140}
              recommendation="PNG, JPG, or WEBP"
            />
            <div className="border-t border-gray-100 pt-3 space-y-2">
              <BrandImageButton
                tenantSlug={tenantSlug}
                productImageUrl={productImageUrl}
                logoUrl={brandLogoUrl}
                primaryColor={brandPrimaryColor}
                companyName={brandCompanyName}
                onUseImage={(url) => { onChange(url); setMode(null) }}
              />
              <MockupGenerator
                tenantSlug={tenantSlug}
                productImageUrl={productImageUrl}
                onUseImage={(url) => { onChange(url); setMode(null) }}
              />
            </div>
            {value && (
              <button
                type="button"
                onClick={() => { onChange(""); setMode(null) }}
                className="w-full text-xs text-red-500 hover:text-red-700 py-1.5 border border-red-100 hover:border-red-200 rounded-lg transition-colors"
              >
                Remove image
              </button>
            )}
          </div>
        </div>
      </div>
    ) : null

  return (
    <>
      {/* Thumbnail with hover actions */}
      <div className="shrink-0 group relative w-12 h-12">
        <button
          type="button"
          onClick={() => setMode(value ? "lightbox" : "editor")}
          className="w-full h-full rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center transition-colors hover:border-gray-400"
        >
          {busy ? (
            <svg className="animate-spin w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" />
            </svg>
          ) : value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-gray-400">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M3 16l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
        {/* Hover overlay */}
        {value && (
          <div className="absolute inset-0 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 pointer-events-none group-hover:pointer-events-auto">
            <button
              type="button"
              title="View"
              onClick={(e) => { e.stopPropagation(); setMode("lightbox") }}
              className="w-6 h-6 rounded bg-white/90 hover:bg-white flex items-center justify-center"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3 text-gray-800">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
            <button
              type="button"
              title="Edit"
              onClick={(e) => { e.stopPropagation(); setMode("editor") }}
              className="w-6 h-6 rounded bg-white/90 hover:bg-white flex items-center justify-center"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3 text-gray-800">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              title="Remove"
              onClick={(e) => { e.stopPropagation(); onChange("") }}
              className="w-6 h-6 rounded bg-white/90 hover:bg-white flex items-center justify-center"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3 text-red-500">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}
      </div>
      {/* Portal modals — renders at document.body to escape any stacking context */}
      {typeof window !== "undefined" && modalContent
        ? createPortal(modalContent, document.body)
        : null}
    </>
  )
}

// ── Product overrides panel ────────────────────────────────────

function ProductOverridesPanel({
  allProducts,
  allCategories,
  enabledCategories,
  enabledImportTags,
  overrides,
  onChange,
  tenantSlug,
  brandLogoUrl,
  brandPrimaryColor,
  brandCompanyName,
}: {
  allProducts: DbProduct[]
  allCategories: BankCategory[]
  enabledCategories: string[]
  enabledImportTags: string[]
  overrides: ProductOverrides
  onChange: (slug: string, patch: Partial<ProductOverrides[string]>) => void
  tenantSlug: string
  brandLogoUrl: string
  brandPrimaryColor: string
  brandCompanyName: string
}) {
  const [search, setSearch] = useState("")
  const [openCats, setOpenCats] = useState<Set<string>>(new Set())

  const catMap = new Map(allCategories.map((c) => [c.slug, c]))

  // Filter to relevant products
  const visibleProducts =
    enabledCategories.length === 0 && enabledImportTags.length === 0
      ? allProducts
      : allProducts.filter((p) => {
          if (p.import_tag === null) {
            return enabledCategories.length === 0 || enabledCategories.includes(p.category)
          }
          return enabledImportTags.includes(p.import_tag ?? "")
        })

  // Apply search filter
  const q = search.trim().toLowerCase()
  const searchFiltered = q
    ? visibleProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.shortDesc.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q)
      )
    : visibleProducts

  // Group by category
  const catSlugs = Array.from(new Set(searchFiltered.map((p) => p.category)))
  const productsByCat = catSlugs.map((slug) => ({
    cat: catMap.get(slug) ?? { slug, name: slug, icon: "Package", description: "" },
    products: searchFiltered.filter((p) => p.category === slug),
  }))

  // Count overridden products (disabled, custom price, or custom image)
  const overriddenSlugs = new Set(
    Object.entries(overrides)
      .filter(([, ov]) => ov.disabled || ov.price !== undefined || ov.imageUrl)
      .map(([slug]) => slug)
  )

  function toggleCat(slug: string) {
    setOpenCats((prev) => {
      const next = new Set(prev)
      next.has(slug) ? next.delete(slug) : next.add(slug)
      return next
    })
  }

  // Auto-open categories when searching
  const effectiveOpenCats = q
    ? new Set(catSlugs) // open all when searching
    : openCats

  if (productsByCat.length === 0 && !q) {
    return (
      <p className="text-xs text-gray-400 italic">
        Enable at least one product category or import tag above to configure overrides.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {/* Search */}
      <div className="relative">
        <svg viewBox="0 0 24 24" fill="none" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400">
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
          <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products…"
          className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {q && productsByCat.length === 0 && (
        <p className="text-xs text-gray-400 italic py-2">No products match "{search}"</p>
      )}

      {productsByCat.map(({ cat, products }) => {
        const isOpen = effectiveOpenCats.has(cat.slug)
        const catOverrideCount = products.filter((p) => overriddenSlugs.has(p.slug)).length
        const disabledCount = products.filter((p) => overrides[p.slug]?.disabled).length

        return (
        <div key={cat.slug} className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Accordion header */}
          <button
            type="button"
            onClick={() => toggleCat(cat.slug)}
            className="w-full flex items-center gap-2 px-3 py-2.5 bg-white hover:bg-gray-50 transition-colors text-left"
          >
            <CategoryIcon name={cat.icon} size={13} strokeWidth={1.75} className="text-gray-500 shrink-0" />
            <span className="text-xs font-bold text-gray-700 flex-1">{cat.name}</span>
            <span className="text-[11px] text-gray-400">{products.length} products</span>
            {disabledCount > 0 && (
              <span className="text-[10px] bg-red-100 text-red-600 font-semibold px-1.5 py-0.5 rounded-full">
                {disabledCount} hidden
              </span>
            )}
            {catOverrideCount > 0 && (
              <span className="text-[10px] bg-blue-100 text-blue-600 font-semibold px-1.5 py-0.5 rounded-full">
                {catOverrideCount} edited
              </span>
            )}
            <svg
              viewBox="0 0 24 24" fill="none"
              className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
            >
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Accordion body */}
          {isOpen && (
          <div className="divide-y divide-gray-100 border-t border-gray-100">
            {products.map((p) => {
              const ov = overrides[p.slug] ?? {}
              const disabled = ov.disabled ?? false
              return (
                <div
                  key={p.slug}
                  className={`relative flex items-start gap-3 p-3 transition-colors ${
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
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 items-center">
                        {/* Price override */}
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-400">$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder={String(p.startingPrice)}
                            value={ov.price ?? ""}
                            onChange={(e) => {
                              const v = e.target.value
                              onChange(p.slug, { price: v === "" ? undefined : parseFloat(v) })
                            }}
                            className="w-20 px-1.5 py-0.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          {ov.price !== undefined && (
                            <button type="button" onClick={() => onChange(p.slug, { price: undefined })}
                              className="text-[10px] text-gray-400 hover:text-gray-600" title="Reset price">✕</button>
                          )}
                        </div>
                        {/* Featured */}
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input type="checkbox" checked={ov.featured ?? p.featured}
                            onChange={(e) => onChange(p.slug, { featured: e.target.checked })}
                            className="w-3 h-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-500">Featured</span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Product image — compact thumbnail + uploader */}
                  {!disabled && (
                    <ProductImageCell
                      // Show the override if set, otherwise the product's own
                      // image. Removing an override falls back to the product
                      // default automatically.
                      value={ov.imageUrl ?? p.imageUrl ?? ""}
                      onChange={(url) => onChange(p.slug, { imageUrl: url || undefined })}
                      tenantSlug={tenantSlug}
                      productImageUrl={ov.imageUrl ?? p.imageUrl ?? ""}
                      brandLogoUrl={brandLogoUrl}
                      brandPrimaryColor={brandPrimaryColor}
                      brandCompanyName={brandCompanyName}
                    />
                  )}
                </div>
              )
            })}
          </div>
          )}
        </div>
        )
      })}
    </div>
  )
}
