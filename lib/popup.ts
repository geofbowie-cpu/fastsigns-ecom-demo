// Per-site marketing popup config (tenants.popup jsonb).
//
// Two modes:
//   "embed" — paste a HubSpot (or any) snippet. Most snippets (HubSpot *form*
//             embeds especially) render inline wherever they're dropped, so by
//             default we frame them in our own overlay; embedFramed=false is
//             for snippets that position themselves (pop-up CTAs, full tag
//             managers). Arbitrary JS, master-admin-only field.
//   "modal" — we render the overlay ourselves from these fields.
//
// Shared by the admin editor, the storefront component, and the preview.

export type PopupMode = "embed" | "modal"
export type PopupTrigger = "load" | "delay" | "scroll" | "exit"

export type TenantPopup = {
  enabled: boolean
  mode: PopupMode
  /** Raw HTML/script for mode "embed". */
  embedCode: string
  /** Render the embed inside our modal frame. False = the snippet positions itself. */
  embedFramed: boolean
  // ── mode "modal" content ──
  heading: string
  body: string
  imageUrl: string
  ctaText: string
  /** "http…"/mailto:/tel: used as-is; anything else is site-relative. */
  ctaUrl: string
  dismissText: string
  // ── behaviour (both modes) ──
  trigger: PopupTrigger
  delaySeconds: number
  scrollPercent: number
  /** Days to suppress after a visitor has seen it. 0 = show every page view. */
  frequencyDays: number
}

export const DEFAULT_POPUP: TenantPopup = {
  enabled: false,
  mode: "modal",
  embedCode: "",
  embedFramed: true,
  heading: "",
  body: "",
  imageUrl: "",
  ctaText: "",
  ctaUrl: "",
  dismissText: "No thanks",
  trigger: "delay",
  delaySeconds: 5,
  scrollPercent: 50,
  frequencyDays: 7,
}

const MODES: PopupMode[] = ["embed", "modal"]
const TRIGGERS: PopupTrigger[] = ["load", "delay", "scroll", "exit"]

function str(v: unknown, fallback: string): string {
  return typeof v === "string" ? v : fallback
}

function num(v: unknown, fallback: number, min: number, max: number): number {
  const n = typeof v === "number" ? v : Number(v)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.round(n)))
}

/** Coerce whatever is in the jsonb column into a complete, safe config. */
export function resolvePopup(raw: unknown): TenantPopup {
  const p = (raw ?? {}) as Record<string, unknown>
  const mode = MODES.includes(p.mode as PopupMode) ? (p.mode as PopupMode) : DEFAULT_POPUP.mode
  const trigger = TRIGGERS.includes(p.trigger as PopupTrigger)
    ? (p.trigger as PopupTrigger)
    : DEFAULT_POPUP.trigger
  return {
    enabled: p.enabled === true,
    mode,
    embedCode: str(p.embedCode, ""),
    // Default true: an un-framed inline embed renders at the foot of the page
    // and looks like nothing happened.
    embedFramed: p.embedFramed !== false,
    heading: str(p.heading, ""),
    body: str(p.body, ""),
    imageUrl: str(p.imageUrl, ""),
    ctaText: str(p.ctaText, ""),
    ctaUrl: str(p.ctaUrl, ""),
    dismissText: str(p.dismissText, DEFAULT_POPUP.dismissText),
    trigger,
    delaySeconds: num(p.delaySeconds, DEFAULT_POPUP.delaySeconds, 0, 300),
    scrollPercent: num(p.scrollPercent, DEFAULT_POPUP.scrollPercent, 1, 100),
    frequencyDays: num(p.frequencyDays, DEFAULT_POPUP.frequencyDays, 0, 365),
  }
}

/**
 * True when the config would actually render something. An enabled popup with
 * an empty embed / empty modal heading is a no-op, not an error.
 */
export function popupIsRenderable(p: TenantPopup): boolean {
  if (!p.enabled) return false
  return p.mode === "embed" ? p.embedCode.trim().length > 0 : p.heading.trim().length > 0
}

/** Resolve a modal CTA into an href. Mirrors the hero CTA convention. */
export function popupCtaHref(url: string, slug: string): string {
  const u = url.trim()
  if (!u) return ""
  if (/^(https?:|mailto:|tel:|#)/i.test(u)) return u
  return `/sites/${slug}/${u.replace(/^\/+/, "")}`
}
