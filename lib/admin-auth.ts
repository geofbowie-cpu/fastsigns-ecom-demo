const SESSION_KEY = "ecom_admin_session"

export function adminLogin(email: string, password: string, adminEmail: string, adminPassword: string): boolean {
  if (email.toLowerCase() === adminEmail.toLowerCase() && password === adminPassword) {
    if (typeof window !== "undefined") {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ email, ts: Date.now() }))
    }
    return true
  }
  return false
}

export function adminLogout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY)
  }
}

export function getAdminSession(): { email: string } | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function isAdminAuthenticated(): boolean {
  return getAdminSession() !== null
}
