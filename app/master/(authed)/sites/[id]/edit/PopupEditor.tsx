"use client"

import { useState } from "react"
import Link from "next/link"
import PopupModal from "@/components/popup/PopupModal"
import { popupCtaHref, type PopupMode, type PopupTrigger, type TenantPopup } from "@/lib/popup"

const inputCls =
  "w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"

const MODES: { value: PopupMode; label: string; hint: string }[] = [
  {
    value: "modal",
    label: "Built-in modal",
    hint: "We render it. Headline, copy, optional image, and a CTA button — styled with the site's brand colors.",
  },
  {
    value: "embed",
    label: "Pasted code",
    hint: "Paste a HubSpot (or other) popup snippet. Their script draws its own overlay — the content fields below don't apply.",
  },
]

const TRIGGERS: { value: PopupTrigger; label: string }[] = [
  { value: "delay", label: "After a delay" },
  { value: "load", label: "Immediately on load" },
  { value: "scroll", label: "After scrolling" },
  { value: "exit", label: "On exit intent" },
]

export default function PopupEditor({
  value,
  onChange,
  slug,
  buttonColor,
  buttonTextColor,
}: {
  value: TenantPopup
  onChange: (patch: Partial<TenantPopup>) => void
  slug: string
  buttonColor?: string
  buttonTextColor?: string
}) {
  const [preview, setPreview] = useState(false)

  const set = <K extends keyof TenantPopup>(key: K, v: TenantPopup[K]) => onChange({ [key]: v } as Partial<TenantPopup>)

  return (
    <div className="space-y-3">
      {/* On/off */}
      <Row label="Enable popup">
        <div className="flex items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={value.enabled}
            onClick={() => set("enabled", !value.enabled)}
            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
              value.enabled ? "bg-blue-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                value.enabled ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
          <span className="text-xs text-gray-500">
            {value.enabled ? "On — shows on every page of this site" : "Off — no popup"}
          </span>
        </div>
      </Row>

      {value.enabled && (
        <>
          {/* Mode */}
          <div className="flex gap-3 pt-1">
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => set("mode", m.value)}
                className={`flex-1 rounded-lg border py-2.5 text-sm font-semibold transition-colors ${
                  value.mode === m.value
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] leading-relaxed text-gray-500">
            {MODES.find((m) => m.value === value.mode)?.hint}
          </p>

          {/* ── Pasted code ── */}
          {value.mode === "embed" ? (
            <div className="space-y-2">
              <Row label="Embed code" wide>
                <textarea
                  value={value.embedCode}
                  onChange={(e) => set("embedCode", e.target.value)}
                  rows={7}
                  spellCheck={false}
                  placeholder={'<!-- HubSpot popup / form embed -->\n<script src="//js.hsforms.net/forms/embed/v2.js"></script>\n<script>…</script>'}
                  className={`${inputCls} font-mono text-[11px] leading-relaxed`}
                />
              </Row>
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                <strong>This runs as-is on the live site.</strong> Only paste code from a source you
                trust (HubSpot, your own tag manager) — it can read and change anything on the page.
                Preview the site after saving to confirm it fires.
              </p>
            </div>
          ) : (
            /* ── Built-in modal ── */
            <div className="space-y-1">
              <Row label="Headline" hint="required">
                <input
                  value={value.heading}
                  onChange={(e) => set("heading", e.target.value)}
                  placeholder="Save 15% on your first order"
                  className={inputCls}
                />
              </Row>
              <Row label="Body copy" wide>
                <textarea
                  value={value.body}
                  onChange={(e) => set("body", e.target.value)}
                  rows={3}
                  placeholder="Tell us about your project and we'll put together a quote within one business day."
                  className={inputCls}
                />
              </Row>
              <Row label="Image URL" hint="optional — shown across the top">
                <input
                  value={value.imageUrl}
                  onChange={(e) => set("imageUrl", e.target.value)}
                  placeholder="https://…"
                  className={inputCls}
                />
              </Row>
              <Row label="Button text">
                <input
                  value={value.ctaText}
                  onChange={(e) => set("ctaText", e.target.value)}
                  placeholder="Get my quote"
                  className={inputCls}
                />
              </Row>
              <Row label="Button link" hint="full URL, or a site path like products">
                <input
                  value={value.ctaUrl}
                  onChange={(e) => set("ctaUrl", e.target.value)}
                  placeholder="https://info.example.com/offer"
                  className={inputCls}
                />
              </Row>
              <Row label="Dismiss text" hint="blank = X button only">
                <input
                  value={value.dismissText}
                  onChange={(e) => set("dismissText", e.target.value)}
                  placeholder="No thanks"
                  className={inputCls}
                />
              </Row>
            </div>
          )}

          {/* ── Behaviour ── */}
          <div className="space-y-1 border-t border-gray-100 pt-3">
            <Row label="Show it">
              <select
                value={value.trigger}
                onChange={(e) => set("trigger", e.target.value as PopupTrigger)}
                className={inputCls}
              >
                {TRIGGERS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Row>

            {(value.trigger === "delay" || value.trigger === "exit") && (
              <Row
                label="Delay (seconds)"
                hint={value.trigger === "exit" ? "fallback on touch devices, which have no exit intent" : undefined}
              >
                <input
                  type="number"
                  min={0}
                  max={300}
                  value={value.delaySeconds}
                  onChange={(e) => set("delaySeconds", Number(e.target.value))}
                  className={`${inputCls} w-24`}
                />
              </Row>
            )}

            {value.trigger === "scroll" && (
              <Row label="Scroll depth (%)">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={value.scrollPercent}
                  onChange={(e) => set("scrollPercent", Number(e.target.value))}
                  className={`${inputCls} w-24`}
                />
              </Row>
            )}

            <Row label="Show again after" hint="days — 0 shows it on every page view">
              <input
                type="number"
                min={0}
                max={365}
                value={value.frequencyDays}
                onChange={(e) => set("frequencyDays", Number(e.target.value))}
                className={`${inputCls} w-24`}
              />
            </Row>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => setPreview((v) => !v)}
              disabled={value.mode === "embed"}
              title={value.mode === "embed" ? "Pasted code can only be previewed on the live site" : undefined}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-gray-400 disabled:opacity-40"
            >
              {preview ? "Hide preview" : "Preview popup"}
            </button>
            <span className="text-[11px] text-gray-400">
              Unsaved edits show in the preview. Save before checking the live site.
            </span>
          </div>

          {preview && value.mode === "modal" && (
            <div className="flex justify-center rounded-xl border border-gray-200 bg-gray-100 p-6">
              {value.heading.trim() ? (
                <PopupModal
                  inline
                  popup={value}
                  ctaHref={popupCtaHref(value.ctaUrl, slug)}
                  buttonColor={buttonColor}
                  buttonTextColor={buttonTextColor}
                  onClose={() => setPreview(false)}
                />
              ) : (
                <p className="text-xs italic text-gray-400">Add a headline to preview.</p>
              )}
            </div>
          )}

          <p className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
            Popup views, dismissals, and CTA clicks show up under{" "}
            <Link href="/master/analytics" target="_blank" className="underline">
              Analytics
            </Link>
            . While you&rsquo;re signed in as admin the popup always shows and isn&rsquo;t counted, so
            you can keep previewing it.
          </p>
        </>
      )}
    </div>
  )
}

function Row({
  label,
  hint,
  wide,
  children,
}: {
  label: string
  hint?: string
  wide?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`grid gap-2 py-1 ${wide ? "grid-cols-1" : "grid-cols-[140px_1fr] items-center"}`}>
      <div>
        <span className="text-xs text-gray-500">{label}</span>
        {hint && <span className="block text-[11px] leading-tight text-gray-400">{hint}</span>}
      </div>
      <div>{children}</div>
    </div>
  )
}
