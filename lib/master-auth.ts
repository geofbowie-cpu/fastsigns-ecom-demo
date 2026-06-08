// Master admin session — env-var password, signed HMAC cookie.
// Server-only.

import { cookies } from "next/headers"
import { createHmac, timingSafeEqual, randomBytes } from "crypto"

const COOKIE_NAME = "ecom_master"
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days

function getSecret(): string {
  const s = process.env.MASTER_SESSION_SECRET
  if (!s || s.length < 16) {
    throw new Error(
      "MASTER_SESSION_SECRET must be set (>=16 chars). Set it in .env.local and on Vercel."
    )
  }
  return s
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex")
}

function makeToken(): string {
  const payload = `${Date.now()}.${randomBytes(8).toString("hex")}`
  return `${payload}.${sign(payload)}`
}

function verifyToken(token: string | undefined): boolean {
  if (!token) return false
  const parts = token.split(".")
  if (parts.length !== 3) return false
  const [ts, nonce, sig] = parts
  const expected = sign(`${ts}.${nonce}`)
  if (sig.length !== expected.length) return false
  if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) return false
  const issued = Number(ts)
  if (!Number.isFinite(issued)) return false
  return Date.now() - issued < COOKIE_MAX_AGE_SECONDS * 1000
}

export function checkMasterPassword(password: string): boolean {
  const expected = process.env.MASTER_ADMIN_PASSWORD
  if (!expected) return false
  if (password.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(password), Buffer.from(expected))
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: COOKIE_MAX_AGE_SECONDS,
}

/** Use in Server Actions / layouts (next/headers) */
export async function startMasterSession(): Promise<void> {
  const c = await cookies()
  c.set(COOKIE_NAME, makeToken(), COOKIE_OPTIONS)
}

/** Use in Route Handlers — writes the cookie onto an existing NextResponse */
export function setMasterSessionOnResponse(res: { cookies: { set: (name: string, value: string, opts: object) => void } }): void {
  res.cookies.set(COOKIE_NAME, makeToken(), COOKIE_OPTIONS)
}

export async function endMasterSession(): Promise<void> {
  const c = await cookies()
  c.delete(COOKIE_NAME)
}

export async function isMasterAuthed(): Promise<boolean> {
  const c = await cookies()
  return verifyToken(c.get(COOKIE_NAME)?.value)
}

const EMAIL_COOKIE_NAME = "ecom_master_email"

/** Use in Server Actions / layouts — sets both the HMAC token and email cookies */
export async function startMasterSessionForEmail(email: string): Promise<void> {
  const c = await cookies()
  c.set(COOKIE_NAME, makeToken(), COOKIE_OPTIONS)
  c.set(EMAIL_COOKIE_NAME, email, COOKIE_OPTIONS)
}

/** Reads the master admin email from its cookie. Server-only. */
export async function getMasterEmail(): Promise<string | null> {
  const c = await cookies()
  return c.get(EMAIL_COOKIE_NAME)?.value ?? null
}
