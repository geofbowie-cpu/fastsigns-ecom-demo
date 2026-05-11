// Tenant visitor sessions — HMAC-signed cookie, one per site slug.
// Server-only.

import { createHmac, timingSafeEqual, randomBytes } from "crypto"
import type { NextResponse } from "next/server"

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

function getSecret(): string {
  const s = process.env.MASTER_SESSION_SECRET
  if (!s || s.length < 16) throw new Error("MASTER_SESSION_SECRET not set")
  return s
}

function cookieName(slug: string) {
  return `ecom_site_${slug}`
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex")
}

function makeToken(email: string, slug: string): string {
  const payload = `${email}|${slug}|${Date.now()}`
  return `${payload}|${sign(payload)}`
}

function verifyToken(token: string | undefined, slug: string): string | null {
  if (!token) return null
  const parts = token.split("|")
  if (parts.length !== 4) return null
  const [email, tokenSlug, ts, sig] = parts
  if (tokenSlug !== slug) return null
  const payload = `${email}|${slug}|${ts}`
  const expected = sign(payload)
  if (sig.length !== expected.length) return null
  try {
    if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) return null
  } catch {
    return null
  }
  const issued = Number(ts)
  if (!Number.isFinite(issued)) return null
  if (Date.now() - issued > COOKIE_MAX_AGE * 1000) return null
  return email
}

/** Read from cookie store (server components / route handlers) */
export function getTenantSession(slug: string, rawCookie: string | undefined): string | null {
  return verifyToken(rawCookie, slug)
}

/** Write session cookie onto a NextResponse (route handler) */
export function setTenantSessionOnResponse(
  res: NextResponse,
  slug: string,
  email: string
): void {
  res.cookies.set(cookieName(slug), makeToken(email, slug), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  })
}

export { cookieName }
