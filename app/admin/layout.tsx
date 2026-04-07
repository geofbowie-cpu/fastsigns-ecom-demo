"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { isAdminAuthenticated, adminLogout, getAdminSession } from "@/lib/admin-auth"
import { brand } from "@/brand.config"
import { Package, LogOut, ExternalLink, Settings } from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [email, setEmail] = useState("")
  const [ready, setReady] = useState(false)

  const isLoginPage = pathname === "/admin/login"

  useEffect(() => {
    if (isLoginPage) {
      setReady(true)
      return
    }
    if (!isAdminAuthenticated()) {
      router.replace("/admin/login")
      return
    }
    const session = getAdminSession()
    if (session) setEmail(session.email)
    setReady(true)
  }, [router, isLoginPage])

  function handleLogout() {
    adminLogout()
    router.replace("/admin/login")
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
      </div>
    )
  }

  // Login page renders its own full-page layout — no sidebar
  if (isLoginPage) return <>{children}</>

  const navItems = [
    { href: "/admin/products", label: "Products", icon: <Package size={16} /> },
    { href: "/admin/settings", label: "Brand Settings", icon: <Settings size={16} /> },
  ]

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className="w-56 flex-shrink-0 flex flex-col"
        style={{ backgroundColor: brand.primaryDark }}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="text-white font-black text-lg tracking-widest">{brand.logoText}</div>
          <div className="text-white/40 text-xs mt-0.5">Admin</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-white/15 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}

          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ExternalLink size={16} />
            View Storefront
          </Link>
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="px-3 py-2 mb-1">
            <div className="text-white/40 text-xs truncate">{email}</div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  )
}
