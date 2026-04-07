"use client"

import { useState, useRef, useEffect } from "react"
import { useBrandStore } from "@/lib/brand-store"
import type { BrandOverrides } from "@/lib/brand-store"
import { brand as D } from "@/brand.config"
import { Save, RotateCcw, Upload, ImageOff, CheckCircle, RefreshCw } from "lucide-react"

// ─────────────────────────────────────────────────────────────
// Field helper — MUST be outside the page component so React
// doesn't treat it as a new type on every render (which would
// unmount/remount inputs and lose focus after one character).
// ─────────────────────────────────────────────────────────────
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
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

const INPUT = "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:border-gray-500 transition-colors outline-none"
const CARD = "bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4"

// ─────────────────────────────────────────────────────────────
// Settings page
// ─────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { overrides, save, reset, saved } = useBrandStore()
  const [confirmReset, setConfirmReset] = useState(false)
  const logoRef = useRef<HTMLInputElement>(null)
  const heroImgRef = useRef<HTMLInputElement>(null)

  // ── form state ───────────────────────────────────────────
  const [company, setCompany] = useState(overrides.company ?? D.company)
  const [tagline, setTagline] = useState(overrides.tagline ?? D.tagline)
  const [logoText, setLogoText] = useState(overrides.logoText ?? D.logoText)
  const [logoImage, setLogoImage] = useState<string | null | undefined>(overrides.logoImage)

  const [navBgColor, setNavBgColor] = useState(overrides.navBgColor ?? D.primaryColor)
  const [navTextColor, setNavTextColor] = useState(overrides.navTextColor ?? "#ffffff")

  const [primaryColor, setPrimaryColor] = useState(overrides.primaryColor ?? D.primaryColor)
  const [accentColor, setAccentColor] = useState(overrides.accentColor ?? D.accentColor)

  const [heroBgImage, setHeroBgImage] = useState<string | null | undefined>(overrides.heroBgImage)
  const [heroBgOverlay, setHeroBgOverlay] = useState(overrides.heroBgOverlay ?? 0.5)
  const [heroGradientFrom, setHeroGradientFrom] = useState(overrides.heroGradientFrom ?? D.primaryDark)
  const [heroGradientTo, setHeroGradientTo] = useState(overrides.heroGradientTo ?? D.primaryColor)

  const [heroHeading, setHeroHeading] = useState(overrides.heroHeading ?? D.heroHeading)
  const [heroSubheading, setHeroSubheading] = useState(overrides.heroSubheading ?? D.heroSubheading)
  const [heroCta1Text, setHeroCta1Text] = useState(overrides.heroCta1Text ?? D.heroCtaText ?? "Shop Now")
  const [heroCta1Url, setHeroCta1Url] = useState(overrides.heroCta1Url ?? "/products")
  const [heroCta1Color, setHeroCta1Color] = useState(overrides.heroCta1Color ?? D.accentColor)
  const [heroCta2Text, setHeroCta2Text] = useState(overrides.heroCta2Text ?? "Trade Show Displays")
  const [heroCta2Url, setHeroCta2Url] = useState(overrides.heroCta2Url ?? "/products?category=trade-show")

  const [trustBadge1, setTrustBadge1] = useState(overrides.trustBadge1 ?? "Fortune 500 Trusted")
  const [trustBadge2, setTrustBadge2] = useState(overrides.trustBadge2 ?? "2-Year Warranty")
  const [trustBadge3, setTrustBadge3] = useState(overrides.trustBadge3 ?? "Nationwide Installation")
  const [trustBadge4, setTrustBadge4] = useState(overrides.trustBadge4 ?? "Net 30 / PO Accepted")

  const [catSectionHeading, setCatSectionHeading] = useState(overrides.catSectionHeading ?? "Shop by Category")
  const [catSectionSubheading, setCatSectionSubheading] = useState(overrides.catSectionSubheading ?? "Everything your locations need, in one place")
  const [featuredSectionHeading, setFeaturedSectionHeading] = useState(overrides.featuredSectionHeading ?? "Most Ordered")
  const [featuredSectionSubheading, setFeaturedSectionSubheading] = useState(overrides.featuredSectionSubheading ?? `Top products across ${D.company} locations`)

  const [enterpriseHeading, setEnterpriseHeading] = useState(overrides.enterpriseHeading ?? "Connects to your procurement system")
  const [enterpriseBody, setEnterpriseBody] = useState(overrides.enterpriseBody ?? "This storefront integrates directly with enterprise procurement platforms — COUPA, SAP Ariba, Oracle, and others. PO numbers, cost center coding, and approval routing happen right at checkout. No shadow spend. No rogue ordering.")
  const [enterpriseCtaText, setEnterpriseCtaText] = useState(overrides.enterpriseCtaText ?? "Start an order")

  // Re-sync when overrides change externally (reset)
  useEffect(() => {
    setCompany(overrides.company ?? D.company)
    setTagline(overrides.tagline ?? D.tagline)
    setLogoText(overrides.logoText ?? D.logoText)
    setLogoImage(overrides.logoImage)
    setNavBgColor(overrides.navBgColor ?? D.primaryColor)
    setNavTextColor(overrides.navTextColor ?? "#ffffff")
    setPrimaryColor(overrides.primaryColor ?? D.primaryColor)
    setAccentColor(overrides.accentColor ?? D.accentColor)
    setHeroBgImage(overrides.heroBgImage)
    setHeroBgOverlay(overrides.heroBgOverlay ?? 0.5)
    setHeroGradientFrom(overrides.heroGradientFrom ?? D.primaryDark)
    setHeroGradientTo(overrides.heroGradientTo ?? D.primaryColor)
    setHeroHeading(overrides.heroHeading ?? D.heroHeading)
    setHeroSubheading(overrides.heroSubheading ?? D.heroSubheading)
    setHeroCta1Text(overrides.heroCta1Text ?? D.heroCtaText ?? "Shop Now")
    setHeroCta1Url(overrides.heroCta1Url ?? "/products")
    setHeroCta1Color(overrides.heroCta1Color ?? D.accentColor)
    setHeroCta2Text(overrides.heroCta2Text ?? "Trade Show Displays")
    setHeroCta2Url(overrides.heroCta2Url ?? "/products?category=trade-show")
    setTrustBadge1(overrides.trustBadge1 ?? "Fortune 500 Trusted")
    setTrustBadge2(overrides.trustBadge2 ?? "2-Year Warranty")
    setTrustBadge3(overrides.trustBadge3 ?? "Nationwide Installation")
    setTrustBadge4(overrides.trustBadge4 ?? "Net 30 / PO Accepted")
    setCatSectionHeading(overrides.catSectionHeading ?? "Shop by Category")
    setCatSectionSubheading(overrides.catSectionSubheading ?? "Everything your locations need, in one place")
    setFeaturedSectionHeading(overrides.featuredSectionHeading ?? "Most Ordered")
    setFeaturedSectionSubheading(overrides.featuredSectionSubheading ?? `Top products across ${D.company} locations`)
    setEnterpriseHeading(overrides.enterpriseHeading ?? "Connects to your procurement system")
    setEnterpriseBody(overrides.enterpriseBody ?? "This storefront integrates directly with enterprise procurement platforms — COUPA, SAP Ariba, Oracle, and others. PO numbers, cost center coding, and approval routing happen right at checkout. No shadow spend. No rogue ordering.")
    setEnterpriseCtaText(overrides.enterpriseCtaText ?? "Start an order")
  }, [overrides]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── file uploads ─────────────────────────────────────────
  function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > 2 * 1024 * 1024) { alert("Logo must be under 2 MB"); return }
    const r = new FileReader()
    r.onload = (ev) => setLogoImage(ev.target?.result as string)
    r.readAsDataURL(file); e.target.value = ""
  }

  function handleHeroFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert("Hero image must be under 5 MB"); return }
    const r = new FileReader()
    r.onload = (ev) => setHeroBgImage(ev.target?.result as string)
    r.readAsDataURL(file); e.target.value = ""
  }

  // ── save ─────────────────────────────────────────────────
  function handleSave() {
    const u: BrandOverrides = {
      company, tagline, logoText,
      ...(logoImage !== undefined ? { logoImage } : {}),
      navBgColor, navTextColor,
      primaryColor, accentColor,
      ...(heroBgImage !== undefined ? { heroBgImage } : {}),
      heroBgOverlay, heroGradientFrom, heroGradientTo,
      heroHeading, heroSubheading,
      heroCta1Text, heroCta1Url, heroCta1Color,
      heroCta2Text, heroCta2Url,
      trustBadge1, trustBadge2, trustBadge3, trustBadge4,
      catSectionHeading, catSectionSubheading,
      featuredSectionHeading, featuredSectionSubheading,
      enterpriseHeading, enterpriseBody, enterpriseCtaText,
    }
    save(u)
  }

  // ── preview hero style ────────────────────────────────────
  const heroPreviewStyle = heroBgImage
    ? { backgroundImage: `url(${heroBgImage})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: `linear-gradient(135deg, ${heroGradientFrom}, ${heroGradientTo})` }

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Brand Settings</h1>
          <p className="text-gray-500 text-sm mt-0.5">Changes apply to the storefront immediately after saving</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setConfirmReset(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <RotateCcw size={14} /> Reset to defaults
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white hover:opacity-90 transition-all"
            style={{ backgroundColor: primaryColor }}
          >
            {saved ? <CheckCircle size={15} /> : <Save size={15} />}
            {saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </div>

      {confirmReset && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <p className="text-sm text-red-700">Reset all brand settings to defaults?</p>
          <div className="flex gap-2 ml-4 flex-shrink-0">
            <button onClick={() => { reset(); setConfirmReset(false) }} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700">Reset</button>
            <button onClick={() => setConfirmReset(false)} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── LEFT: all copy ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Brand Identity */}
          <div className={CARD}>
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Brand Identity</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Company Name">
                <input type="text" value={company} onChange={e => setCompany(e.target.value)} className={INPUT} />
              </Field>
              <Field label="Tagline" hint="Shown next to logo in nav">
                <input type="text" value={tagline} onChange={e => setTagline(e.target.value)} className={INPUT} />
              </Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 items-start">
              <Field label="Logo Text" hint="Shown when no logo image is uploaded">
                <input type="text" value={logoText} onChange={e => setLogoText(e.target.value)} className={`${INPUT} font-black tracking-widest`} />
              </Field>
              <Field label="Logo Image" hint="PNG or SVG · Max 2 MB">
                {logoImage ? (
                  <div>
                    <div className="h-12 rounded-lg border border-gray-200 flex items-center px-3 mb-2 bg-gray-50">
                      <img src={logoImage} alt="Logo" className="h-8 w-auto max-w-full object-contain" />
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => logoRef.current?.click()} className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                        <RefreshCw size={11} /> Replace
                      </button>
                      <button type="button" onClick={() => setLogoImage(null)} className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50">
                        <ImageOff size={11} /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => logoRef.current?.click()} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-dashed border-gray-200 text-sm text-gray-500 hover:border-gray-400 transition-colors">
                    <Upload size={14} /> Upload Logo
                  </button>
                )}
                <input ref={logoRef} type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp" onChange={handleLogoFile} className="hidden" />
              </Field>
            </div>
          </div>

          {/* Hero Copy */}
          <div className={CARD}>
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Hero Copy</h2>
            <Field label="Heading">
              <input type="text" value={heroHeading} onChange={e => setHeroHeading(e.target.value)} className={INPUT} />
            </Field>
            <Field label="Subheading">
              <textarea rows={3} value={heroSubheading} onChange={e => setHeroSubheading(e.target.value)} className={`${INPUT} resize-none`} />
            </Field>
            {/* CTA 1 */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Primary Button</p>
              <div className="grid sm:grid-cols-3 gap-3 items-end">
                <Field label="Text">
                  <input type="text" value={heroCta1Text} onChange={e => setHeroCta1Text(e.target.value)} className={INPUT} />
                </Field>
                <Field label="URL">
                  <input type="text" value={heroCta1Url} onChange={e => setHeroCta1Url(e.target.value)} className={INPUT} placeholder="/products" />
                </Field>
                <Field label="Color">
                  <div className="flex items-center gap-2">
                    <input type="color" value={heroCta1Color} onChange={e => setHeroCta1Color(e.target.value)} className="w-10 h-9 rounded border border-gray-300 cursor-pointer p-0.5 flex-shrink-0" />
                    <input type="text" value={heroCta1Color} onChange={e => setHeroCta1Color(e.target.value)} className={`${INPUT} font-mono uppercase`} maxLength={7} />
                  </div>
                </Field>
              </div>
            </div>
            {/* CTA 2 */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Secondary Button <span className="font-normal text-gray-400">(ghost style · leave blank to hide)</span></p>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Text">
                  <input type="text" value={heroCta2Text} onChange={e => setHeroCta2Text(e.target.value)} className={INPUT} placeholder="Leave blank to hide" />
                </Field>
                <Field label="URL">
                  <input type="text" value={heroCta2Url} onChange={e => setHeroCta2Url(e.target.value)} className={INPUT} placeholder="/products" />
                </Field>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Trust Badges (below CTA)</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {[
                  [trustBadge1, setTrustBadge1],
                  [trustBadge2, setTrustBadge2],
                  [trustBadge3, setTrustBadge3],
                  [trustBadge4, setTrustBadge4],
                ].map(([val, setter], i) => (
                  <input
                    key={i}
                    type="text"
                    value={val as string}
                    onChange={e => (setter as (v: string) => void)(e.target.value)}
                    className={INPUT}
                    placeholder={`Badge ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Homepage Sections */}
          <div className={CARD}>
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Homepage Section Headings</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Category Section — Heading">
                <input type="text" value={catSectionHeading} onChange={e => setCatSectionHeading(e.target.value)} className={INPUT} />
              </Field>
              <Field label="Category Section — Subheading">
                <input type="text" value={catSectionSubheading} onChange={e => setCatSectionSubheading(e.target.value)} className={INPUT} />
              </Field>
              <Field label="Featured Section — Heading">
                <input type="text" value={featuredSectionHeading} onChange={e => setFeaturedSectionHeading(e.target.value)} className={INPUT} />
              </Field>
              <Field label="Featured Section — Subheading">
                <input type="text" value={featuredSectionSubheading} onChange={e => setFeaturedSectionSubheading(e.target.value)} className={INPUT} />
              </Field>
            </div>
          </div>

          {/* Enterprise Callout */}
          <div className={CARD}>
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Enterprise Callout Block</h2>
            <Field label="Heading">
              <input type="text" value={enterpriseHeading} onChange={e => setEnterpriseHeading(e.target.value)} className={INPUT} />
            </Field>
            <Field label="Body Text">
              <textarea rows={4} value={enterpriseBody} onChange={e => setEnterpriseBody(e.target.value)} className={`${INPUT} resize-none`} />
            </Field>
            <Field label="CTA Button">
              <input type="text" value={enterpriseCtaText} onChange={e => setEnterpriseCtaText(e.target.value)} className={INPUT} />
            </Field>
          </div>
        </div>

        {/* ── RIGHT: visual controls ── */}
        <div className="space-y-6">

          {/* Navigation */}
          <div className={CARD}>
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Navigation Bar</h2>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Background Color</label>
              <div className="flex items-center gap-3">
                <input type="color" value={navBgColor} onChange={e => setNavBgColor(e.target.value)} className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5 flex-shrink-0" />
                <input type="text" value={navBgColor} onChange={e => setNavBgColor(e.target.value)} className={`${INPUT} font-mono uppercase`} maxLength={7} />
              </div>
              <p className="text-xs text-gray-400 mt-1">Independent of brand primary color</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Text / Logo Color</label>
              <div className="flex items-center gap-3">
                <input type="color" value={navTextColor} onChange={e => setNavTextColor(e.target.value)} className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5 flex-shrink-0" />
                <input type="text" value={navTextColor} onChange={e => setNavTextColor(e.target.value)} className={`${INPUT} font-mono uppercase`} maxLength={7} />
              </div>
              <div className="flex gap-2 mt-2">
                {["#ffffff", "#111827", "#1e3a5f", "#000000"].map(c => (
                  <button key={c} type="button" onClick={() => setNavTextColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${navTextColor === c ? "border-gray-700 scale-110" : "border-gray-200"}`}
                    style={{ backgroundColor: c }} title={c} />
                ))}
              </div>
            </div>
            {/* Nav preview */}
            <div className="rounded-lg overflow-hidden border border-gray-100">
              <div className="px-4 py-2.5 flex items-center justify-between" style={{ backgroundColor: navBgColor }}>
                {logoImage
                  ? <img src={logoImage} alt="logo" className="h-6 w-auto object-contain" />
                  : <span className="font-black text-sm tracking-widest" style={{ color: navTextColor }}>{logoText || "LOGO"}</span>
                }
                <span className="text-xs font-medium px-3 py-1 rounded border" style={{ color: navTextColor, borderColor: navTextColor + "66" }}>Sign In</span>
              </div>
            </div>
          </div>

          {/* Brand Colors */}
          <div className={CARD}>
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Brand Colors</h2>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Primary Color</label>
              <div className="flex items-center gap-3">
                <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5 flex-shrink-0" />
                <input type="text" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className={`${INPUT} font-mono uppercase`} maxLength={7} />
              </div>
              <p className="text-xs text-gray-400 mt-1">Buttons, hero gradient base</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Accent Color</label>
              <div className="flex items-center gap-3">
                <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5 flex-shrink-0" />
                <input type="text" value={accentColor} onChange={e => setAccentColor(e.target.value)} className={`${INPUT} font-mono uppercase`} maxLength={7} />
              </div>
              <p className="text-xs text-gray-400 mt-1">CTA buttons, badges, highlights</p>
            </div>
          </div>

          {/* Hero Background */}
          <div className={CARD}>
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Hero Background</h2>

            {/* Preview */}
            <div className="relative w-full h-24 rounded-xl overflow-hidden border border-gray-100" style={heroPreviewStyle}>
              {heroBgImage && (
                <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${heroBgOverlay})` }} />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-xs font-bold drop-shadow">Hero Preview</span>
              </div>
            </div>

            {/* Image upload */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Background Image</p>
              {heroBgImage ? (
                <div className="flex gap-2">
                  <button type="button" onClick={() => heroImgRef.current?.click()} className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                    <RefreshCw size={11} /> Replace
                  </button>
                  <button type="button" onClick={() => setHeroBgImage(null)} className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50">
                    <ImageOff size={11} /> Remove
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => heroImgRef.current?.click()} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border-2 border-dashed border-gray-200 text-sm text-gray-500 hover:border-gray-400 transition-colors">
                  <Upload size={13} /> Upload Image
                </button>
              )}
              <input ref={heroImgRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleHeroFile} className="hidden" />
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP · Max 5 MB</p>
            </div>

            {/* Overlay (when image) */}
            {heroBgImage && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  Dark Overlay — {Math.round(heroBgOverlay * 100)}%
                </label>
                <input type="range" min="0" max="0.85" step="0.05" value={heroBgOverlay}
                  onChange={e => setHeroBgOverlay(Number(e.target.value))}
                  className="w-full h-1.5 accent-gray-700 cursor-pointer" />
                <p className="text-xs text-gray-400 mt-1">Controls text readability over the image</p>
              </div>
            )}

            {/* Gradient (when no image) */}
            {!heroBgImage && (
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Gradient Colors</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">From</p>
                    <div className="flex items-center gap-2">
                      <input type="color" value={heroGradientFrom} onChange={e => setHeroGradientFrom(e.target.value)} className="w-9 h-9 rounded border border-gray-300 cursor-pointer p-0.5 flex-shrink-0" />
                      <input type="text" value={heroGradientFrom} onChange={e => setHeroGradientFrom(e.target.value)} className={`${INPUT} font-mono text-xs uppercase`} maxLength={7} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">To</p>
                    <div className="flex items-center gap-2">
                      <input type="color" value={heroGradientTo} onChange={e => setHeroGradientTo(e.target.value)} className="w-9 h-9 rounded border border-gray-300 cursor-pointer p-0.5 flex-shrink-0" />
                      <input type="text" value={heroGradientTo} onChange={e => setHeroGradientTo(e.target.value)} className={`${INPUT} font-mono text-xs uppercase`} maxLength={7} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
