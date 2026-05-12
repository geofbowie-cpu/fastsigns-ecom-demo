// Auth-scoped Supabase client (no schema override — uses public schema for auth.users)
// Used only for magic-link auth flows.

import { createClient } from "@supabase/supabase-js"

const URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SVC  = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client-side anon client (for signInWithOtp)
export function authAnonClient() {
  return createClient(URL, ANON, { auth: { persistSession: false } })
}

// Server-side service-role client (for verifying sessions + managing portal users)
export function authAdminClient() {
  return createClient(URL, SVC, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
