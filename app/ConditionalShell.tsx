"use client"

import { usePathname } from "next/navigation"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"

// The Nav/Footer shell belongs to the ORIGINAL single-brand demo, which lives at
// these top-level routes only. Everything else — `/master/*`, `/admin/*`,
// `/auth/*`, and every tenant site — renders its own chrome.
//
// This is an allow-list on purpose: tenant URLs are rewritten `/:slug` →
// `/sites/:slug` in next.config.ts, but `usePathname()` reports the PRE-rewrite
// path (`/reddy-ice`, not `/sites/reddy-ice`). A `startsWith("/sites")` exclusion
// silently never matches, which is how the demo's nav/footer ended up rendering
// on top of every tenant storefront.
const SHELL_ROUTES = ["/products", "/cart", "/checkout", "/order-confirmation"]

export function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hasShell = SHELL_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  )

  if (!hasShell) return <>{children}</>

  return (
    <>
      <Nav />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  )
}
