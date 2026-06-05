"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useRef, useTransition } from "react"

export default function V2SearchBox({
  slug,
  defaultValue,
  navTextColor,
}: {
  slug: string
  defaultValue?: string
  navTextColor: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)
  const [, startTransition] = useTransition()

  const push = useCallback(
    (q: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (q.trim()) {
        params.set("q", q.trim())
      } else {
        params.delete("q")
      }
      // replace + startTransition keeps the input focused while the server
      // re-renders the page — same pattern as the working SearchInput component
      startTransition(() => {
        router.replace(`/sites/${slug}/products?${params.toString()}`)
      })
    },
    [router, searchParams, slug]
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    push(inputRef.current?.value ?? "")
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    push(e.target.value)
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 max-w-2xl">
      <div className="rounded-card border-2 border-white/20 bg-white/10 flex items-center h-10 px-3 gap-2">
        <svg
          className="h-4 w-4 flex-shrink-0"
          style={{ color: navTextColor, opacity: 0.6 }}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
            clipRule="evenodd"
          />
        </svg>
        <input
          ref={inputRef}
          type="search"
          defaultValue={defaultValue ?? ""}
          onChange={handleChange}
          placeholder="Search products, categories…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-50"
          style={{ color: navTextColor }}
        />
      </div>
    </form>
  )
}
