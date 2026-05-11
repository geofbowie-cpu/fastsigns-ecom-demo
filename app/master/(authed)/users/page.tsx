"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type PortalUser = { email: string; created_at: string; last_sign_in_at: string | null }

export default function UsersPage() {
  const [users, setUsers] = useState<PortalUser[]>([])
  const [loading, setLoading] = useState(true)
  const [newEmail, setNewEmail] = useState("")
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch("/api/master/users")
    const j = await res.json()
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

  function fmt(iso: string | null) {
    if (!iso) return "Never"
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href="/master" className="text-xs text-gray-500 hover:text-gray-900 mb-1 inline-flex items-center gap-1">
          ← All sites
        </Link>
        <h1 className="text-2xl font-black text-gray-900">Portal users</h1>
        <p className="text-sm text-gray-500 mt-1">
          Only these emails can sign in via magic link at the main page.
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
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">
            {loading ? "Loading…" : `${users.length} user${users.length !== 1 ? "s" : ""}`}
          </h2>
        </div>

        {!loading && users.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-gray-400">
            No users yet — add one above.
          </div>
        )}

        {users.map((u) => (
          <div key={u.email} className="flex items-center justify-between px-5 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50">
            <div>
              <div className="text-sm font-medium text-gray-900">{u.email}</div>
              <div className="text-xs text-gray-400 mt-0.5">
                Added {fmt(u.created_at)} · Last sign-in: {fmt(u.last_sign_in_at)}
              </div>
            </div>
            <button
              onClick={() => removeUser(u.email)}
              className="text-xs text-red-500 hover:text-red-700 font-medium ml-4 shrink-0"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
