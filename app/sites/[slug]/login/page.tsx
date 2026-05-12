"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"

export default function TenantLoginPage() {
  const { slug } = useParams<{ slug: string }>()
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Brand colours loaded from the API so the page feels on-brand
  const [brand, setBrand] = useState<{ primaryColor: string; logoImage?: string; logoText?: string; company?: string } | null>(null)

  useEffect(() => {
    fetch(`/api/master/tenants/by-slug/${slug}`)
      .then((r) => r.json())
      .then((d) => d.tenant?.brand && setBrand(d.tenant.brand))
      .catch(() => {})
  }, [slug])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const res = await fetch("/api/auth/tenant-magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), slug }),
    })
    const j = await res.json()
    setBusy(false)
    if (!res.ok) { setError(j.error ?? "Something went wrong"); return }
    setSent(true)
  }

  const primary = brand?.primaryColor ?? "#1e3a5f"

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div
          className="w-full rounded-xl flex items-center justify-center py-6 mb-8"
          style={{ backgroundColor: primary }}
        >
          {brand?.logoImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logoImage} alt={brand.company ?? slug} className="h-10 w-auto" />
          ) : (
            <span className="text-white font-black text-xl tracking-wide">
              {brand?.logoText ?? brand?.company ?? slug.toUpperCase()}
            </span>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          {sent ? (
            <div className="text-center">
              <div className="text-4xl mb-3">📬</div>
              <h1 className="text-lg font-bold text-gray-900 mb-2">Check your email</h1>
              <p className="text-sm text-gray-500">
                We sent a sign-in link to <strong>{email}</strong>. It expires in 1 hour.
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-bold text-gray-900 mb-1">Sign in to view this site</h1>
              <p className="text-sm text-gray-500 mb-6">
                Enter your work email and we'll send you a link.
              </p>
              <form onSubmit={submit} className="space-y-4">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@yourcompany.com"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {error && <p className="text-xs text-red-600">{error}</p>}
                <button
                  type="submit"
                  disabled={busy || !email.trim()}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
                  style={{ backgroundColor: primary }}
                >
                  {busy ? "Sending…" : "Send sign-in link"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by <span className="font-semibold">FASTSIGNS</span>
        </p>
      </div>
    </div>
  )
}
