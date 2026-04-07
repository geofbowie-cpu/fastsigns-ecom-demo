"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { brand } from "@/brand.config"
import { adminLogin, isAdminAuthenticated } from "@/lib/admin-auth"
import { Eye, EyeOff } from "lucide-react"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAdminAuthenticated()) router.replace("/admin/products")
  }, [router])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    setTimeout(() => {
      const ok = adminLogin(email, password, brand.adminEmail, brand.adminPassword)
      if (ok) {
        router.replace("/admin/products")
      } else {
        setError("Invalid email or password.")
        setLoading(false)
      }
    }, 400)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: `linear-gradient(135deg, ${brand.primaryDark}, ${brand.primaryColor})` }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-white font-black text-3xl tracking-widest mb-1">{brand.logoText}</div>
          <div className="text-white/60 text-sm">Admin Dashboard</div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-6">Sign in</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={brand.adminEmail}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:border-gray-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-300 rounded-lg bg-white focus:border-gray-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-semibold text-sm text-white transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ backgroundColor: brand.primaryColor }}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : "Sign In"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <a
              href="/"
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← Back to storefront
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
