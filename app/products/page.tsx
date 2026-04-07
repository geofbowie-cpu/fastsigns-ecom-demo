"use client"

import { useState, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { products, categories, brand } from "@/brand.config"
import ProductCard from "@/components/ProductCard"
import { Search, SlidersHorizontal, X } from "lucide-react"

function ProductsContent() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get("category") || ""

  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [selectedTag, setSelectedTag] = useState("")

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    products.forEach((p) => p.tags.forEach((t) => tags.add(t)))
    return Array.from(tags).sort()
  }, [])

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.shortDesc.toLowerCase().includes(search.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      const matchesCategory = !selectedCategory || p.category === selectedCategory
      const matchesTag = !selectedTag || p.tags.includes(selectedTag)
      return matchesSearch && matchesCategory && matchesTag
    })
  }, [search, selectedCategory, selectedTag])

  const hasFilters = !!selectedCategory || !!selectedTag || !!search

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Product Catalog</h1>
        <p className="text-gray-500 mt-1">
          {filtered.length} product{filtered.length !== 1 ? "s" : ""}
          {selectedCategory && ` in ${categories.find((c) => c.slug === selectedCategory)?.name}`}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar filters */}
        <aside className="lg:w-56 flex-shrink-0">
          {/* Search */}
          <div className="relative mb-6">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:border-gray-400 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Categories */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              <SlidersHorizontal size={12} /> Category
            </div>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory("")}
                className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                  !selectedCategory
                    ? "font-semibold text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                style={!selectedCategory ? { backgroundColor: brand.primaryColor } : {}}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setSelectedCategory(cat.slug === selectedCategory ? "" : cat.slug)}
                  className={`w-full text-left flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg transition-colors ${
                    selectedCategory === cat.slug
                      ? "font-semibold text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  style={selectedCategory === cat.slug ? { backgroundColor: brand.primaryColor } : {}}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Tags
            </div>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag === selectedTag ? "" : tag)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    selectedTag === tag
                      ? "text-white border-transparent"
                      : "text-gray-500 border-gray-200 hover:border-gray-400"
                  }`}
                  style={selectedTag === tag ? { backgroundColor: brand.primaryColor, borderColor: brand.primaryColor } : {}}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Clear filters */}
          {hasFilters && (
            <button
              onClick={() => {
                setSearch("")
                setSelectedCategory("")
                setSelectedTag("")
              }}
              className="mt-4 w-full text-sm text-red-500 hover:text-red-700 underline text-left"
            >
              Clear all filters
            </button>
          )}
        </aside>

        {/* Product grid */}
        <div className="flex-1">
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-gray-400">Loading...</div>}>
      <ProductsContent />
    </Suspense>
  )
}
