"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { BankCategory } from "@/lib/product-bank"
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
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
