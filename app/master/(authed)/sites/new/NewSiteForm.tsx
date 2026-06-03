"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { BankCategory } from "@/lib/product-bank"
import ImageUploader from "../../_shared/ImageUploader"
import CategoryIcon from "@/components/CategoryIcon"

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")

export default function NewSiteForm({
  categories,
  availableImportTags,
}: {
  categories: BankCategory[]
  availableImportTags: string[]
}) {
  const router = useRouter()

  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [slugTouched, setSlugTouched] = useState(false)
  const [adminEmail, setAdminEmail] = useState("")
  const [primaryColor, setPrimaryColor] = useState("#1e3a5f")
  const [accentColor, setAccentColor] = useState("#f59e0b")
  const [logoImage, setLogoImage] = useState("")
  const [heroBgImage, setHeroBgImage] = useState("")
  const [heroHeading, setHeroHeading] = useState("")
  const [heroSubheading, setHeroSubheading] = useState("")
  const [enabled, setEnabled] = useState<Set<string>>(new Set())
  const [importTags, setImportTags] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [domain, setDomain] = useState("")
  const [fetching, setFetching] = useState(false)
  const [fetchInfo, setFetchInfo] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)

  async function fetchFromBrand() {
    if (!domain.trim()) return
    setFetching(true)
    setFetchError(null)
    setFetchInfo(null)
    try {
      const res = await fetch("/api/master/brandfetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domain.trim(), slug: slug || undefined }),
      })
      const json = await res.json()
      if (!res.ok) {
        setFetchError(json.error ?? "Fetch failed")
        return
      }
      const b = json.brand
      const filled: string[] = []
      if (b.name && !name) {
        handleNameChange(b.name)
        filled.push("name")
      }
      if (b.primaryColor) {
        setPrimaryColor(b.primaryColor)
        filled.push("primary")
      }
      if (b.accentColor) {
        setAccentColor(b.accentColor)
        filled.push("accent")
      }
      if (b.logoUrl) {
        setLogoImage(b.logoUrl)
        filled.push(b.logoRehosted ? "logo (rehosted)" : "logo")
      }
      setFetchInfo(
        filled.length
          ? `Filled: ${filled.join(", ")}`
          : "Brand found, but no usable assets returned"
      )
    } finally {
      setFetching(false)
    }
  }

  function handleNameChange(v: string) {
    setName(v)
    if (!slugTouched) setSlug(slugify(v))
  }

  function toggleCategory(catSlug: string) {
    const next = new Set(enabled)
    if (next.has(catSlug)) next.delete(catSlug)
    else next.add(catSlug)
    setEnabled(next)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const brand: Record<string, unknown> = {
        company: name,
        logoText: name.toUpperCase(),
        primaryColor,
        accentColor,
      }
      if (logoImage.trim()) brand.logoImage = logoImage.trim()
      if (heroBgImage.trim()) brand.heroBgImage = heroBgImage.trim()
      if (heroHeading.trim()) brand.heroHeading = heroHeading.trim()
      if (heroSubheading.trim()) brand.heroSubheading = heroSubheading.trim()

      const res = await fetch("/api/master/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          name,
          brand,
          enabled_categories: Array.from(enabled),
          import_tags: Array.from(importTags),
          admin_email: adminEmail || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? "Couldn't create site")
        return
      }
      router.push(`/master/sites/${json.tenant.id}/edit`)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      {/* Brandfetch quick-start */}
      <Section
        title="Quick start from a domain"
        hint="Type a company's domain and we'll auto-fill the brand name, colors, and logo from Brandfetch."
      >
        <div className="flex items-stretch gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500">
            <span className="text-gray-400 text-sm font-mono">https://</span>
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  void fetchFromBrand()
                }
              }}
              placeholder="acme.com"
              className="flex-1 py-2 text-sm focus:outline-none bg-transparent"
            />
          </div>
          <button
            type="button"
            onClick={fetchFromBrand}
            disabled={fetching || !domain.trim()}
            className="bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg whitespace-nowrap"
          >
            {fetching ? "Fetching…" : "Fetch brand"}
          </button>
        </div>
        {fetchInfo && (
          <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1.5">
            ✓ {fetchInfo}
          </div>
        )}
        {fetchError && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1.5">
            {fetchError}
          </div>
        )}
      </Section>

      {/* Identity */}
      <Section title="Identity">
        <Field label="Display name" hint="The brand's name as shown in nav and emails.">
          <input
            required
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Acme Industries"
            className={inputCls}
          />
        </Field>
        <Field label="Slug" hint="The URL path. Auto-generated from name; you can override.">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 font-mono">/sites/</span>
            <input
              required
              value={slug}
              onChange={(e) => {
                setSlugTouched(true)
                setSlug(slugify(e.target.value))
              }}
              placeholder="acme"
              pattern="[a-z0-9][a-z0-9-]*[a-z0-9]"
              className={`${inputCls} font-mono`}
            />
          </div>
        </Field>
        <Field label="Admin email (optional)">
          <input
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            placeholder="contact@acme.com"
            className={inputCls}
          />
        </Field>
      </Section>

      {/* Brand */}
      <Section title="Brand">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Primary color">
            <ColorInput value={primaryColor} onChange={setPrimaryColor} />
          </Field>
          <Field label="Accent color">
            <ColorInput value={accentColor} onChange={setAccentColor} />
          </Field>
        </div>
        <Field label="Logo (optional)" hint="Drop a transparent PNG. Leave blank to use a text logo.">
          <ImageUploader
            value={logoImage}
            onChange={setLogoImage}
            slug={slug}
            kind="logo"
            previewAspect="3/1"
            recommendation="Recommended: ~600 × 200 px PNG with transparent background. Up to 10 MB."
          />
        </Field>
        <Field label="Hero heading (optional)">
          <input
            value={heroHeading}
            onChange={(e) => setHeroHeading(e.target.value)}
            placeholder="Branded Signage for Every Location"
            className={inputCls}
          />
        </Field>
        <Field label="Hero subheading (optional)">
          <textarea
            value={heroSubheading}
            onChange={(e) => setHeroSubheading(e.target.value)}
            rows={2}
            placeholder="Order, approve, and track signage across all your locations…"
            className={inputCls}
          />
        </Field>
        <Field
          label="Hero background image (optional)"
          hint="Big photo behind the hero text. Wider-than-tall works best."
        >
          <ImageUploader
            value={heroBgImage}
            onChange={setHeroBgImage}
            slug={slug}
            kind="hero"
            previewAspect="21/9"
            recommendation="Recommended: 2400 × 1100 px (≈ 21:9). Min 1600 × 720. PNG, JPG, or WEBP. Up to 10 MB."
          />
        </Field>
      </Section>

      {/* Categories */}
      <Section
        title="Product categories"
        hint="Pick which categories this site should show. Leave all unchecked to show everything."
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
                <CategoryIcon name={cat.icon} size={16} strokeWidth={1.5} className={`shrink-0 ${on ? "text-blue-600" : "text-gray-400"}`} />
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

      {/* Imported product sets */}
      {availableImportTags.length > 0 && (
        <Section
          title="Imported product sets"
          hint="Optionally include products from a previous import batch."
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
                    on ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-gray-400 bg-white"
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" className={`w-4 h-4 shrink-0 ${on ? "text-blue-600" : "text-gray-400"}`}><path d="M20 7l-8-4-8 4m16 0v10l-8 4m-8-4V7m16 0l-8 4m-8-4l8 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span className="flex-1 min-w-0 text-sm font-mono font-semibold text-gray-900 truncate">{tag}</span>
                  <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${on ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}>
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
        </Section>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={busy || !name || !slug}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-lg"
        >
          {busy ? "Creating…" : "Create site"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/master")}
          className="text-sm text-gray-600 hover:text-gray-900 font-medium px-3 py-2.5"
        >
          Cancel
        </button>
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
