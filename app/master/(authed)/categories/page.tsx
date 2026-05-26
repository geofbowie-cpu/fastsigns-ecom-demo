export const dynamic = "force-dynamic"

import { getAllCategories, getAllProducts } from "@/lib/products-db"
import CategoriesClient from "./CategoriesClient"

export default async function CategoriesPage() {
  const [categories, allProducts] = await Promise.all([
    getAllCategories(),
    getAllProducts(),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Categories</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage global categories. Custom categories let you curate specific products regardless of their assigned category.
        </p>
      </div>
      <CategoriesClient categories={categories} allProducts={allProducts} />
    </div>
  )
}
