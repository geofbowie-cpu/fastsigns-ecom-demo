import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-pill font-body font-medium leading-none px-3 py-1 text-xs tracking-wide",
  {
    variants: {
      variant: {
        neutral: "bg-ink-100 text-ink-600",
        accent: "bg-ink-900 text-white",
        success: "bg-emerald-50 text-emerald-700",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { badgeVariants }
