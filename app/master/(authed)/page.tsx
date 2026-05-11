import Link from "next/link"
import { listTenants, type Tenant } from "@/lib/tenant"

function SiteCard({ t }: { t: Tenant }) {
  const primary = (t.brand?.primaryColor as string) ?? "#1e3a5f"
  return (
    <Link
      href={`/master/sites/${t.id}/edit`}
      className="group bg-white rounded-xl border border-gray-200 hover:border-gray-400 hover:shadow-md transition-all overflow-hidden"
    >
      <div
        className="h-20 flex items-center justify-center"
        style={{ backgroundColor: primary }}
      >
        {t.brand?.logoImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.brand.logoImage as string} alt={t.name} className="h-10 w-auto" />
        ) : (
          <span className="text-white font-black text-lg tracking-wide">
            {(t.brand?.logoText as string) ?? t.name}
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-gray-900 truncate">{t.name}</h3>
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
}

function SiteSection({
  title,
  description,
  sites,
  emptyText,
  accentClass,
}: {
  title: string
  description: string
  sites: Tenant[]
  emptyText: string
  accentClass: string
}) {
  return (
    <div>
      <div className={`flex items-center gap-3 mb-4 pb-3 border-b border-gray-200`}>
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full ${accentClass}`} />
            {title}
            <span className="text-sm font-normal text-gray-400">{sites.length}</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        </div>
      </div>

      {sites.length === 0 ? (
        <p className="text-sm text-gray-400 italic mb-2">{emptyText}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map((t) => <SiteCard key={t.id} t={t} />)}
        </div>
      )}
    </div>
  )
}

export default async function MasterDashboard() {
  let tenants: Tenant[] = []
  let fetchError: string | null = null
  try {
    tenants = await listTenants()
  } catch (e: any) {
    fetchError = e.message
  }

  const live    = tenants.filter((t) => !t.archived && t.status === "live")
  const demo    = tenants.filter((t) => !t.archived && t.status !== "live")
  const archived = tenants.filter((t) => t.archived)

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Sites</h1>
          <p className="text-sm text-gray-500 mt-1">
            {live.length} live · {demo.length} demo{archived.length > 0 ? ` · ${archived.length} archived` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/master/import"
            className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-400 px-3 py-1.5 rounded-lg font-medium"
          >
            ↑ Import products
          </Link>
          <Link
            href="/master/sites/new"
            className="text-sm bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-1.5 rounded-lg"
          >
            + New site
          </Link>
        </div>
      </div>

      {fetchError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <div className="font-semibold mb-1">Couldn't load tenants</div>
          <div className="font-mono text-xs">{fetchError}</div>
        </div>
      )}

      {!fetchError && (
        <div className="space-y-10">
          <SiteSection
            title="Live"
            description="Active customer sites"
            sites={live}
            emptyText="No live sites yet."
            accentClass="bg-green-500"
          />
          <SiteSection
            title="Demo"
            description="Prospect and internal demo sites"
            sites={demo}
            emptyText="No demo sites yet — create one with the button above."
            accentClass="bg-blue-500"
          />
          {archived.length > 0 && (
            <SiteSection
              title="Archived"
              description="Hidden from prospects"
              sites={archived}
              emptyText=""
              accentClass="bg-gray-400"
            />
          )}
        </div>
      )}
    </div>
  )
}
