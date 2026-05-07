"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function MasterLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const res = await fetch("/api/master/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setError(j.error ?? "Login failed")
        return
      }
      router.replace("/master")
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <form
        onSubmit={submit}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8"
      >
        <div className="mb-6">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">
            FASTSIGNS
          </div>
          <h1 className="text-2xl font-black text-gray-900">Demo Builder</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sign in to spin up branded prospect sites.
          </p>
        </div>
        <label className="block text-xs font-semibold text-gray-700 mb-2">
          Master password
        </label>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="••••••••••••"
        />
        {error && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={busy || !password}
          className="mt-5 w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  )
}
