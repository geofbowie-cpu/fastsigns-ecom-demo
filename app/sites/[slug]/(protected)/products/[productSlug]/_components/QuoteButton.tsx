"use client"

import { useState } from "react"

export default function QuoteButton({
  tenantSlug,
  productSlug,
  productName,
  ctaText,
  primaryColor,
}: {
  tenantSlug: string
  productSlug: string
  productName: string
  ctaText: string
  primaryColor: string
}) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [comments, setComments] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  function close() {
    setOpen(false)
    // small delay so the closing transition doesn't flicker the success state away
    setTimeout(() => {
      setSent(false)
      setError(null)
      setBusy(false)
      setEmail("")
      setFirstName("")
      setLastName("")
      setComments("")
    }, 250)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const res = await fetch("/api/quote-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_slug: tenantSlug,
          product_slug: productSlug,
          product_name: productName,
          email: email.trim(),
          first_name: firstName.trim() || undefined,
          last_name: lastName.trim() || undefined,
          comments: comments.trim() || undefined,
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(j.error ?? "Something went wrong")
        return
      }
      setSent(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white hover:opacity-90"
        style={{ backgroundColor: primaryColor }}
      >
        ✉ {ctaText}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-4"
          onClick={close}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-gray-900 text-base">Request a quote</h2>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{productName}</p>
              </div>
              <button
                type="button"
                onClick={close}
                className="text-gray-400 hover:text-gray-700 text-xl leading-none"
              >
                ✕
              </button>
            </div>

            {sent ? (
              <div className="px-6 py-10 text-center">
                <div className="text-4xl mb-3">📬</div>
                <h3 className="font-bold text-gray-900 text-lg mb-1">Thanks — we'll be in touch.</h3>
                <p className="text-sm text-gray-500">
                  We've received your request and will reach out at <strong>{email}</strong>.
                </p>
                <button
                  type="button"
                  onClick={close}
                  className="mt-6 text-xs font-semibold px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-400 text-gray-700"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="p-5 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Work email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">First name</label>
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Last name</label>
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Comments <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={3}
                    placeholder="Sizes, quantities, deadlines…"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={busy || !email.trim()}
                    className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {busy ? "Sending…" : "Send request"}
                  </button>
                  <button
                    type="button"
                    onClick={close}
                    className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
