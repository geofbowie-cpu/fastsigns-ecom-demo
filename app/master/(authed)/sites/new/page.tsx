import NewSiteForm from "./NewSiteForm"
import { bankCategories } from "@/lib/product-bank"

export default function NewSitePage() {
  return (
    <div>
      <h1 className="text-2xl font-black text-gray-900 mb-1">New demo site</h1>
      <p className="text-sm text-gray-500 mb-6">
        Fill in the brand, pick categories, save. Site goes live at /sites/&lt;slug&gt;.
      </p>
      <NewSiteForm categories={bankCategories} />
    </div>
  )
}
