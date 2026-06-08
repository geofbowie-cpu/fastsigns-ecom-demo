// Generates a magic link server-side via Supabase's admin API, then delivers
// it through Resend. Replaces signInWithOtp (which used Supabase's throttled
// built-in email). The generated link points at our own callback with a
// token_hash the callback verifies via verifyOtp.

import { authAdminClient } from "@/lib/supabase-auth"
import { sendMagicLinkEmail, isEmailConfigured } from "@/lib/email"

export function siteBaseUrl(): string {
  return process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.SITE_URL ?? "http://localhost:3000"
}

type Result = { ok: true } | { ok: false; status: number; error: string }

/**
 * @param email        recipient (already validated + lowercased)
 * @param callbackPath e.g. "/auth/master-callback" or "/auth/tenant-callback"
 * @param callbackQuery extra query params appended to the callback (e.g. slug)
 * @param siteName     shown in the email subject + heading
 * @param brandColor   header colour for the email template
 * @param logoUrl      optional logo for the email header
 */
export async function sendMagicLink(opts: {
  email: string
  callbackPath: string
  callbackQuery?: Record<string, string>
  siteName: string
  brandColor?: string
  logoUrl?: string
}): Promise<Result> {
  if (!isEmailConfigured()) {
    return {
      ok: false,
      status: 503,
      error: "Email isn't set up yet. Please contact your administrator.",
    }
  }

  // Mint a magic link (hashed_token) without sending Supabase's own email.
  const { data, error } = await authAdminClient().auth.admin.generateLink({
    type: "magiclink",
    email: opts.email,
  })

  if (error || !data?.properties?.hashed_token) {
    console.error("generateLink error:", error)
    return { ok: false, status: 500, error: "Couldn't generate a sign-in link. Try again." }
  }

  const params = new URLSearchParams({
    token_hash: data.properties.hashed_token,
    type: "magiclink",
    ...(opts.callbackQuery ?? {}),
  })
  const link = `${siteBaseUrl()}${opts.callbackPath}?${params.toString()}`

  const sent = await sendMagicLinkEmail({
    to: opts.email,
    link,
    siteName: opts.siteName,
    brandColor: opts.brandColor,
    logoUrl: opts.logoUrl,
  })

  if (!sent.ok) {
    console.error("sendMagicLinkEmail error:", sent.error)
    return { ok: false, status: 500, error: "Couldn't send the email. Try again in a moment." }
  }

  return { ok: true }
}
