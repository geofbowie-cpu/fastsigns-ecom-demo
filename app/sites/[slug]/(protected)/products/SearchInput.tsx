"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef, useTransition } from "react"
import { trackSearch } from "@/lib/track"

export default function SearchInput({
  defaultValue,
  primaryColor,
  tenantSlug,
}: {
  defaultValue?: string
  primaryColor: string
  tenantSlug: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fire search tracking event 500ms after the user stops typing
  const fireTrack = useCallback(
    (query: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (!query) return
      debounceRef.current = setTimeout(() => {
        trackSearch(query, 0, tenantSlug)
      }, 500)
    },
    [tenantSlug]
  )

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const params = new URLSearchParams(searchParams.toString())
      if (e.target.value) {
        params.set("q", e.target.value)
      } else {
        params.delete("q")
      }
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`)
      })
      fireTrack(e.target.value)
    },
    [pathname, router, searchParams, fireTrack]
  )

  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
        viewBox="0 0 24 24" fill="none"
      >
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        placeholder="Search products…"
        defaultValue={defaultValue}
        onChange={handleChange}
        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-full text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent"
        style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
      />
    </div>
  )
}
