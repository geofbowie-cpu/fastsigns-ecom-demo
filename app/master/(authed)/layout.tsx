import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { isMasterAuthed } from "@/lib/master-auth"
import NavLink from "./_shared/NavLink"

export const metadata: Metadata = {
  title: "Demo Builder · FASTSIGNS",
}

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!(await isMasterAuthed())) redirect("/master/login")

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 flex flex-col border-r border-gray-200 bg-white">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-gray-100">
          <Link href="/master" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 bg-red-600 rounded flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-black tracking-tight">FS</span>
            </div>
            <span className="font-semibold text-gray-900 text-sm leading-tight">
              Demo Builder
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <NavLink href="/master" exact>
            {/* Grid/home icon */}
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Sites
          </NavLink>

          <NavLink href="/master/products">
            {/* Box/package icon */}
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0v10l-8 4m-8-4V7m16 0l-8 4m-8-4l8 4" />
            </svg>
            Products
          </NavLink>

          <NavLink href="/master/categories">
            {/* Tag icon */}
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M3 3h8l10 10a2 2 0 010 2.83l-5.17 5.17a2 2 0 01-2.83 0L3 11V3z" />
            </svg>
            Categories
          </NavLink>

          <NavLink href="/master/import">
            {/* Upload icon */}
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m-4-4l4-4 4 4" />
            </svg>
            Import
          </NavLink>

          <NavLink href="/master/orders">
            {/* Receipt/order icon */}
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Orders
          </NavLink>

          <NavLink href="/master/analytics">
            {/* Bar chart icon */}
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M9 17V9m4 8V5m4 12v-6" />
            </svg>
            Analytics
          </NavLink>

          <NavLink href="/master/users">
            {/* Users icon */}
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20H7a4 4 0 01-4-4 6 6 0 0112 0 6 6 0 0112 0 4 4 0 01-4 4zM9 10a3 3 0 100-6 3 3 0 000 6zm9-2a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
            </svg>
            Users
          </NavLink>

          <div className="pt-3">
            <Link
              href="/master/sites/new"
              className="flex items-center justify-center gap-1.5 w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New site
            </Link>
          </div>
        </nav>

        {/* Sign out */}
        <div className="px-3 pb-4 border-t border-gray-100 pt-3">
          <form action="/api/master/logout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
              </svg>
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-5xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
