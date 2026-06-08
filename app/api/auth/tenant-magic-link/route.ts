import { NextResponse } from "next/server"
import { getTenantBySlug } from "@/lib/tenant"
import { resolveBrand } from "@/lib/resolve-brand"
import { sendMagicLink } from "@/lib/send-magic-link"

export async function POST(req: Request) {
  let body: { email: string; slug: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  const slug = body.slug?.trim().toLowerCase()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 })
  }
  if (!slug) return NextResponse.json({ error: "Slug required" }, { status: 400 })

  const tenant = await getTenantBySlug(slug)
  if (!tenant) return NextResponse.json({ error: "Site not found" }, { status: 404 })

  const domains = tenant.allowed_domains ?? []
  if (domains.length === 0) {
    return NextResponse.json({ error: "This site doesn't require sign-in." }, { status: 400 })
  }

  const emailDomain = email.split("@")[1]
  if (!domains.includes(emailDomain)) {
    return NextResponse.json(
      { error: `This site is only accessible to ${domains.join(", ")} email addresses.` },
      { status: 403 }
    )
  }

  const b = resolveBrand(tenant.brand)

  const result = await sendMagicLink({
    email,
    callbackPath: "/auth/tenant-callback",
    callbackQuery: { slug },
    siteName: b.company || tenant.name,
    brandColor: b.primaryColor,
    logoUrl: b.logoImage || undefined,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({ ok: true })
}
