import * as React from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

export type SearchBarProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size"
> & {
  /** Accent color for the trailing Search button. Brand-agnostic. */
  accent?: string
  /** Visible label on the trailing button. */
  buttonLabel?: string
  className?: string
  inputClassName?: string
}

/**
 * Amazon-style joined search input + button. A leading magnifier sits inside
 * the field; the trailing accent button is fused to the right edge.
 */
export function SearchBar({
  accent = "#0f766e",
  buttonLabel = "Search",
  className,
  inputClassName,
  placeholder = "Search products, materials, SKUs…",
  ...rest
}: SearchBarProps) {
  return (
    <div
      className={cn(
        "flex h-11 w-full items-stretch overflow-hidden rounded-card bg-white shadow-soft ring-1 ring-ink-200 transition-shadow focus-within:ring-2",
        className
      )}
      style={{ ["--sb-accent" as string]: accent }}
    >
      <div className="pointer-events-none flex items-center pl-3 text-ink-400">
        <Search className="h-5 w-5" />
      </div>
      <input
        type="search"
        placeholder={placeholder}
        className={cn(
          "min-w-0 flex-1 bg-transparent px-3 font-body text-[0.95rem] text-ink-900 placeholder:text-ink-400 focus:outline-none",
          inputClassName
        )}
        {...rest}
      />
      <button
        type="submit"
        className="flex shrink-0 items-center gap-2 px-5 font-body text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/60"
        style={{ backgroundColor: accent }}
      >
        <Search className="h-4 w-4 sm:hidden" />
        <span className="hidden sm:inline">{buttonLabel}</span>
      </button>
    </div>
  )
}
