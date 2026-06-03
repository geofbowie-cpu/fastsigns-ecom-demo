"use client"

import { trackPhoneClick, trackEmailClick, trackCtaClick } from "@/lib/track"

// ── Phone link ────────────────────────────────────────────────

export function PhoneLink({
  phone,
  tenantSlug,
  className,
  style,
  children,
}: {
  phone: string
  tenantSlug: string
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}) {
  return (
    <a
      href={`tel:${phone}`}
      className={className}
      style={style}
      onClick={() => trackPhoneClick(phone, tenantSlug)}
    >
      {children}
    </a>
  )
}

// ── Email link ────────────────────────────────────────────────

export function EmailLink({
  email,
  href,
  tenantSlug,
  context,
  className,
  style,
  children,
}: {
  email: string
  href?: string          // optional override (e.g. mailto with subject)
  tenantSlug: string
  context?: string
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}) {
  return (
    <a
      href={href ?? `mailto:${email}`}
      className={className}
      style={style}
      onClick={() => trackEmailClick(email, tenantSlug, context)}
    >
      {children}
    </a>
  )
}

// ── CTA link (wraps any anchor with click tracking) ───────────

export function CtaLink({
  href,
  label,
  tenantSlug,
  context,
  className,
  style,
  children,
}: {
  href: string
  label: string
  tenantSlug: string
  context?: string
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      className={className}
      style={style}
      onClick={() => trackCtaClick(label, href, tenantSlug, context)}
    >
      {children}
    </a>
  )
}
