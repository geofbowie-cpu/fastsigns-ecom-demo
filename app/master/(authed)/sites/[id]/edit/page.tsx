import { notFound } from "next/navigation"
import Link from "next/link"
import { adminClient } from "@/lib/supabase"
import { bankCategories } from "@/lib/product-bank"
import EditSiteForm from "./EditSiteForm"
import type { Tenant } from "@/lib/tenant"

export default async function EditSitePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { data, error } = await adminClient()
    .from("tenants")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  if (error || !data) notFound()
  const tenant = data as Tenant

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link
            href="/master"
            className="text-xs text-gray-500 hover:text-gray-900 mb-1 inline-flex items-center gap-1"
          >
            ← All sites
          </Link>
          <h1 className="text-2xl font-black text-gray-900">{tenant.name}</h1>
          <div className="text-sm text-gray-500 mt-1">
            <Link
              href={`/sites/${tenant.slug}`}
              target="_blank"
              className="text-blue-600 hover:underline font-mono"
            >
              /sites/{tenant.slug} ↗
            </Link>
          </div>
        </div>
      </div>
      <EditSiteForm tenant={tenant} categories={bankCategories} />
    </div>
  )
}
