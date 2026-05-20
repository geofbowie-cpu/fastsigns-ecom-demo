export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import Link from "next/link"
import { adminClient } from "@/lib/supabase"
import { getAllCategories, getAllProducts, listImportTags } from "@/lib/products-db"
import EditSiteForm from "./EditSiteForm"
import type { Tenant } from "@/lib/tenant"

export default async function EditSitePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [{ data, error }, categories, allProducts, availableImportTags] = await Promise.all([
    adminClient().from("tenants").select("*").eq("id", id).maybeSingle(),
    getAllCategories(),
    getAllProducts(),
    listImportTags(),
  ])
  if (error || !data) notFound()
  const tenant = data as Tenant

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <Link
          href="/master"
          className="text-xs text-gray-400 hover:text-gray-700 shrink-0"
        >
          ← All sites
        </Link>
        <span className="text-gray-200">/</span>
        <h1 className="text-base font-bold text-gray-900">{tenant.name}</h1>
        <Link
          href={`/sites/${tenant.slug}`}
          target="_blank"
          className="text-xs text-blue-500 hover:underline font-mono"
        >
          /sites/{tenant.slug} ↗
        </Link>
        <span className={`ml-1 text-xs font-semibold px-2 py-0.5 rounded-full ${tenant.status === "live" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-600"}`}>
          {tenant.status === "live" ? "Live" : "Demo"}
        </span>
      </div>
      <EditSiteForm
        tenant={tenant}
        categories={categories}
        allProducts={allProducts}
        availableImportTags={availableImportTags}
      />
    </div>
  )
}
