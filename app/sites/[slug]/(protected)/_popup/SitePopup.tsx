"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import PopupModal from "@/components/popup/PopupModal"
import { popupCtaHref, type TenantPopup } from "@/lib/popup"
import { trackPopupCtaClick, trackPopupDismissed, trackPopupShown } from "@/lib/track"

// Owns *when* the popup fires and how often a visitor sees it. PopupModal does
// the rendering; in "embed" mode the pasted script draws its own overlay and we
// only control when it gets injected.
//
// `preview` (master admin) always shows the popup and never writes storage or
// analytics — so previewing a site doesn't burn the visitor's frequency cap or
// inflate the numbers.

const KEY_PREFIX = "fs_popup_seen_"

function seenKey(slug: string) {
  return `${KEY_PREFIX}${slug}`
}

function isSuppressed(slug: string, frequencyDays: number): boolean {
  if (frequencyDays <= 0) return false
  try {
    const raw = window.localStorage.getItem(seenKey(slug))
    const ts = Number(raw)
    if (!raw || !Number.isFinite(ts)) return false
    return Date.now() - ts < frequencyDays * 86_400_000
  } catch {
    return false // private mode / storage blocked — show it
  }
}

function markSeen(slug: string) {
  try {
    window.localStorage.setItem(seenKey(slug), String(Date.now()))
  } catch {
    /* non-fatal */
  }
}

// innerHTML doesn't execute <script>, so rebuild each one to make it run.
function injectEmbed(html: string, container: HTMLElement) {
  container.innerHTML = html
  container.querySelectorAll("script").forEach((old) => {
    const next = document.createElement("script")
    for (const attr of Array.from(old.attributes)) next.setAttribute(attr.name, attr.value)
    next.text = old.textContent ?? ""
    old.replaceWith(next)
  })
}

export default function SitePopup({
  slug,
  popup,
  buttonColor,
  buttonTextColor,
  preview,
}: {
  slug: string
  popup: TenantPopup
  buttonColor?: string
  buttonTextColor?: string
  preview?: boolean
}) {
  const [open, setOpen] = useState(false)
  const embedRef = useRef<HTMLDivElement>(null)
  const firedRef = useRef(false)

  // ── Arm the trigger (once per mount) ──
  useEffect(() => {
    if (!popup.enabled || firedRef.current) return
    if (!preview && isSuppressed(slug, popup.frequencyDays)) return

    let cancelled = false
    const fire = () => {
      if (cancelled || firedRef.current) return
      firedRef.current = true
      setOpen(true)
    }

    const timers: number[] = []
    const cleanups: (() => void)[] = []

    const armDelay = (seconds: number) => {
      timers.push(window.setTimeout(fire, Math.max(0, seconds) * 1000))
    }

    switch (popup.trigger) {
      case "load":
        armDelay(0)
        break
      case "delay":
        armDelay(popup.delaySeconds)
        break
      case "scroll": {
        const onScroll = () => {
          const doc = document.documentElement
          const total = doc.scrollHeight || 1
          const seen = ((window.scrollY + window.innerHeight) / total) * 100
          if (seen >= popup.scrollPercent) fire()
        }
        window.addEventListener("scroll", onScroll, { passive: true })
        cleanups.push(() => window.removeEventListener("scroll", onScroll))
        onScroll() // short pages are already "fully scrolled"
        break
      }
      case "exit": {
        // Touch devices have no exit intent — fall back to a delay so mobile
        // visitors still see it.
        if (window.matchMedia?.("(pointer: coarse)").matches) {
          armDelay(popup.delaySeconds || 15)
          break
        }
        const onLeave = (e: MouseEvent) => {
          if (e.clientY <= 0 && !e.relatedTarget) fire()
        }
        document.addEventListener("mouseout", onLeave)
        cleanups.push(() => document.removeEventListener("mouseout", onLeave))
        break
      }
    }

    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
      cleanups.forEach((fn) => fn())
    }
  }, [slug, preview, popup])

  // ── On show: record + track, and inject the embed ──
  useEffect(() => {
    if (!open) return
    if (!preview) {
      markSeen(slug)
      trackPopupShown(slug, popup.mode, popup.trigger)
    }
    if (popup.mode === "embed" && embedRef.current && popup.embedCode.trim()) {
      injectEmbed(popup.embedCode, embedRef.current)
    }
  }, [open, preview, slug, popup])

  const close = useCallback(
    (how: string) => {
      setOpen(false)
      if (!preview) trackPopupDismissed(slug, how)
    },
    [preview, slug]
  )

  if (!popup.enabled || !open) return null

  if (popup.mode === "embed") {
    const mount = <div ref={embedRef} data-site-popup="embed" />
    // Most snippets (HubSpot form embeds especially) render inline wherever
    // they land, so frame them ourselves. Un-framed is for snippets that
    // position themselves.
    if (!popup.embedFramed) return mount
    return (
      <PopupModal popup={popup} ctaHref="" onClose={close}>
        {mount}
      </PopupModal>
    )
  }

  if (!popup.heading.trim()) return null

  const href = popupCtaHref(popup.ctaUrl, slug)

  return (
    <PopupModal
      popup={popup}
      ctaHref={href}
      buttonColor={buttonColor}
      buttonTextColor={buttonTextColor}
      onClose={close}
      onCta={() => {
        if (!preview) trackPopupCtaClick(slug, popup.ctaText, href)
      }}
    />
  )
}
