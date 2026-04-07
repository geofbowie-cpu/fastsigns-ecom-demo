"use client"

import { useProductStore } from "@/lib/product-store"
import ProductForm from "@/components/admin/ProductForm"
import type { Product } from "@/brand.config"

export default function NewProductPage() {
  const { products, createProduct } = useProductStore()

  return (
    <ProductForm
      mode="create"
      existingProducts={products}
      onSave={(product: Product) => createProduct(product)}
    />
  )
}
