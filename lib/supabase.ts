// Server-only Supabase clients scoped to the `ecom_demos` schema.
// NEVER import this from a client component.

import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!SUPABASE_URL) throw new Error("NEXT_PUBLIC_SUPABASE_URL not set")

const SCHEMA = "ecom_demos" as const

// Service-role client — full read/write on ecom_demos schema. Server-only.
let _admin: ReturnType<typeof createClient<any, typeof SCHEMA>> | null = null
export function adminClient() {
  if (!SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY not set")
  if (!_admin) {
    _admin = createClient<any, typeof SCHEMA>(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      db: { schema: SCHEMA },
    })
  }
  return _admin
}

// Anon client — read-only via RLS. Safe for public/SSR fetches.
let _anon: ReturnType<typeof createClient<any, typeof SCHEMA>> | null = null
export function publicClient() {
  if (!ANON_KEY) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY not set")
  if (!_anon) {
    _anon = createClient<any, typeof SCHEMA>(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      db: { schema: SCHEMA },
    })
  }
  return _anon
}
