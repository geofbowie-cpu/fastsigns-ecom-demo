"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { DbProduct } from "@/lib/products-db"
import type { BankCategory } from "@/lib/product-bank"
import ImageUploader from "../_shared/ImageUploader"

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

// ─────────────────────────────────────────────────────────────
// Product form
// ─────────────────────────────────────────────────────────────

type ProductFormState = {
  slug: string
  name: string
  category: string
  short_desc: string
  starting_price: string
  unit: string
  import_tag: string
  image_url: string
  featured: boolean
  lead_time: string
  min_order_qty: string
  order_increment: string
}

function emptyForm(categories: BankCategory[]): ProductFormState {
  return {
    slug: "",
    name: "",
    category: categories[0]?.slug ?? "",
    short_desc: "",
    starting_price: "",
    unit: "",
    import_tag: "",
    image_url: "",
    featured: false,
    lead_time: "",
    min_order_qty: "",
    order_increment: "",
  }
}

function ProductForm({
  initial,
  categories,
  isEditing,
  onSaved,
  onCancel,
}: {
  initial: ProductFormState
  categories: BankCategory[]
  isEditing: boolean
  onSaved: (p: DbProduct) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<ProductFormState>(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const derivedSlug = form.slug.trim() || slugify(form.name)

  function set<K extends keyof ProductFormState>(k: K, v: ProductFormState[K]) {
    setForm((prev) => ({ ...prev, [k]: v }))
  }

  async function save() {
    setBusy(true)
    setError(null)
    try {
      const body: Record<string, unknown> = {
        slug: derivedSlug || undefined,
        name: form.name.trim(),
        category: form.category,
        short_desc: form.short_desc.trim() || undefined,
        starting_price: form.starting_price !== "" ? parseFloat(form.starting_price) : undefined,
        unit: form.unit.trim() || undefined,
        import_tag: form.import_tag.trim() || null,
        image_url: form.image_url.trim() || null,
        featured: form.featured,
        lead_time: form.lead_time.trim() || undefined,
        min_order_qty: form.min_order_qty !== "" ? parseInt(form.min_order_qty) : null,
        order_increment: form.order_increment !== "" ? parseInt(form.order_increment) : null,
      }
      const res = await fetch("/api/master/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? "Save failed"); return }
      onSaved(json as DbProduct)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const inputCls = "w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
      <h3 className="font-bold text-gray-900 text-sm">{isEditing ? "Edit product" : "New product"}</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Vinyl Banner"
            className={inputCls}
          />
          {derivedSlug && (
            <p className="text-[10px] text-gray-400 font-mono mt-0.5">slug: {derivedSlug}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            className={inputCls}
          >
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Slug</label>
          <input
            value={form.slug}
            onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            placeholder={slugify(form.name) || "auto-derived from name"}
            className={`${inputCls} font-mono`}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Short description</label>
          <input
            value={form.short_desc}
            onChange={(e) => set("short_desc", e.target.value)}
            placeholder="One-line product summary"
            className={inputCls}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Price ($)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.starting_price}
            onChange={(e) => set("starting_price", e.target.value)}
            placeholder="0.00"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Unit</label>
          <input
            value={form.unit}
            onChange={(e) => set("unit", e.target.value)}
            placeholder="per sq ft"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Lead time</label>
          <input
            value={form.lead_time}
            onChange={(e) => set("lead_time", e.target.value)}
            placeholder="3–5 business days"
            className={inputCls}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Minimum order qty <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            type="number"
            min={1}
            value={form.min_order_qty}
            onChange={(e) => set("min_order_qty", e.target.value)}
            placeholder="e.g. 100"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Pack increment <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            type="number"
            min={1}
            value={form.order_increment}
            onChange={(e) => set("order_increment", e.target.value)}
            placeholder="e.g. 100 (packs); blank = 1"
            className={inputCls}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Image</label>
          <ImageUploader
            value={form.image_url}
            onChange={(url) => set("image_url", url)}
            kind="logo"
            previewAspect="4/3"
            maxPreviewHeight={120}
            recommendation="PNG, JPG, or WEBP. Up to 10 MB."
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Import tag <span className="text-gray-400 font-normal">(blank = built-in global)</span>
          </label>
          <input
            value={form.import_tag}
            onChange={(e) => set("import_tag", e.target.value)}
            placeholder="site-my-client (blank = built-in)"
            className={`${inputCls} font-mono`}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="featured-check"
          type="checkbox"
          checked={form.featured}
          onChange={(e) => set("featured", e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="featured-check" className="text-sm text-gray-700 cursor-pointer">
          Featured product
        </label>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={save}
          disabled={busy || !form.name.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold px-4 py-2 rounded-lg"
        >
          {busy ? "Saving…" : isEditing ? "Save changes" : "Create product"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-gray-500 hover:text-gray-700 px-3 py-2"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Product row
// ─────────────────────────────────────────────────────────────

function ProductRow({
  product,
  categories,
  onSaved,
  onDeleted,
}: {
  product: DbProduct
  categories: BankCategory[]
  onSaved: (p: DbProduct) => void
  onDeleted: (slug: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const catName = categories.find((c) => c.slug === product.category)?.name ?? product.category

  async function del() {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/master/products?slug=${product.slug}`, { method: "DELETE" })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        alert(j.error ?? "Delete failed")
        return
      }
      onDeleted(product.slug)
    } finally {
      setDeleting(false)
    }
  }

  const initialForm: ProductFormState = {
    slug: product.slug,
    name: product.name,
    category: product.category,
    short_desc: product.shortDesc ?? "",
    starting_price: product.startingPrice > 0 ? String(product.startingPrice) : "",
    unit: product.unit ?? "",
    import_tag: product.import_tag ?? "",
    image_url: product.imageUrl ?? "",
    featured: product.featured ?? false,
    lead_time: product.leadTime ?? "",
    min_order_qty: product.minOrderQty ? String(product.minOrderQty) : "",
    order_increment: product.orderIncrement ? String(product.orderIncrement) : "",
  }

  if (editing) {
    return (
      <ProductForm
        initial={initialForm}
        categories={categories}
        isEditing
        onSaved={(p) => { onSaved(p); setEditing(false) }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  const gradFrom = product.gradientFrom ?? "#1e3a5f"
  const gradTo = product.gradientTo ?? "#2d6a9f"

  return (
    <div className="bg-white border border-gray-200 rounded-xl flex items-center gap-3 px-4 py-3">
      {/* Thumbnail */}
      <div className="shrink-0 w-10 h-10 rounded-lg overflow-hidden border border-gray-100">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-white text-xs font-bold"
            style={{ background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})` }}
          >
            {product.icon ?? "📦"}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-gray-900">{product.name}</span>
          <span className="text-[10px] font-mono text-gray-400">{product.slug}</span>
          {product.startingPrice > 0 && (
            <span className="text-xs text-gray-500">${product.startingPrice}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-semibold">
            {catName}
          </span>
          {product.import_tag ? (
            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-mono">
              {product.import_tag}
            </span>
          ) : (
            <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold">
              Built-in
            </span>
          )}
          {product.featured && (
            <span className="text-[10px] bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded-full font-semibold">
              ★ Featured
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => setEditing(true)}
          title="Edit"
          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          onClick={del}
          disabled={deleting}
          title="Delete"
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main products client
// ─────────────────────────────────────────────────────────────

export default function ProductsClient({
  initialProducts,
  categories,
}: {
  initialProducts: DbProduct[]
  categories: BankCategory[]
}) {
  const router = useRouter()
  const [products, setProducts] = useState<DbProduct[]>(initialProducts)
  const [search, setSearch] = useState("")
  const [showNew, setShowNew] = useState(false)

  const q = search.trim().toLowerCase()
  const filtered = q
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.import_tag ?? "").toLowerCase().includes(q)
      )
    : products

  // Group by category
  const catSlugs = Array.from(new Set(filtered.map((p) => p.category)))
  const catMap = new Map(categories.map((c) => [c.slug, c]))
  const grouped = catSlugs.map((slug) => ({
    cat: catMap.get(slug) ?? { slug, name: slug, icon: "Package", description: "" },
    products: filtered.filter((p) => p.category === slug),
  }))

  function handleSaved(updated: DbProduct) {
    setProducts((prev) => {
      const exists = prev.find((p) => p.slug === updated.slug)
      if (exists) return prev.map((p) => (p.slug === updated.slug ? updated : p))
      return [...prev, updated]
    })
    router.refresh()
  }

  function handleDeleted(slug: string) {
    setProducts((prev) => prev.filter((p) => p.slug !== slug))
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <svg viewBox="0 0 24 24" fill="none" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowNew((v) => !v)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shrink-0"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
            <path d="M12 4v16m8-8H4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          New product
        </button>
      </div>

      {/* New product form */}
      {showNew && (
        <ProductForm
          initial={emptyForm(categories)}
          categories={categories}
          isEditing={false}
          onSaved={(p) => { handleSaved(p); setShowNew(false) }}
          onCancel={() => setShowNew(false)}
        />
      )}

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span>{products.length} products total</span>
        <span>·</span>
        <span>{products.filter((p) => !p.import_tag).length} built-in</span>
        <span>·</span>
        <span>{products.filter((p) => p.import_tag).length} imported / site-specific</span>
      </div>

      {/* Grouped product list */}
      {grouped.length === 0 && (
        <div className="text-center py-16 text-gray-400 text-sm">
          {q ? `No products match "${search}"` : "No products yet."}
        </div>
      )}

      {grouped.map(({ cat, products: catProducts }) => (
        <div key={cat.slug} className="space-y-2">
          <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {cat.name}
            </h2>
            <span className="text-xs text-gray-400">{catProducts.length}</span>
          </div>
          <div className="space-y-1.5">
            {catProducts.map((p) => (
              <ProductRow
                key={p.slug}
                product={p}
                categories={categories}
                onSaved={handleSaved}
                onDeleted={handleDeleted}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
