export const dynamic = "force-dynamic"

import { getAllProducts, getAllCategories } from "@/lib/products-db"
import ProductsClient from "./ProductsClient"

export default async function ProductsPage() {
  const [allProducts, categories] = await Promise.all([
    getAllProducts(),
    getAllCategories(),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Products</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage global and site-specific products. Built-in products (no import tag) are available to all sites based on their enabled categories.
        </p>
      </div>
      <ProductsClient initialProducts={allProducts} categories={categories} />
    </div>
  )
}
