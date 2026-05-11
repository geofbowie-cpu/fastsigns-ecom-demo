"use client"

import { usePathname } from "next/navigation"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"

export function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isShellless = pathname.startsWith("/admin") || pathname.startsWith("/master") || pathname === "/"

  if (isShellless) return <>{children}</>

  return (
    <>
      <Nav />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  )
}
