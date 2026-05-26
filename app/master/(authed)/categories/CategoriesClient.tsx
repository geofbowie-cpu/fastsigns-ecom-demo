"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { BankCategory } from "@/lib/product-bank"
import type { DbProduct } from "@/lib/products-db"
import ImageUploader from "../_shared/ImageUploader"

const ICONS = [
  "Flag", "Layers", "Monitor", "Car", "Navigation", "Gift",
  "Tag", "Compass", "Star", "Palette", "Package",
]

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

type CategoryWithExtras = BankCategory & {
  imageUrl?: string
  productSlugs?: string[]
}

// ─────────────────────────────────────────────────────────────
// Category row
// ─────────────────────────────────────────────────────────────
function CategoryRow({
  cat,
  allProducts,
  onSaved,
  onDeleted,
}: {
  cat: CategoryWithExtras
  allProducts: DbProduct[]
  onSaved: (c: CategoryWithExtras) => void
  onDeleted: (slug: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(cat.name)
  const [icon, setIcon] = useState(cat.icon ?? "Package")
  const [description, setDescription] = useState(cat.description ?? "")
  const [imageUrl, setImageUrl] = useState(cat.imageUrl ?? "")
  const [productSlugs, setProductSlugs] = useState<Set<string>>(
    new Set(cat.productSlugs ?? [])
  )
  const [productSearch, setProductSearch] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isCustom = (cat.productSlugs?.length ?? 0) > 0 || productSlugs.size > 0

  const filteredProducts = allProducts.filter((p) => {
    if (!productSearch.trim()) return true
    const q = productSearch.toLowerCase()
    return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
  })

  async function save() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/master/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: cat.slug,
          name: name.trim(),
          icon,
          description: description.trim(),
          image_url: imageUrl.trim() || null,
          product_slugs: Array.from(productSlugs),
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? "Save failed"); return }
      onSaved({ ...json, productSlugs: json.productSlugs ?? [] })
      setEditing(false)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function del() {
    if (!confirm(`Delete category "${cat.name}"? This cannot be undone.`)) return
    setBusy(true)
    try {
      const res = await fetch(`/api/master/categories?slug=${cat.slug}`, { method: "DELETE" })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setError(j.error ?? "Delete failed")
        return
      }
      onDeleted(cat.slug)
    } finally {
      setBusy(false)
    }
  }

  function toggleProduct(slug: string) {
    setProductSlugs((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 p-4">
        {cat.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cat.imageUrl} alt={cat.name} className="w-12 h-12 rounded-lg object-cover shrink-0 border border-gray-100" />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
            <span className="text-xl text-gray-400">📁</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 text-sm">{cat.name}</span>
            {(cat.productSlugs?.length ?? 0) > 0 && (
              <span className="text-[10px] font-semibold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
                Custom · {cat.productSlugs!.length} products
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400 font-mono mt-0.5">{cat.slug}</div>
          {cat.description && (
            <div className="text-xs text-gray-500 mt-0.5 truncate">{cat.description}</div>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            {editing ? "Collapse" : "Edit"}
          </button>
          <button
            type="button"
            onClick={del}
            disabled={busy}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-red-100 text-red-500 hover:border-red-300 hover:bg-red-50 transition-colors disabled:opacity-40"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Edit panel */}
      {editing && (
        <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Icon</label>
              <select
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ICONS.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description shown on category pages"
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Category image</label>
            <ImageUploader
              value={imageUrl}
              onChange={setImageUrl}
              kind="category"
              recommendation="800 × 500 px, JPG or WEBP"
              previewAspect="8/5"
              maxPreviewHeight={100}
            />
          </div>

          {/* Product picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-600">
                Product assignments{" "}
                <span className="font-normal text-gray-400">(optional — leave empty to use automatic category matching)</span>
              </label>
              {productSlugs.size > 0 && (
                <span className="text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full font-semibold">
                  {productSlugs.size} selected
                </span>
              )}
            </div>
            <input
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Filter products…"
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
              {filteredProducts.map((p) => {
                const on = productSlugs.has(p.slug)
                return (
                  <label
                    key={p.slug}
                    className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 ${on ? "bg-blue-50" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggleProduct(p.slug)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-gray-800 truncate">{p.name}</div>
                      <div className="text-[10px] text-gray-400 font-mono truncate">
                        {p.category} · {p.slug}
                      </div>
                    </div>
                  </label>
                )
              })}
              {filteredProducts.length === 0 && (
                <div className="px-3 py-4 text-xs text-gray-400 text-center">No products match.</div>
              )}
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={save}
              disabled={busy || !name.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold px-4 py-2 rounded-lg"
            >
              {busy ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-xs text-gray-500 hover:text-gray-700 px-3 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// New category form
// ─────────────────────────────────────────────────────────────
function NewCategoryForm({
  allProducts,
  onCreated,
}: {
  allProducts: DbProduct[]
  onCreated: (c: CategoryWithExtras) => void
}) {
  const [name, setName] = useState("")
  const [icon, setIcon] = useState("Package")
  const [description, setDescription] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [productSlugs, setProductSlugs] = useState<Set<string>>(new Set())
  const [productSearch, setProductSearch] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const slug = slugify(name)

  const filteredProducts = allProducts.filter((p) => {
    if (!productSearch.trim()) return true
    const q = productSearch.toLowerCase()
    return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
  })

  function toggleProduct(pSlug: string) {
    setProductSlugs((prev) => {
      const next = new Set(prev)
      if (next.has(pSlug)) next.delete(pSlug)
      else next.add(pSlug)
      return next
    })
  }

  async function create() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/master/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          name: name.trim(),
          icon,
          description: description.trim(),
          image_url: imageUrl.trim() || null,
          product_slugs: Array.from(productSlugs),
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? "Create failed"); return }
      onCreated({ ...json, productSlugs: json.productSlugs ?? [] })
      // reset
      setName("")
      setIcon("Package")
      setDescription("")
      setImageUrl("")
      setProductSlugs(new Set())
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-5 space-y-4">
      <h3 className="font-bold text-gray-900 text-sm">New category</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Name <span className="text-red-500">*</span></label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Cold Storage"
            className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {slug && <p className="text-[10px] text-gray-400 font-mono mt-0.5">slug: {slug}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Icon</label>
          <select
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ICONS.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Signs & labels for cold chain environments"
          className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Category image <span className="text-gray-400 font-normal">(optional)</span></label>
        <ImageUploader
          value={imageUrl}
          onChange={setImageUrl}
          kind="category"
          recommendation="800 × 500 px, JPG or WEBP"
          previewAspect="8/5"
          maxPreviewHeight={90}
        />
      </div>

      {/* Product picker */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-gray-600">
            Products <span className="text-gray-400 font-normal">(optional — pick to create a curated collection)</span>
          </label>
          {productSlugs.size > 0 && (
            <span className="text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full font-semibold">
              {productSlugs.size} selected
            </span>
          )}
        </div>
        <input
          value={productSearch}
          onChange={(e) => setProductSearch(e.target.value)}
          placeholder="Filter products…"
          className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
          {filteredProducts.map((p) => {
            const on = productSlugs.has(p.slug)
            return (
              <label
                key={p.slug}
                className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 ${on ? "bg-blue-50" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggleProduct(p.slug)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-800 truncate">{p.name}</div>
                  <div className="text-[10px] text-gray-400 font-mono truncate">
                    {p.category} · {p.slug}
                  </div>
                </div>
              </label>
            )
          })}
          {filteredProducts.length === 0 && (
            <div className="px-3 py-4 text-xs text-gray-400 text-center">No products match.</div>
          )}
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="button"
        onClick={create}
        disabled={busy || !name.trim()}
        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2 rounded-lg"
      >
        {busy ? "Creating…" : "Create category"}
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main page client
// ─────────────────────────────────────────────────────────────
export default function CategoriesClient({
  categories: initialCategories,
  allProducts,
}: {
  categories: BankCategory[]
  allProducts: DbProduct[]
}) {
  const router = useRouter()
  const [categories, setCategories] = useState<CategoryWithExtras[]>(
    initialCategories.map((c) => ({ ...c, productSlugs: c.productSlugs ?? [] }))
  )

  function handleSaved(updated: CategoryWithExtras) {
    setCategories((prev) =>
      prev.map((c) => (c.slug === updated.slug ? updated : c))
    )
    router.refresh()
  }

  function handleDeleted(slug: string) {
    setCategories((prev) => prev.filter((c) => c.slug !== slug))
    router.refresh()
  }

  function handleCreated(cat: CategoryWithExtras) {
    setCategories((prev) => {
      const existing = prev.find((c) => c.slug === cat.slug)
      if (existing) return prev.map((c) => (c.slug === cat.slug ? cat : c))
      return [...prev, cat]
    })
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* New category form */}
      <NewCategoryForm allProducts={allProducts} onCreated={handleCreated} />

      {/* Existing categories */}
      <div className="space-y-2">
        {categories.map((cat) => (
          <CategoryRow
            key={cat.slug}
            cat={cat}
            allProducts={allProducts}
            onSaved={handleSaved}
            onDeleted={handleDeleted}
          />
        ))}
        {categories.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm">No categories yet.</div>
        )}
      </div>
    </div>
  )
}
