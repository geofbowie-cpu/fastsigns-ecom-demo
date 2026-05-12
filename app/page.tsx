"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"

function LoginForm() {
  const searchParams = useSearchParams()
  const errorParam = searchParams.get("error")

  const [email, setEmail] = useState("")
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  const errorMessages: Record<string, string> = {
    missing_code:   "Invalid magic link — please request a new one.",
    invalid_link:   "This link has expired or already been used. Request a new one.",
    not_authorized: "This email isn't on the access list. Contact your FASTSIGNS admin.",
  }
  const errorMsg = errorParam ? (errorMessages[errorParam] ?? "Something went wrong.") : null

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setBusy(true)
    try {
      await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
      setSent(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-yellow-400 rounded-2xl mb-4">
            <span className="text-2xl font-black text-gray-900">FS</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">FASTSIGNS</h1>
          <p className="text-sm text-gray-400 mt-1">Demo Builder Portal</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">📬</div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Check your email</h2>
              <p className="text-sm text-gray-500">
                We sent a magic link to{" "}
                <span className="font-semibold text-gray-900">{email}</span>.
                Click it to sign in — the link expires in 1 hour.
              </p>
              <button
                onClick={() => { setSent(false); setEmail("") }}
                className="mt-5 text-xs text-blue-600 hover:underline"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Sign in</h2>
              <p className="text-sm text-gray-500 mb-6">
                Enter your email and we'll send you a magic link — no password needed.
              </p>

              {errorMsg && (
                <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    autoFocus
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy || !email.trim()}
                  className="w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
                >
                  {busy ? "Sending…" : "Send magic link →"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Need access?{" "}
          <a href="mailto:support@fastsigns.com" className="text-gray-400 hover:text-white">
            Contact your rep
          </a>
        </p>
      </div>
    </div>
  )
}

export default function RootPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
