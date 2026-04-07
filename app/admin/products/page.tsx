"use client"

import { useState } from "react"
import Link from "next/link"
import { useProductStore } from "@/lib/product-store"
import { brand, categories } from "@/brand.config"
import { Plus, Pencil, Trash2, Search, RotateCcw, Star } from "lucide-react"

export default function AdminProductsPage() {
  const { products, loaded, deleteProduct, updateProduct, resetToDefaults } = useProductStore()
  const [search, setSearch] = useState("")
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const filtered = products.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku ?? "").toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  )

  function handleDelete(slug: string) {
    if (confirmDelete === slug) {
      deleteProduct(slug)
      setConfirmDelete(null)
    } else {
      setConfirmDelete(slug)
    }
  }

  return (
    <div className="flex-1 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {loaded ? `${products.length} products` : "Loading…"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setConfirmReset(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <RotateCcw size={14} /> Reset to defaults
          </button>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: brand.primaryColor }}
          >
            <Plus size={15} /> New Product
          </Link>
        </div>
      </div>

      {/* Reset confirm */}
      {confirmReset && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <p className="text-sm text-red-700">
            This will reset all products to the default catalog. Any additions or edits will be lost.
          </p>
          <div className="flex gap-2 ml-4 flex-shrink-0">
            <button
              onClick={() => { resetToDefaults(); setConfirmReset(false) }}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700"
            >
              Reset
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, SKU, or category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:border-gray-400 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Product
              </th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                SKU
              </th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">
                Category
              </th>
              <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Price
              </th>
              <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                Featured
              </th>
              <th className="px-4 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {!loaded ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-gray-400 text-sm">
                  Loading products…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-gray-400 text-sm">
                  No products found
                </td>
              </tr>
            ) : (
              filtered.map((product) => {
                const cat = categories.find((c) => c.slug === product.category)
                return (
                  <tr key={product.slug} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    {/* Thumbnail + name */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-xl overflow-hidden"
                          style={
                            product.imageUrl
                              ? {}
                              : { background: `linear-gradient(135deg, ${product.gradientFrom}, ${product.gradientTo})` }
                          }
                        >
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            product.icon
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{product.name}</div>
                          <div className="text-xs text-gray-400 truncate max-w-[200px]">{product.shortDesc}</div>
                        </div>
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="font-mono text-xs text-gray-500">{product.sku ?? "—"}</span>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                        {cat?.icon} {cat?.name ?? product.category}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        ${product.startingPrice.toLocaleString()}
                      </span>
                    </td>

                    {/* Featured toggle */}
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      <button
                        onClick={() => updateProduct(product.slug, { featured: !product.featured })}
                        className={`transition-colors ${product.featured ? "text-yellow-400" : "text-gray-200 hover:text-gray-300"}`}
                      >
                        <Star size={16} fill={product.featured ? "currentColor" : "none"} />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/products/${product.slug}/edit`}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Pencil size={14} />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.slug)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            confirmDelete === product.slug
                              ? "bg-red-100 text-red-600"
                              : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                          }`}
                          title={confirmDelete === product.slug ? "Click again to confirm" : "Delete"}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
