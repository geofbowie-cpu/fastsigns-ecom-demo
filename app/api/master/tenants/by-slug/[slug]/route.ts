import { NextResponse } from "next/server"
import { getTenantBySlug } from "@/lib/tenant"

// Public endpoint — returns only brand data (no sensitive fields)
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({
    tenant: {
      name: tenant.name,
      brand: tenant.brand,
      allowed_domains: tenant.allowed_domains,
    },
  })
}
