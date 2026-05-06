// Brandfetch API helper. Server-only.
// Sign up at https://developers.brandfetch.com/ for a free Brand API key
// and set BRANDFETCH_API_KEY in env vars.

export type BrandfetchHit = {
  name: string
  domain: string
  description?: string
  logoUrl?: string
  iconUrl?: string
  primaryColor?: string
  accentColor?: string
  raw?: unknown
}

const BF_BASE = "https://api.brandfetch.io/v2/brands"

function pickLogo(
  logos: Array<{
    type?: string
    theme?: string
    formats?: Array<{ src?: string; format?: string; height?: number; width?: number }>
  }>,
  type: "logo" | "icon" | "symbol"
): string | undefined {
  // Prefer matching type + light theme + SVG > PNG > WEBP
  const ofType = logos.filter((l) => l.type === type)
  const themed = [
    ...ofType.filter((l) => l.theme === "light"),
    ...ofType.filter((l) => l.theme !== "light"),
  ]
  for (const fmt of ["svg", "png", "webp"]) {
    for (const l of themed) {
      const f = (l.formats ?? []).find((x) => x.format === fmt && x.src)
      if (f?.src) return f.src
    }
  }
  return undefined
}

function pickColors(
  colors: Array<{ hex?: string; type?: string; brightness?: number }>
): { primary?: string; accent?: string } {
  if (!colors?.length) return {}
  const primary =
    colors.find((c) => c.type === "primary")?.hex ??
    colors.find((c) => c.type === "brand")?.hex ??
    colors.find((c) => c.type === "dark")?.hex
  const accent =
    colors.find((c) => c.type === "accent")?.hex ??
    colors.find((c) => c.hex && c.hex !== primary)?.hex
  // Fallback: take first two distinct
  if (!primary && colors[0]?.hex) {
    return {
      primary: colors[0].hex,
      accent: colors.find((c) => c.hex && c.hex !== colors[0].hex)?.hex,
    }
  }
  return { primary, accent }
}

export async function fetchBrand(domain: string): Promise<BrandfetchHit> {
  const key = process.env.BRANDFETCH_API_KEY
  if (!key) {
    throw new Error(
      "BRANDFETCH_API_KEY is not set. Add it in Vercel env vars (free key at developers.brandfetch.com)."
    )
  }

  const cleaned = domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./, "")
  if (!cleaned || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(cleaned)) {
    throw new Error(`Invalid domain: "${domain}"`)
  }

  const res = await fetch(`${BF_BASE}/${cleaned}`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: "no-store",
  })
  if (res.status === 404) {
    throw new Error(`Brandfetch has no record for ${cleaned}`)
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Brandfetch ${res.status}: ${text || res.statusText}`)
  }
  const data = (await res.json()) as any

  const logoUrl = pickLogo(data.logos ?? [], "logo")
  const iconUrl =
    pickLogo(data.logos ?? [], "icon") ?? pickLogo(data.logos ?? [], "symbol")
  const { primary, accent } = pickColors(data.colors ?? [])

  return {
    name: data.name ?? cleaned,
    domain: cleaned,
    description: data.description ?? data.longDescription ?? undefined,
    logoUrl,
    iconUrl,
    primaryColor: primary,
    accentColor: accent,
  }
}
