import Link from "next/link"
import { listTenants, type Tenant } from "@/lib/tenant"

export default async function MasterDashboard() {
  let tenants: Tenant[] = []
  let fetchError: string | null = null
  try {
    tenants = await listTenants()
  } catch (e: any) {
    fetchError = e.message
  }

  const active = tenants.filter((t) => !t.archived)
  const archived = tenants.filter((t) => t.archived)

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Demo sites</h1>
          <p className="text-sm text-gray-500 mt-1">
            Branded prospect sites you can share. Each one lives at /sites/&lt;slug&gt;.
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {active.length} active{archived.length > 0 ? ` · ${archived.length} archived` : ""}
        </div>
      </div>

      {fetchError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <div className="font-semibold mb-1">Couldn't load tenants</div>
          <div className="font-mono text-xs">{fetchError}</div>
          <div className="mt-2 text-xs">
            If this says &quot;relation ecom_demos.tenants does not exist&quot;, the schema migration hasn&apos;t been applied yet. Paste{" "}
            <code className="bg-white px-1 rounded">supabase/migrations/0001_ecom_demos_init.sql</code> into the Supabase SQL Editor.
          </div>
        </div>
      )}

      {active.length === 0 && !fetchError && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="text-4xl mb-3">🏗️</div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">No demo sites yet</h2>
          <p className="text-sm text-gray-500 mb-5">
            Spin up your first branded prospect site in under a minute.
          </p>
          <Link
            href="/master/sites/new"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg"
          >
            + New site
          </Link>
        </div>
      )}

      {active.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {active.map((t) => {
            const primary = (t.brand?.primaryColor as string) ?? "#1e3a5f"
            return (
              <Link
                key={t.id}
                href={`/master/sites/${t.id}/edit`}
                className="group bg-white rounded-xl border border-gray-200 hover:border-gray-400 hover:shadow-md transition-all overflow-hidden"
              >
                <div
                  className="h-20 flex items-center justify-center"
                  style={{ backgroundColor: primary }}
                >
                  {t.brand?.logoImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.brand.logoImage as string}
                      alt={t.name}
                      className="h-10 w-auto"
                    />
                  ) : (
                    <span className="text-white font-black text-lg tracking-wide">
                      {(t.brand?.logoText as string) ?? t.name}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-gray-900 truncate">{t.name}</h3>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      t.status === "live"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {t.status === "live" ? "🟢 Live" : "🔵 Demo"}
                    </span>
                  </div>
                  <div className="mt-1.5 text-xs text-gray-400 font-mono">/sites/{t.slug}</div>
                  <div className="mt-1.5 text-xs text-gray-500">
                    {t.enabled_categories.length === 0
                      ? "All categories"
                      : `${t.enabled_categories.length} categor${t.enabled_categories.length === 1 ? "y" : "ies"}`}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
