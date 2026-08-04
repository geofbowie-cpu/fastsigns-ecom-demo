"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SiteCardActions({
  id,
  slug,
  name,
}: {
  id: string
  slug: string
  name: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [slugInput, setSlugInput] = useState("")
  const [cloneMode, setCloneMode] = useState(false)
  const [cloneName, setCloneName] = useState(`${name} Copy`)
  const [cloneSlug, setCloneSlug] = useState(`${slug}-copy`)
  const [cloneErr, setCloneErr] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setConfirmDelete(false)
        setSlugInput("")
        setCloneMode(false)
        setCloneErr(null)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  async function clone() {
    setCloneErr(null)
    if (!cloneName.trim() || !cloneSlug.trim()) { setCloneErr("Name and slug are required."); return }
    setBusy(true)
    try {
      const res = await fetch(`/api/master/tenants/${id}/clone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cloneName.trim(), slug: cloneSlug.trim() }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) { setCloneErr(j.error ?? "Clone failed"); return }
      setOpen(false); setCloneMode(false)
      router.push(`/master/sites/${j.tenant.id}/edit`)
    } catch {
      setCloneErr("Network error. Try again.")
    } finally {
      setBusy(false)
    }
  }

  async function archive() {
    if (!confirm(`Archive "${name}"? It will be hidden but recoverable.`)) return
    setBusy(true)
    setOpen(false)
    try {
      await fetch(`/api/master/tenants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: true }),
      })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  async function permanentDelete() {
    if (slugInput !== slug) return
    setBusy(true)
    setOpen(false)
    setConfirmDelete(false)
    try {
      await fetch(`/api/master/tenants/${id}?permanent=true`, { method: "DELETE" })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={busy}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v) }}
        className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-40"
        title="Site actions"
      >
        {busy ? (
          <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
            <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
          </svg>
        )}
      </button>

      {open && !confirmDelete && !cloneMode && (
        <div className="absolute right-0 bottom-8 z-50 w-44 bg-white border border-gray-200 rounded-xl shadow-lg py-1 text-sm">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCloneName(`${name} Copy`); setCloneSlug(`${slug}-copy`); setCloneErr(null); setCloneMode(true) }}
            className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-gray-400" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V5a2 2 0 012-2h9a2 2 0 012 2v9a2 2 0 01-2 2h-2M5 8h9a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2v-9a2 2 0 012-2z" />
            </svg>
            Clone site
          </button>
          <div className="border-t border-gray-100 my-1" />
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); archive() }}
            className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-gray-400" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v0a2 2 0 01-2 2M5 8l1 10a2 2 0 002 2h8a2 2 0 002-2L19 8" />
            </svg>
            Archive site
          </button>
          <div className="border-t border-gray-100 my-1" />
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDelete(true) }}
            className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete permanently
          </button>
        </div>
      )}

      {open && cloneMode && (
        <div
          className="absolute right-0 bottom-8 z-50 w-72 bg-white border border-gray-200 rounded-xl shadow-lg p-3 space-y-2"
          onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
        >
          <p className="text-xs font-semibold text-gray-700">Clone &ldquo;{name}&rdquo;</p>
          <p className="text-[11px] text-gray-400 leading-snug">
            Copies brand, categories, product overrides, featured list, and settings
            into a new Demo site. Orders and visitors are not copied.
          </p>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-0.5">New name</label>
            <input
              value={cloneName}
              onChange={(e) => setCloneName(e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-0.5">New slug (fixed after creation)</label>
            <input
              value={cloneSlug}
              onChange={(e) => setCloneSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              onKeyDown={(e) => e.key === "Enter" && clone()}
              placeholder="new-site-slug"
              className="w-full px-2 py-1.5 text-xs font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          {cloneErr && <p className="text-[11px] text-red-600">{cloneErr}</p>}
          <div className="flex gap-2 pt-0.5">
            <button
              type="button"
              disabled={busy || !cloneName.trim() || !cloneSlug.trim()}
              onClick={clone}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold py-1.5 rounded-lg"
            >
              {busy ? "Cloning…" : "Clone site"}
            </button>
            <button
              type="button"
              onClick={() => { setCloneMode(false); setCloneErr(null); setOpen(false) }}
              className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold py-1.5 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {open && confirmDelete && (
        <div
          className="absolute right-0 bottom-8 z-50 w-64 bg-white border border-red-200 rounded-xl shadow-lg p-3 space-y-2"
          onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
        >
          <p className="text-xs text-red-700 font-medium">
            Type <span className="font-mono bg-red-50 px-1 rounded">{slug}</span> to confirm
          </p>
          <input
            autoFocus
            value={slugInput}
            onChange={(e) => setSlugInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && permanentDelete()}
            placeholder={slug}
            className="w-full px-2 py-1.5 text-xs font-mono border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={slugInput !== slug}
              onClick={permanentDelete}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-semibold py-1.5 rounded-lg"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => { setConfirmDelete(false); setSlugInput(""); setOpen(false) }}
              className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold py-1.5 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
