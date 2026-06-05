import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // base
  "inline-flex items-center justify-center gap-2 font-body font-semibold leading-none whitespace-nowrap transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ink-900/40 disabled:opacity-50 disabled:pointer-events-none select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-ink-900 text-white shadow-soft hover:shadow-elevated hover:-translate-y-0.5 active:translate-y-0",
        secondary:
          "bg-ink-100 text-ink-900 hover:bg-ink-200",
        outline:
          "border border-ink-200 bg-transparent text-ink-900 hover:bg-ink-50 hover:border-ink-400",
        ghost:
          "bg-transparent text-ink-900 hover:bg-ink-100",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-[0.95rem]",
        lg: "h-14 px-8 text-base",
      },
      rounded: {
        card: "rounded-card",
        pill: "rounded-pill",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      rounded: "card",
    },
  }
)

type ButtonBaseProps = VariantProps<typeof buttonVariants> & {
  className?: string
  children?: React.ReactNode
  /**
   * Optional accent color. When set, the `primary` variant uses this as its
   * background (with white text) so the component stays brand-agnostic.
   */
  accent?: string
}

type ButtonAsButton = ButtonBaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> & {
    as?: "button"
  }

type ButtonAsAnchor = ButtonBaseProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonBaseProps> & {
    as: "a"
    href: string
  }

export type ButtonProps = ButtonAsButton | ButtonAsAnchor

export function Button(props: ButtonProps) {
  const { className, variant, size, rounded, accent, children, ...rest } = props

  // When an accent is supplied, the primary variant is colored inline so the
  // component never hardcodes a brand color.
  const accentStyle =
    accent && (variant ?? "primary") === "primary"
      ? { backgroundColor: accent, color: "#fff" }
      : undefined

  const classes = cn(buttonVariants({ variant, size, rounded }), className)

  if (rest.as === "a") {
    const { as: _as, style, ...anchorRest } =
      rest as Extract<ButtonProps, { as: "a" }>
    return (
      <a className={classes} style={{ ...accentStyle, ...style }} {...anchorRest}>
        {children}
      </a>
    )
  }

  const { as: _as, style, ...buttonRest } =
    rest as Extract<ButtonProps, { as?: "button" }>
  return (
    <button className={classes} style={{ ...accentStyle, ...style }} {...buttonRest}>
      {children}
    </button>
  )
}

export { buttonVariants }
