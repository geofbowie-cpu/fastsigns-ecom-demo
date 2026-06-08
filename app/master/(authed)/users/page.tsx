"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type PortalUser = {
  email: string
  created_at: string
  last_sign_in_at: string | null
  has_password: boolean
}

function fmt(iso: string | null) {
  if (!iso) return "Never"
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function SetPasswordRow({ email, hasPassword, onDone }: { email: string; hasPassword: boolean; onDone: () => void }) {
  const [open, setOpen]       = useState(false)
  const [pw, setPw]           = useState("")
  const [confirm, setConfirm] = useState("")
  const [busy, setBusy]       = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (pw.length < 8)  { setError("Password must be at least 8 characters."); return }
    if (pw !== confirm) { setError("Passwords don't match."); return }
    setBusy(true)
    try {
      const res = await fetch("/api/master/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pw }),
      })
      const j = await res.json()
      if (!res.ok) { setError(j.error ?? "Failed"); return }
      setSuccess(true)
      setPw("")
      setConfirm("")
      setTimeout(() => { setOpen(false); setSuccess(false); onDone() }, 1200)
    } catch {
      setError("Network error.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-2">
      {!open ? (
        <button
          type="button"
          onClick={() => { setOpen(true); setError(null); setPw(""); setConfirm("") }}
          className="text-xs font-medium text-blue-600 hover:text-blue-800"
        >
          {hasPassword ? "Change password" : "Set password"}
        </button>
      ) : (
        <form onSubmit={save} className="mt-1 space-y-2">
          <div className="flex gap-2 flex-wrap">
            <input
              type="password"
              autoFocus
              required
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="New password (min 8 chars)"
              className="flex-1 min-w-[160px] px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm password"
              className="flex-1 min-w-[160px] px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error   && <p className="text-xs text-red-600">{error}</p>}
          {success && <p className="text-xs text-green-600 font-medium">✓ Password saved</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy || !pw || !confirm}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
            >
              {busy ? "Saving…" : "Save password"}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setError(null) }}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default function UsersPage() {
  const [users, setUsers]       = useState<PortalUser[]>([])
  const [loading, setLoading]   = useState(true)
  const [newEmail, setNewEmail] = useState("")
  const [adding, setAdding]     = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch("/api/master/users")
    const j   = await res.json()
    setUsers(j.users ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addUser(e: React.FormEvent) {
    e.preventDefault()
    if (!newEmail.trim()) return
    setAdding(true)
    setError(null)
    const res = await fetch("/api/master/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail.trim() }),
    })
    const j = await res.json()
    if (!res.ok) { setError(j.error); setAdding(false); return }
    setNewEmail("")
    setAdding(false)
    load()
  }

  async function removeUser(email: string) {
    if (!confirm(`Remove ${email}?`)) return
    await fetch("/api/master/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    load()
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href="/master" className="text-xs text-gray-500 hover:text-gray-900 mb-1 inline-flex items-center gap-1">
          ← All sites
        </Link>
        <h1 className="text-2xl font-black text-gray-900">Portal users</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage who can sign in. Users can log in via email link or password once you set one.
        </p>
      </div>

      {/* Add user */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="text-sm font-bold text-gray-900 mb-3">Add user</h2>
        <form onSubmit={addUser} className="flex gap-2">
          <input
            type="email"
            required
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="name@company.com"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={adding || !newEmail.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg"
          >
            {adding ? "Adding…" : "Add"}
          </button>
        </form>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>

      {/* User list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">
            {loading ? "Loading…" : `${users.length} user${users.length !== 1 ? "s" : ""}`}
          </h2>
        </div>

        {!loading && users.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-gray-400">No users yet — add one above.</div>
        )}

        {users.map((u) => (
          <div key={u.email} className="px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-900">{u.email}</span>
                  {u.has_password ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                      <svg viewBox="0 0 24 24" fill="none" className="w-2.5 h-2.5">
                        <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
                        <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      Password set
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">
                      Link only
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Added {fmt(u.created_at)} · Last sign-in: {fmt(u.last_sign_in_at)}
                </div>
                <SetPasswordRow email={u.email} hasPassword={u.has_password} onDone={load} />
              </div>
              <button
                onClick={() => removeUser(u.email)}
                className="text-xs text-red-500 hover:text-red-700 font-medium shrink-0 mt-0.5"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
