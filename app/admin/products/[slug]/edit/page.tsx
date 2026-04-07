"use client"

import { useParams } from "next/navigation"
import { useProductStore } from "@/lib/product-store"
import ProductForm from "@/components/admin/ProductForm"
import type { Product } from "@/brand.config"
import Link from "next/link"

export default function EditProductPage() {
  const params = useParams()
  const slug = params.slug as string
  const { products, getProduct, updateProduct, loaded } = useProductStore()

  const product = getProduct(slug)

  if (!loaded) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex-1 flex items-center justify-center text-center px-8">
        <div>
          <p className="text-gray-500 mb-4">Product not found.</p>
          <Link href="/admin/products" className="text-sm underline text-gray-600">
            Back to products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <ProductForm
      mode="edit"
      initial={product}
      existingProducts={products}
      onSave={(updated: Product) => updateProduct(slug, updated)}
    />
  )
}
