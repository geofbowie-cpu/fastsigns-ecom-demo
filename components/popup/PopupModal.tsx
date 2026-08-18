"use client"

import { useEffect, useRef } from "react"
import type { TenantPopup } from "@/lib/popup"

// Presentational marketing modal. No triggering, no storage, no tracking —
// SitePopup owns that, and the admin preview reuses this as-is.
export default function PopupModal({
  popup,
  ctaHref,
  buttonColor,
  buttonTextColor,
  onClose,
  onCta,
  /** Preview mode renders inside the admin card instead of over the page. */
  inline,
}: {
  popup: TenantPopup
  ctaHref: string
  buttonColor?: string
  buttonTextColor?: string
  onClose: (how: string) => void
  onCta?: () => void
  inline?: boolean
}) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (inline) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose("escape")
    }
    document.addEventListener("keydown", onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [inline, onClose])

  const external = /^https?:/i.test(ctaHref)

  const card = (
    <div
      role="dialog"
      aria-modal={inline ? undefined : true}
      aria-label={popup.heading || "Offer"}
      onClick={(e) => e.stopPropagation()}
      className={`relative w-full max-w-md overflow-hidden rounded-2xl bg-white text-left shadow-2xl ${
        inline ? "" : "animate-[fadeIn_.15s_ease-out]"
      }`}
    >
      <button
        ref={closeRef}
        type="button"
        onClick={() => onClose("close_button")}
        aria-label="Close"
        className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-500 shadow-sm backdrop-blur hover:text-gray-900"
      >
        ✕
      </button>

      {popup.imageUrl.trim() && (
        // Third-party/CDN art of unknown dimensions — plain <img> avoids
        // next/image remote-pattern config for every prospect's image host.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={popup.imageUrl} alt="" className="h-40 w-full object-cover" />
      )}

      <div className="space-y-3 p-6">
        <h2 className="text-xl font-bold leading-snug text-gray-900">{popup.heading}</h2>
        {popup.body.trim() && (
          <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">{popup.body}</p>
        )}

        {popup.ctaText.trim() && ctaHref && (
          <a
            href={ctaHref}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            onClick={onCta}
            className="mt-1 block w-full rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-opacity hover:opacity-90"
            style={{
              backgroundColor: buttonColor || "#1e3a5f",
              color: buttonTextColor || "#ffffff",
            }}
          >
            {popup.ctaText}
          </a>
        )}

        {popup.dismissText.trim() && (
          <button
            type="button"
            onClick={() => onClose("dismiss_link")}
            className="block w-full text-center text-xs text-gray-400 hover:text-gray-600"
          >
            {popup.dismissText}
          </button>
        )}
      </div>
    </div>
  )

  if (inline) return card

  return (
    <div
      onClick={() => onClose("backdrop")}
      // Above the demo banner (z-100) and the cart button.
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
    >
      {card}
    </div>
  )
}
