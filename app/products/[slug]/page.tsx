"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { categories, brand } from "@/brand.config"
import { useProductStore } from "@/lib/product-store"
import { useCart } from "@/lib/cart-context"
import ProductCard from "@/components/ProductCard"
import { ChevronRight, ShoppingCart, Clock, CheckCircle, Minus, Plus } from "lucide-react"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { addItem } = useCart()
  const { products } = useProductStore()

  const product = products.find((p) => p.slug === params.slug)

  const [selectedSize, setSelectedSize] = useState(product?.sizes[0] ?? "")
  const [selectedMaterial, setSelectedMaterial] = useState(product?.materials[0] ?? "")
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500">Product not found.</p>
        <Link href="/products" className="mt-4 inline-block text-sm underline" style={{ color: brand.primaryColor }}>
          Back to catalog
        </Link>
      </div>
    )
  }

  const category = categories.find((c) => c.slug === product.category)
  const relatedProducts = products.filter(
    (p) => p.category === product.category && p.slug !== product.slug
  ).slice(0, 3)

  function handleAddToCart() {
    addItem(product!, selectedSize, selectedMaterial, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  function handleBuyNow() {
    addItem(product!, selectedSize, selectedMaterial, qty)
    router.push("/cart")
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-8">
        <Link href="/products" className="hover:text-gray-700">Products</Link>
        <ChevronRight size={13} />
        {category && (
          <>
            <Link href={`/products?category=${category.slug}`} className="hover:text-gray-700">
              {category.name}
            </Link>
            <ChevronRight size={13} />
          </>
        )}
        <span className="text-gray-700">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Product visual */}
        <div>
          <div
            className="w-full aspect-[4/3] rounded-2xl flex flex-col items-center justify-center shadow-lg overflow-hidden"
            style={product.imageUrl ? {} : {
              background: `linear-gradient(135deg, ${product.gradientFrom}, ${product.gradientTo})`,
            }}
          >
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
                style={{
                  objectPosition: product.imagePosition
                    ? `${product.imagePosition.x}% ${product.imagePosition.y}%`
                    : undefined,
                  transform: product.imageZoom && product.imageZoom !== 1
                    ? `scale(${product.imageZoom})`
                    : undefined,
                  transformOrigin: product.imagePosition
                    ? `${product.imagePosition.x}% ${product.imagePosition.y}%`
                    : undefined,
                }}
              />
            ) : (
              <>
                <span className="text-[80px] drop-shadow-md">{product.icon}</span>
                <span className="text-white/60 text-sm mt-3 font-medium">{category?.name}</span>
              </>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            {product.tags.map((tag) => (
              <span key={tag} className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Product info + add to cart */}
        <div>
          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="text-3xl font-black text-gray-900 leading-tight">{product.name}</h1>
            {product.featured && (
              <span
                className="flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full mt-1"
                style={{ backgroundColor: brand.accentColor, color: "#000" }}
              >
                Popular
              </span>
            )}
          </div>

          <div className="mb-4">
            <span className="text-2xl font-bold text-gray-900">
              ${product.startingPrice.toLocaleString()}
            </span>
            <span className="text-sm text-gray-400 ml-2">{product.unit}</span>
          </div>

          <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>

          {/* Lead time */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 bg-gray-50 rounded-lg px-4 py-2.5 border border-gray-100">
            <Clock size={14} />
            <span>Lead time: <strong className="text-gray-700">{product.leadTime}</strong></span>
          </div>

          {/* Size selector */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Size
            </label>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`text-sm px-3 py-1.5 rounded-lg border transition-all ${
                    selectedSize === size
                      ? "text-white border-transparent font-semibold"
                      : "text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}
                  style={selectedSize === size ? { backgroundColor: brand.primaryColor, borderColor: brand.primaryColor } : {}}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Material selector */}
          {product.materials.length > 0 && (
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Material
              </label>
              <div className="flex flex-wrap gap-2">
                {product.materials.map((mat) => (
                  <button
                    key={mat}
                    onClick={() => setSelectedMaterial(mat)}
                    className={`text-sm px-3 py-1.5 rounded-lg border transition-all ${
                      selectedMaterial === mat
                        ? "text-white border-transparent font-semibold"
                        : "text-gray-600 border-gray-200 hover:border-gray-400"
                    }`}
                    style={selectedMaterial === mat ? { backgroundColor: brand.primaryColor, borderColor: brand.primaryColor } : {}}
                  >
                    {mat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Qty */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className="w-10 text-center font-semibold text-gray-900">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
              style={{ backgroundColor: added ? "#16a34a" : brand.primaryColor }}
            >
              {added ? (
                <>
                  <CheckCircle size={16} /> Added to Cart
                </>
              ) : (
                <>
                  <ShoppingCart size={16} /> Add to Cart
                </>
              )}
            </button>
            <button
              onClick={handleBuyNow}
              className="flex-1 py-3 rounded-xl font-semibold text-sm border-2 transition-all hover:text-white"
              style={{
                borderColor: brand.primaryColor,
                color: brand.primaryColor,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = brand.primaryColor
                e.currentTarget.style.color = "#fff"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent"
                e.currentTarget.style.color = brand.primaryColor
              }}
            >
              Request Quote
            </button>
          </div>

          {/* Net 30 note */}
          <p className="text-xs text-gray-400 mt-3 text-center">
            Net 30 billing available · PO accepted · No credit card required
          </p>
        </div>
      </div>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-xl font-bold text-gray-900 mb-6">More in {category?.name}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {relatedProducts.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
