"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export type FilterOption = {
  label: string
  count: number
}

export type FilterGroup = {
  /** Stable key for the group. */
  id: string
  title: string
  options: FilterOption[]
}

export type FilterRailProps = {
  groups: FilterGroup[]
  /** Accent color for checked boxes and active state. */
  accent?: string
  className?: string
}

/**
 * Left sidebar of collapsible filter groups with checkbox rows + counts.
 * Mock interactivity — real useState toggles so it feels alive in the preview.
 */
export function FilterRail({
  groups,
  accent = "#0f766e",
  className,
}: FilterRailProps) {
  // Which groups are open (all open by default).
  const [open, setOpen] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((g) => [g.id, true]))
  )
  // Which options are checked, keyed by `${groupId}:${label}`.
  const [checked, setChecked] = React.useState<Record<string, boolean>>({})

  const toggleGroup = (id: string) =>
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }))

  const toggleOption = (key: string) =>
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }))

  return (
    <aside className={cn("font-body text-sm", className)}>
      <h2 className="mb-3 font-display text-base font-bold tracking-tight text-ink-900">
        Filters
      </h2>
      <div className="divide-y divide-ink-200 border-y border-ink-200">
        {groups.map((group) => {
          const isOpen = open[group.id]
          return (
            <div key={group.id} className="py-3">
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className="flex w-full items-center justify-between py-1 text-left font-display text-sm font-semibold text-ink-900"
                aria-expanded={isOpen}
              >
                {group.title}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-ink-400 transition-transform duration-200",
                    isOpen && "rotate-180"
                  )}
                />
              </button>
              {isOpen && (
                <ul className="mt-2 flex flex-col gap-1">
                  {group.options.map((opt) => {
                    const key = `${group.id}:${opt.label}`
                    const isChecked = !!checked[key]
                    return (
                      <li key={opt.label}>
                        <label className="group flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1 hover:bg-ink-50">
                          <span
                            className={cn(
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                              isChecked
                                ? "border-transparent"
                                : "border-ink-400 bg-white"
                            )}
                            style={
                              isChecked
                                ? { backgroundColor: accent, borderColor: accent }
                                : undefined
                            }
                          >
                            {isChecked && (
                              <svg
                                viewBox="0 0 12 12"
                                className="h-3 w-3 text-white"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M2.5 6.5l2.5 2.5 4.5-5" />
                              </svg>
                            )}
                          </span>
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={isChecked}
                            onChange={() => toggleOption(key)}
                          />
                          <span
                            className={cn(
                              "flex-1 text-ink-600 transition-colors group-hover:text-ink-900",
                              isChecked && "font-medium text-ink-900"
                            )}
                          >
                            {opt.label}
                          </span>
                          <span className="text-xs text-ink-400">
                            {opt.count}
                          </span>
                        </label>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}
