import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createHmac, timingSafeEqual, randomBytes } from "crypto"

// Inline the auth logic — middleware can't import from lib/ (edge runtime)
const COOKIE_NAME = "ecom_master"
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days in seconds
const RENEW_BEFORE = 60 * 60 * 24 // renew if less than 1 day left

function getSecret() {
  return process.env.MASTER_SESSION_SECRET ?? ""
}

function sign(payload: string) {
  return createHmac("sha256", getSecret()).update(payload).digest("hex")
}

function makeToken() {
  const payload = `${Date.now()}.${randomBytes(8).toString("hex")}`
  return `${payload}.${sign(payload)}`
}

function verifyAndAge(token: string | undefined): { valid: boolean; age: number } {
  if (!token || getSecret().length < 16) return { valid: false, age: Infinity }
  const parts = token.split(".")
  if (parts.length !== 3) return { valid: false, age: Infinity }
  const [ts, nonce, sig] = parts
  const expected = sign(`${ts}.${nonce}`)
  try {
    if (sig.length !== expected.length) return { valid: false, age: Infinity }
    if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex")))
      return { valid: false, age: Infinity }
  } catch {
    return { valid: false, age: Infinity }
  }
  const issued = Number(ts)
  const age = (Date.now() - issued) / 1000
  return { valid: age < MAX_AGE, age }
}

export function middleware(req: NextRequest) {
  // Only apply to /master routes (not /master/login itself)
  if (!req.nextUrl.pathname.startsWith("/master")) return NextResponse.next()
  if (req.nextUrl.pathname === "/master/login") return NextResponse.next()

  const token = req.cookies.get(COOKIE_NAME)?.value
  const { valid, age } = verifyAndAge(token)

  if (!valid) {
    // Not authed — let the layout redirect handle it (avoids double-redirect)
    return NextResponse.next()
  }

  // Renew if less than RENEW_BEFORE seconds left
  if (age > MAX_AGE - RENEW_BEFORE) {
    const res = NextResponse.next()
    res.cookies.set(COOKIE_NAME, makeToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE,
    })
    return res
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/master/:path*"],
}
