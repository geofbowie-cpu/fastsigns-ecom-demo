import Link from "next/link"
import { redirect } from "next/navigation"
import { isMasterAuthed, startMasterSession } from "@/lib/master-auth"

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!(await isMasterAuthed())) redirect("/master/login")
  // Renew the session cookie on every page load so it doesn't expire mid-session
  await startMasterSession()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 text-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/master" className="font-black tracking-tight text-lg">
            FASTSIGNS · Demo Builder
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/master/import"
              className="text-gray-300 hover:text-white text-xs font-medium"
            >
              Import products
            </Link>
            <Link
              href="/master/users"
              className="text-gray-300 hover:text-white text-xs font-medium"
            >
              Users
            </Link>
            <Link
              href="/master/sites/new"
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
            >
              + New site
            </Link>
            <form action="/api/master/logout" method="POST">
              <button type="submit" className="text-xs text-gray-300 hover:text-white">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
