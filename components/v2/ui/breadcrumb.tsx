import * as React from "react"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export type Crumb = {
  label: string
  href?: string
}

export type BreadcrumbProps = React.HTMLAttributes<HTMLElement> & {
  items: Crumb[]
}

/** Simple breadcrumb trail. The last item is rendered as the current page. */
export function Breadcrumb({ items, className, ...rest }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("font-body text-sm text-ink-600", className)}
      {...rest}
    >
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={item.label} className="flex items-center gap-1.5">
              {isLast || !item.href ? (
                <span
                  className={cn(isLast && "font-medium text-ink-900")}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <a
                  href={item.href}
                  className="transition-colors hover:text-ink-900 hover:underline"
                >
                  {item.label}
                </a>
              )}
              {!isLast && (
                <ChevronRight className="h-3.5 w-3.5 text-ink-400" />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
