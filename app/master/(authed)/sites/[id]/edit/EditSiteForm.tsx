"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { type BankCategory, type ProductOverrides } from "@/lib/product-bank"
import type { DbProduct } from "@/lib/products-db"
import type { Tenant } from "@/lib/tenant"
import ImageUploader from "../../../_shared/ImageUploader"
import MockupEditor from "./MockupEditor"

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
  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteSlugInput, setDeleteSlugInput] = useState("")

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
        contactName: contactName.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        orderCtaText: orderCtaText.trim() || "Contact to order",
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
                  <span className="text-lg">📦</span>
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
          allProducts={allProducts}
          allCategories={categories}
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
        title={status === "live" ? "🟢 Live portal" : "🔵 Demo site"}
        hint={
          status === "live"
            ? "This site is live. Visitors see product cards with a contact-to-order CTA. Fill in the rep contact details below."
            : "This site is in demo mode — showcase only. Promote to live when the prospect becomes a customer."
        }
      >
        {/* Contact fields — always visible so you can fill them before promoting */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Rep / contact name">
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Jane Smith"
              className={inputCls}
            />
          </Field>
          <Field label="Contact email">
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="jane@fastsigns.com"
              className={inputCls}
            />
          </Field>
          <Field label="Contact phone (optional)">
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="(555) 555-0100"
              className={inputCls}
            />
          </Field>
          <Field label="Order CTA text">
            <input
              value={orderCtaText}
              onChange={(e) => setOrderCtaText(e.target.value)}
              placeholder="Contact to order"
              className={inputCls}
            />
          </Field>
        </div>

        <div className="pt-2 flex items-center gap-3">
          {status === "demo" ? (
            <button
              type="button"
              disabled={busy || !contactEmail.trim()}
              onClick={() => setStatus("live")}
              title={!contactEmail.trim() ? "Add a contact email first" : undefined}
              className="bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2 rounded-lg"
            >
              🚀 Promote to live
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => setStatus("demo")}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-semibold px-5 py-2 rounded-lg"
            >
              ↩ Demote to demo
            </button>
          )}
          <span className="text-xs text-gray-400">
            {status === "demo"
              ? "Contact email required to promote"
              : "Demoting hides the order CTAs but keeps contact info saved"}
          </span>
        </div>
      </Section>

      {/* Danger zone */}
      <section className="bg-white rounded-xl border border-red-200 p-5">
        <h2 className="text-sm font-bold text-red-700 mb-3">Danger zone</h2>
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
        🏷 Place logo on image
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
        <span>🎨</span> Generate mockup
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
                    <div className="w-full h-14 bg-gray-200 flex items-center justify-center text-gray-400 text-2xl">
                      🖼
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
  const catMap = new Map(allCategories.map((c) => [c.slug, c]))

  // Filter to relevant products (same logic as server-side getProducts)
  const visibleProducts =
    enabledCategories.length === 0 && enabledImportTags.length === 0
      ? allProducts
      : allProducts.filter((p) => {
          if (p.import_tag === null) {
            return enabledCategories.length === 0 || enabledCategories.includes(p.category)
          }
          return enabledImportTags.includes(p.import_tag ?? "")
        })

  // Derive distinct categories from visible products
  const catSlugs = Array.from(new Set(visibleProducts.map((p) => p.category)))

  // Group products by category
  const productsByCat = catSlugs.map((slug) => ({
    cat: catMap.get(slug) ?? { slug, name: slug, icon: "📦", description: "" },
    products: visibleProducts.filter((p) => p.category === slug),
  }))

  if (productsByCat.length === 0) {
    return (
      <p className="text-xs text-gray-400 italic">
        Enable at least one product category or import tag above to configure overrides.
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

                  {/* Product image upload + mockup generator */}
                  {!disabled && (
                    <div className="w-full sm:w-44 shrink-0">
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
                      <BrandImageButton
                        tenantSlug={tenantSlug}
                        productImageUrl={ov.imageUrl ?? p.imageUrl ?? ""}
                        logoUrl={brandLogoUrl}
                        primaryColor={brandPrimaryColor}
                        companyName={brandCompanyName}
                        onUseImage={(url) => onChange(p.slug, { imageUrl: url })}
                      />
                      <MockupGenerator
                        tenantSlug={tenantSlug}
                        productImageUrl={ov.imageUrl ?? p.imageUrl ?? ""}
                        onUseImage={(url) => onChange(p.slug, { imageUrl: url })}
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
