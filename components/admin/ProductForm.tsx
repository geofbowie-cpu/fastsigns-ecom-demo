"use client"

import { useState, useRef } from "react"
import type { CSSProperties } from "react"
import { useRouter } from "next/navigation"
import { brand, categories } from "@/brand.config"
import type { Product } from "@/brand.config"
import { generateSlug, autoSku } from "@/lib/product-store"
import {
  Plus, X, RefreshCw, Upload, ImageOff, ArrowLeft, Save, Wand2
} from "lucide-react"

const GRADIENT_PRESETS = [
  { from: "#1e3a5f", to: "#2d6a9f", label: "Navy" },
  { from: "#0891b2", to: "#0e7490", label: "Teal" },
  { from: "#7c3aed", to: "#6d28d9", label: "Purple" },
  { from: "#065f46", to: "#047857", label: "Green" },
  { from: "#c2410c", to: "#ea580c", label: "Orange" },
  { from: "#374151", to: "#111827", label: "Charcoal" },
  { from: "#78350f", to: "#92400e", label: "Brown" },
  { from: "#312e81", to: "#4338ca", label: "Indigo" },
]

type Props = {
  initial?: Partial<Product>
  existingProducts: Product[]
  onSave: (product: Product) => void
  mode: "create" | "edit"
}

export default function ProductForm({ initial, existingProducts, onSave, mode }: Props) {
  const router = useRouter()

  const [name, setName] = useState(initial?.name ?? "")
  const [sku, setSku] = useState(initial?.sku ?? "")
  const [category, setCategory] = useState(initial?.category ?? categories[0].slug)
  const [shortDesc, setShortDesc] = useState(initial?.shortDesc ?? "")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [sizes, setSizes] = useState<string[]>(initial?.sizes ?? [""])
  const [materials, setMaterials] = useState<string[]>(initial?.materials ?? [""])
  const [tags, setTags] = useState<string[]>(initial?.tags ?? [])
  const [tagInput, setTagInput] = useState("")
  const [startingPrice, setStartingPrice] = useState(String(initial?.startingPrice ?? ""))
  const [unit, setUnit] = useState(initial?.unit ?? "per unit")
  const [leadTime, setLeadTime] = useState(initial?.leadTime ?? "5–7 business days")
  const [imageUrl, setImageUrl] = useState<string | undefined>(initial?.imageUrl)
  const [imagePosition, setImagePosition] = useState(initial?.imagePosition ?? { x: 50, y: 50 })
  const [imageZoom, setImageZoom] = useState(initial?.imageZoom ?? 1)
  const isDragging = useRef(false)
  const dragStart = useRef<{ clientX: number; clientY: number; posX: number; posY: number } | null>(null)
  const [gradientFrom, setGradientFrom] = useState(initial?.gradientFrom ?? "#1e3a5f")
  const [gradientTo, setGradientTo] = useState(initial?.gradientTo ?? "#2d6a9f")
  const [icon, setIcon] = useState(initial?.icon ?? "📦")
  const [featured, setFeatured] = useState(initial?.featured ?? false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Image drag-to-reposition ──────────────────────────────
  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    isDragging.current = true
    dragStart.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      posX: imagePosition.x,
      posY: imagePosition.y,
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging.current || !dragStart.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const deltaX = ((e.clientX - dragStart.current.clientX) / rect.width) * 100
    const deltaY = ((e.clientY - dragStart.current.clientY) / rect.height) * 100
    setImagePosition({
      x: Math.max(0, Math.min(100, dragStart.current.posX - deltaX)),
      y: Math.max(0, Math.min(100, dragStart.current.posY - deltaY)),
    })
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.releasePointerCapture(e.pointerId)
    isDragging.current = false
    dragStart.current = null
  }

  // ── Image upload ──────────────────────────────────────────
  function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 4 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, image: "Image must be under 4 MB" }))
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setImageUrl(ev.target?.result as string)
      setErrors((prev) => { const n = { ...prev }; delete n.image; return n })
    }
    reader.readAsDataURL(file)
    // Reset input so re-selecting same file still fires
    e.target.value = ""
  }

  // ── Dynamic list helpers ──────────────────────────────────
  function updateList(list: string[], setList: (v: string[]) => void, i: number, val: string) {
    const updated = [...list]
    updated[i] = val
    setList(updated)
  }
  function removeFromList(list: string[], setList: (v: string[]) => void, i: number) {
    setList(list.filter((_, idx) => idx !== i))
  }
  function addTag() {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) setTags([...tags, t])
    setTagInput("")
  }

  // ── Validation & submit ───────────────────────────────────
  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = "Name is required"
    if (!sku.trim()) e.sku = "SKU is required"
    if (!startingPrice || isNaN(Number(startingPrice))) e.price = "Valid price required"
    return e
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    const slug = initial?.slug ?? generateSlug(name, existingProducts)

    const product: Product = {
      slug,
      name: name.trim(),
      sku: sku.trim(),
      category,
      shortDesc: shortDesc.trim(),
      description: description.trim(),
      sizes: sizes.filter(Boolean),
      materials: materials.filter(Boolean),
      tags,
      startingPrice: Number(startingPrice),
      unit: unit.trim(),
      leadTime: leadTime.trim(),
      imageUrl: imageUrl || undefined,
      imagePosition: imageUrl ? imagePosition : undefined,
      imageZoom: imageUrl ? imageZoom : undefined,
      gradientFrom,
      gradientTo,
      icon,
      featured,
    }

    setTimeout(() => {
      onSave(product)
      router.push("/admin/products")
    }, 300)
  }

  // ── Field component helpers ───────────────────────────────
  function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
        {children}
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    )
  }

  const inputCls = "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:border-gray-500 transition-colors"

  return (
    <form onSubmit={handleSubmit} className="flex-1 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900">
              {mode === "create" ? "New Product" : "Edit Product"}
            </h1>
            {initial?.slug && (
              <p className="text-xs text-gray-400 mt-0.5 font-mono">{initial.slug}</p>
            )}
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white hover:opacity-90 disabled:opacity-60 transition-all"
          style={{ backgroundColor: brand.primaryColor }}
        >
          {saving ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={15} />
          )}
          {saving ? "Saving…" : "Save Product"}
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── Left column (2/3) ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Basic info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wider text-gray-400">Basic Info</h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Product Name *" error={errors.name}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Retractable Banner Stand"
                  className={inputCls}
                />
              </Field>

              <Field label="SKU *" error={errors.sku}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    placeholder="e.g. BAN-0012"
                    className={`${inputCls} font-mono`}
                  />
                  <button
                    type="button"
                    onClick={() => setSku(autoSku(category))}
                    className="px-2.5 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 transition-colors flex-shrink-0"
                    title="Auto-generate SKU"
                  >
                    <Wand2 size={14} />
                  </button>
                </div>
              </Field>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Category">
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                  {categories.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Featured on Homepage">
                <div className="flex items-center gap-3 h-[38px]">
                  <button
                    type="button"
                    onClick={() => setFeatured(!featured)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${featured ? "bg-yellow-400" : "bg-gray-200"}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${featured ? "translate-x-5" : ""}`}
                    />
                  </button>
                  <span className="text-sm text-gray-600">{featured ? "Yes — shows on homepage" : "No"}</span>
                </div>
              </Field>
            </div>

            <Field label="Short Description">
              <input
                type="text"
                value={shortDesc}
                onChange={(e) => setShortDesc(e.target.value)}
                placeholder="One-line summary shown on product cards"
                className={inputCls}
              />
            </Field>

            <Field label="Full Description">
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed product description shown on the product page"
                className={`${inputCls} resize-none`}
              />
            </Field>
          </div>

          {/* Options */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <h2 className="font-bold text-sm uppercase tracking-wider text-gray-400">Sizes & Options</h2>

            {/* Sizes */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Sizes</label>
              <div className="space-y-2">
                {sizes.map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={s}
                      onChange={(e) => updateList(sizes, setSizes, i, e.target.value)}
                      placeholder={`e.g. 3' x 6'`}
                      className={inputCls}
                    />
                    <button
                      type="button"
                      onClick={() => removeFromList(sizes, setSizes, i)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setSizes([...sizes, ""])}
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <Plus size={14} /> Add size
                </button>
              </div>
            </div>

            {/* Materials */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Materials</label>
              <div className="space-y-2">
                {materials.map((m, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={m}
                      onChange={(e) => updateList(materials, setMaterials, i, e.target.value)}
                      placeholder="e.g. 13 oz. Scrim Vinyl"
                      className={inputCls}
                    />
                    <button
                      type="button"
                      onClick={() => removeFromList(materials, setMaterials, i)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setMaterials([...materials, ""])}
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <Plus size={14} /> Add material
                </button>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Tags</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => setTags(tags.filter((tag) => tag !== t))}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag() } }}
                  placeholder="Type a tag and press Enter"
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-3 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right column (1/3) ── */}
        <div className="space-y-6">

          {/* Image */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-sm uppercase tracking-wider text-gray-400 mb-4">Product Image</h2>

            {errors.image && (
              <p className="text-xs text-red-500 mb-3">{errors.image}</p>
            )}

            {imageUrl ? (
              <div>
                {/* Drag-to-reposition preview */}
                <div
                  className="w-full h-48 rounded-xl overflow-hidden mb-1 border border-gray-100 relative select-none"
                  style={{ cursor: isDragging.current ? "grabbing" : "grab" }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                >
                  <img
                    src={imageUrl}
                    alt="Product"
                    className="w-full h-full object-cover pointer-events-none"
                    style={{
                      objectPosition: `${imagePosition.x}% ${imagePosition.y}%`,
                      transform: `scale(${imageZoom})`,
                      transformOrigin: `${imagePosition.x}% ${imagePosition.y}%`,
                    }}
                    draggable={false}
                  />
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full pointer-events-none">
                    Drag to reposition
                  </div>
                </div>

                {/* Zoom slider */}
                <div className="flex items-center gap-2 mt-3 px-1">
                  <span className="text-[10px] text-gray-400 w-5 text-right">1×</span>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.05"
                    value={imageZoom}
                    onChange={(e) => setImageZoom(Number(e.target.value))}
                    className="flex-1 h-1.5 accent-gray-700 cursor-pointer"
                  />
                  <span className="text-[10px] text-gray-400 w-5">3×</span>
                </div>
                <p className="text-xs text-gray-400 text-center mt-1 mb-3">
                  Zoom: {imageZoom.toFixed(2)}× · Focus: {Math.round(imagePosition.x)}% / {Math.round(imagePosition.y)}%
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <RefreshCw size={12} /> Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => { setImageUrl(undefined); setImagePosition({ x: 50, y: 50 }); setImageZoom(1) }}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <ImageOff size={12} /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* Preview of gradient fallback */}
                <div
                  className="w-full h-48 rounded-xl flex flex-col items-center justify-center mb-3 border border-gray-100"
                  style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
                >
                  <span className="text-5xl">{icon}</span>
                  <span className="text-white/50 text-xs mt-2">Gradient placeholder</span>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
                >
                  <Upload size={15} /> Upload Image
                </button>
                <p className="text-xs text-gray-400 text-center mt-1.5">
                  JPG, PNG, WebP · Max 4 MB
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageFile}
              className="hidden"
            />
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-bold text-sm uppercase tracking-wider text-gray-400">Pricing & Fulfillment</h2>

            <Field label="Starting Price *" error={errors.price}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={startingPrice}
                  onChange={(e) => setStartingPrice(e.target.value)}
                  className={`${inputCls} pl-7`}
                  placeholder="0.00"
                />
              </div>
            </Field>

            <Field label="Unit Label">
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. per banner"
                className={inputCls}
              />
            </Field>

            <Field label="Lead Time">
              <input
                type="text"
                value={leadTime}
                onChange={(e) => setLeadTime(e.target.value)}
                placeholder="e.g. 3–5 business days"
                className={inputCls}
              />
            </Field>
          </div>

          {/* Display */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-bold text-sm uppercase tracking-wider text-gray-400">
              Fallback Display
              <span className="normal-case font-normal text-gray-300 ml-1">(when no image)</span>
            </h2>

            <Field label="Icon (emoji)">
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className={`${inputCls} text-xl`}
                maxLength={4}
              />
            </Field>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Gradient Preset</label>
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {GRADIENT_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => { setGradientFrom(p.from); setGradientTo(p.to) }}
                    className={`h-8 rounded-lg transition-all ${
                      gradientFrom === p.from ? "ring-2 ring-offset-1 ring-gray-800" : ""
                    }`}
                    style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
                    title={p.label}
                  />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">From</label>
                  <input type="color" value={gradientFrom} onChange={(e) => setGradientFrom(e.target.value)}
                    className="w-full h-9 rounded-lg border border-gray-300 cursor-pointer p-0.5" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">To</label>
                  <input type="color" value={gradientTo} onChange={(e) => setGradientTo(e.target.value)}
                    className="w-full h-9 rounded-lg border border-gray-300 cursor-pointer p-0.5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
