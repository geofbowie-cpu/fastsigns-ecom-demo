// Password hashing using Node's built-in scrypt — no extra deps needed.
// Format: "<saltHex>:<derivedKeyHex>"

import { scryptSync, randomBytes, timingSafeEqual } from "crypto"

const SALT_LEN = 16
const KEY_LEN  = 32
const SCRYPT   = { N: 16384, r: 8, p: 1 } as const

export function hashPassword(plain: string): string {
  const salt = randomBytes(SALT_LEN)
  const key  = scryptSync(plain, salt, KEY_LEN, SCRYPT)
  return `${salt.toString("hex")}:${key.toString("hex")}`
}

export function verifyPassword(plain: string, stored: string): boolean {
  const [saltHex, keyHex] = stored.split(":")
  if (!saltHex || !keyHex) return false
  try {
    const salt     = Buffer.from(saltHex, "hex")
    const expected = Buffer.from(keyHex,  "hex")
    const actual   = scryptSync(plain, salt, KEY_LEN, SCRYPT)
    if (actual.length !== expected.length) return false
    return timingSafeEqual(actual, expected)
  } catch {
    return false
  }
}
