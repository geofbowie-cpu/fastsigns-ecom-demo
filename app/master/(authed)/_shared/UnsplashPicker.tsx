"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"

export interface UnsplashPhoto {
  id: string
  thumb: string
  regular: string
  alt: string
  photographer: string
  photographerUrl: string
  photoUrl: string
  color: string
}

interface Props {
  /** Called with the regular-size URL when the user confirms a pick. */
  onSelect: (url: string, photo: UnsplashPhoto) => void
  onClose: () => void
  /** Pre-filled search query. */
  defaultQuery?: string
}

const SUGGESTIONS = [
  "office signs",
  "retail storefront",
  "trade show",
  "warehouse",
  "corporate lobby",
  "outdoor signage",
  "restaurant interior",
  "hospital wayfinding",
]

export default function UnsplashPicker({ onSelect, onClose, defaultQuery = "business signage" }: Props) {
  const [query, setQuery] = useState(defaultQuery)
  const [committed, setCommitted] = useState(defaultQuery)
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<UnsplashPhoto | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const search = useCallback(async (q: string) => {
    if (!q.trim()) return
    setLoading(true)
    setError(null)
    setSelected(null)
    try {
      const res = await fetch(`/api/master/unsplash?q=${encodeURIComponent(q.trim())}`)
      const j = await res.json()
      if (!res.ok) { setError(j.error ?? "Search failed"); return }
      setPhotos(j.photos ?? [])
      if ((j.photos ?? []).length === 0) setError("No photos found — try a different search.")
    } catch {
      setError("Network error. Try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  // Run initial search on mount
  useEffect(() => {
    search(defaultQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setCommitted(query)
    search(query)
  }

  async function handleSelect(photo: UnsplashPhoto) {
    // Trigger Unsplash download tracking (TOS requirement)
    fetch(`/api/master/unsplash?track=${photo.id}`).catch(() => {})
    onSelect(photo.regular, photo)
    onClose()
  }

  const modal = (
    <div
      className="fixed inset-0 z-[1000] bg-black/60 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col"
        style={{ maxHeight: "min(90vh, 780px)" }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
          {/* Unsplash wordmark (SVG) */}
          <svg viewBox="0 0 32 32" className="w-5 h-5 shrink-0" fill="currentColor">
            <path d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z" />
          </svg>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-bold text-gray-900">Choose a hero photo from Unsplash</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 shrink-0">
          <div className="relative flex-1">
            <svg viewBox="0 0 24 24" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search photos…"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-4 py-2 bg-gray-900 hover:bg-gray-700 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {loading ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" />
              </svg>
            ) : "Search"}
          </button>
        </form>

        {/* Suggestion chips */}
        <div className="flex items-center gap-1.5 px-5 py-2 flex-wrap border-b border-gray-50 shrink-0">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { setQuery(s); setCommitted(s); search(s) }}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                committed === s
                  ? "bg-gray-900 text-white border-gray-900"
                  : "border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Photo grid */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {error && !loading && (
            <p className="text-sm text-red-600 text-center py-8">{error}</p>
          )}

          {loading && (
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-gray-100 animate-pulse" style={{ aspectRatio: "16/9" }} />
              ))}
            </div>
          )}

          {!loading && !error && photos.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setSelected(selected?.id === photo.id ? null : photo)}
                  className={`group relative rounded-xl overflow-hidden text-left transition-all focus:outline-none ${
                    selected?.id === photo.id
                      ? "ring-2 ring-blue-500 ring-offset-1"
                      : "hover:ring-2 hover:ring-gray-400 hover:ring-offset-1"
                  }`}
                  style={{ aspectRatio: "16/9", backgroundColor: photo.color }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.thumb}
                    alt={photo.alt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* Photographer overlay */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={photo.photographerUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[10px] text-white/90 hover:text-white truncate block"
                    >
                      {photo.photographer}
                    </a>
                  </div>
                  {/* Selected check */}
                  {selected?.id === photo.id && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                      <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-white">
                        <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer — attribution + confirm */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl shrink-0">
          {selected ? (
            <>
              <div className="flex-1 min-w-0 text-xs text-gray-500 truncate">
                Photo by{" "}
                <a href={selected.photographerUrl} target="_blank" rel="noreferrer"
                  className="font-medium text-gray-700 hover:underline">{selected.photographer}</a>
                {" on "}
                <a href={selected.photoUrl} target="_blank" rel="noreferrer"
                  className="font-medium text-gray-700 hover:underline">Unsplash</a>
              </div>
              <button
                type="button"
                onClick={() => handleSelect(selected)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Use photo
              </button>
            </>
          ) : (
            <p className="text-xs text-gray-400 flex-1">
              {photos.length > 0 ? "Click a photo to select it." : "Photos from Unsplash — free to use."}
            </p>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )

  return typeof window !== "undefined" ? createPortal(modal, document.body) : null
}
