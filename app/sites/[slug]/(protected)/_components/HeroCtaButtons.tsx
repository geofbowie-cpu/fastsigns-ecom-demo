"use client"

import Link from "next/link"
import { trackCtaClick } from "@/lib/track"

export default function HeroCtaButtons({
  slug,
  cta1Text,
  cta1Url,
  cta1Color,
  cta1TextColor,
  cta1Icon,
  cta2Text,
  cta2Url,
  cta2Color,
  cta2TextColor,
  cta2Icon,
  tenantSlug,
}: {
  slug: string
  cta1Text: string
  cta1Url: string
  cta1Color: string
  cta1TextColor: string
  cta1Icon?: string
  cta2Text?: string
  cta2Url?: string
  cta2Color?: string
  cta2TextColor?: string
  cta2Icon?: string
  tenantSlug: string
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <Link
        href={`/sites/${slug}/${cta1Url}`}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
        style={{ backgroundColor: cta1Color, color: cta1TextColor }}
        onClick={() => trackCtaClick(cta1Text, `/sites/${slug}/${cta1Url}`, tenantSlug, "hero")}
      >
        {cta1Text}{cta1Icon ? ` ${cta1Icon}` : ""}
      </Link>
      {cta2Text && (
        <Link
          href={`/sites/${slug}/${cta2Url ?? ""}`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
          style={cta2Color
            ? { backgroundColor: cta2Color, color: cta2TextColor }
            : { backgroundColor: "rgba(255,255,255,0.1)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.2)" }
          }
          onClick={() => trackCtaClick(cta2Text, `/sites/${slug}/${cta2Url ?? ""}`, tenantSlug, "hero")}
        >
          {cta2Text}{cta2Icon ? ` ${cta2Icon}` : ""}
        </Link>
      )}
    </div>
  )
}
