"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useParams, useSearchParams } from "next/navigation"

const URL_ERRORS: Record<string, string> = {
  auth_failed: "That sign-in link couldn't be verified. Please request a new one.",
  invalid_link: "That link has expired or was already used. Request a fresh one below.",
  missing_code: "Something went wrong with that link. Please try again.",
}

function TenantLogin() {
  const { slug } = useParams<{ slug: string }>()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const [brand, setBrand] = useState<{ primaryColor: string; logoImage?: string; logoText?: string; company?: string } | null>(null)

  useEffect(() => {
    fetch(`/api/master/tenants/by-slug/${slug}`)
      .then((r) => r.json())
      .then((d) => d.tenant?.brand && setBrand(d.tenant.brand))
      .catch(() => {})
  }, [slug])

  useEffect(() => {
    const e = searchParams.get("error")
    if (e && URL_ERRORS[e]) setError(URL_ERRORS[e])
  }, [searchParams])

  useEffect(() => {
    if (cooldown <= 0) return
    timer.current = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [cooldown])

  const primary = brand?.primaryColor ?? "#1e3a5f"

  async function send(targetEmail: string) {
    setError(null)
    setBusy(true)
    try {
      const res = await fetch("/api/auth/tenant-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail.trim().toLowerCase(), slug }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) { setError(j.error ?? "Something went wrong. Please try again."); return }
      setSent(true)
      setCooldown(30)
    } catch {
      setError("Network error. Check your connection and try again.")
    } finally {
      setBusy(false)
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    send(email)
  }

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
            <div>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-50 mb-4 mx-auto">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-lg font-bold text-gray-900 mb-1 text-center">Check your email</h1>
              <p className="text-sm text-gray-600 mb-4 text-center">
                We sent a sign-in link to <strong className="text-gray-900">{email}</strong>. It expires in 1 hour.
              </p>
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 mb-5">
                <p className="text-xs text-amber-800 text-center">
                  Don't see it? Check your <strong>spam</strong> or <strong>junk</strong> folder.
                </p>
              </div>
              {error && (
                <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
              <button
                onClick={() => send(email)}
                disabled={busy || cooldown > 0}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
                style={{ backgroundColor: primary }}
              >
                {busy ? "Sending…" : cooldown > 0 ? `Resend link (${cooldown}s)` : "Resend link"}
              </button>
              <button
                onClick={() => { setSent(false); setError(null); setCooldown(0) }}
                className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700 py-2 transition-colors"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-bold text-gray-900 mb-1">Sign in to view this site</h1>
              <p className="text-sm text-gray-500 mb-6">
                Enter your work email and we'll send you a secure sign-in link.
              </p>
              <form onSubmit={submit} className="space-y-4">
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@yourcompany.com"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
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

export default function TenantLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <TenantLogin />
    </Suspense>
  )
}
