"use client"

import Link from "next/link"
import { trackCtaClick } from "@/lib/track"

/** Returns the resolved href: absolute URLs pass through, relative ones get the site prefix. */
function resolveHref(url: string, slug: string): string {
  if (/^https?:\/\//i.test(url) || url.startsWith("//")) return url
  // Strip any accidental leading slash before joining
  return `/sites/${slug}/${url.replace(/^\//, "")}`
}

function CtaButton({
  href,
  label,
  icon,
  tenantSlug,
  className,
  style,
}: {
  href: string
  label: string
  icon?: string
  tenantSlug: string
  className: string
  style: React.CSSProperties
}) {
  const isExternal = /^https?:\/\//i.test(href) || href.startsWith("//")
  const text = `${label}${icon ? ` ${icon}` : ""}`
  const handleClick = () => trackCtaClick(label, href, tenantSlug, "hero")

  if (isExternal) {
    return (
      <a href={href} className={className} style={style} onClick={handleClick}
         target="_blank" rel="noopener noreferrer">
        {text}
      </a>
    )
  }
  return (
    <Link href={href} className={className} style={style} onClick={handleClick}>
      {text}
    </Link>
  )
}

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
  const href1 = resolveHref(cta1Url, slug)
  const href2 = cta2Url ? resolveHref(cta2Url, slug) : ""

  return (
    <div className="flex flex-wrap gap-3">
      <CtaButton
        href={href1}
        label={cta1Text}
        icon={cta1Icon}
        tenantSlug={tenantSlug}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
        style={{ backgroundColor: cta1Color, color: cta1TextColor }}
      />
      {cta2Text && href2 && (
        <CtaButton
          href={href2}
          label={cta2Text}
          icon={cta2Icon}
          tenantSlug={tenantSlug}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
          style={cta2Color
            ? { backgroundColor: cta2Color, color: cta2TextColor }
            : { backgroundColor: "rgba(255,255,255,0.1)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.2)" }
          }
        />
      )}
    </div>
  )
}
