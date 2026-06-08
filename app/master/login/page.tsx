"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"

const URL_ERRORS: Record<string, string> = {
  auth_failed: "That sign-in link couldn't be verified. Please request a new one.",
  invalid_link: "That link has expired or was already used. Request a fresh one below.",
  not_authorized: "This email isn't authorized for admin access.",
  missing_code: "Something went wrong with that link. Please try again.",
}

function MasterLogin() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  // Surface errors handed back by the callback via ?error=
  useEffect(() => {
    const e = searchParams.get("error")
    if (e && URL_ERRORS[e]) setError(URL_ERRORS[e])
  }, [searchParams])

  // Cooldown ticker for the resend button
  useEffect(() => {
    if (cooldown <= 0) return
    timer.current = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [cooldown])

  async function send(targetEmail: string) {
    setError(null)
    setBusy(true)
    try {
      const res = await fetch("/api/auth/master-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail.trim().toLowerCase() }),
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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="mb-6">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">
              FASTSIGNS
            </div>
            <h1 className="text-2xl font-black text-gray-900">Demo Builder</h1>
          </div>

          {sent ? (
            <div>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-50 mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Check your email</h2>
              <p className="text-sm text-gray-600 mb-4">
                We sent a sign-in link to <strong className="text-gray-900">{email}</strong>. Click it to sign in — it expires in 1 hour.
              </p>
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 mb-5">
                <p className="text-xs text-amber-800">
                  Don't see it? Check your <strong>spam</strong> or <strong>junk</strong> folder — corporate filters sometimes hold these for a minute or two.
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
                className="w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
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
              <p className="text-sm text-gray-500 mb-6">
                Enter your work email and we'll send you a secure sign-in link.
              </p>
              <form onSubmit={submit}>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Work email
                </label>
                <input
                  type="email"
                  autoFocus
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="you@fastsigns.com"
                />
                {error && (
                  <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={busy || !email.trim()}
                  className="mt-5 w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
                >
                  {busy ? "Sending…" : "Send sign-in link"}
                </button>
              </form>
            </>
          )}
        </div>
        <p className="text-center text-xs text-gray-500 mt-6">
          Need access? Contact your administrator.
        </p>
      </div>
    </div>
  )
}

export default function MasterLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900" />}>
      <MasterLogin />
    </Suspense>
  )
}
