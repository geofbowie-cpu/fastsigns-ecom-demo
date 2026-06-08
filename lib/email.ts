// Transactional email via Resend.
// Sends auth emails ourselves instead of relying on Supabase's throttled
// built-in delivery (rate-limited to a few per hour, poor inbox placement).

import { Resend } from "resend"
import { siteBaseUrl } from "./send-magic-link"

const FROM = process.env.EMAIL_FROM ?? "onboarding@resend.dev"

function client(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY)
}

type SendResult = { ok: true } | { ok: false; error: string }

/**
 * Branded magic-link sign-in email.
 * `siteName` / `brandColor` let us match the destination (admin vs tenant).
 */
export async function sendMagicLinkEmail(opts: {
  to: string
  link: string
  siteName: string
  brandColor?: string
  logoUrl?: string
}): Promise<SendResult> {
  const resend = client()
  if (!resend) return { ok: false, error: "Email is not configured (missing RESEND_API_KEY)." }

  const color = opts.brandColor || "#1e3a5f"
  const safeName = escapeHtml(opts.siteName)

  const logoBlock = opts.logoUrl
    ? `<img src="${opts.logoUrl}" alt="${safeName}" style="height:36px;width:auto;display:block;margin:0 auto;" />`
    : `<div style="font-size:20px;font-weight:800;letter-spacing:0.5px;color:#ffffff;text-align:center;">${safeName}</div>`

  const html = `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
        <tr><td style="background:${color};padding:28px 24px;">${logoBlock}</td></tr>
        <tr><td style="padding:32px 32px 24px;">
          <h1 style="margin:0 0 12px;font-size:20px;font-weight:800;color:#111827;">Sign in to ${safeName}</h1>
          <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#6b7280;">
            Click the button below to sign in. This link expires in 1 hour and can only be used once.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr><td style="border-radius:10px;background:${color};">
              <a href="${opts.link}" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">
                Sign in &rarr;
              </a>
            </td></tr>
          </table>
          <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#9ca3af;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="margin:0;font-size:12px;line-height:1.6;word-break:break-all;">
            <a href="${opts.link}" style="color:${color};">${opts.link}</a>
          </p>
        </td></tr>
        <tr><td style="padding:20px 32px 28px;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:12px;line-height:1.6;color:#9ca3af;">
            Didn't request this? You can safely ignore this email &mdash; no one can sign in without clicking the link above.
          </p>
        </td></tr>
      </table>
      <p style="margin:20px 0 0;font-size:11px;color:#9ca3af;">Powered by FASTSIGNS</p>
    </td></tr>
  </table>
</body>
</html>`

  const text = `Sign in to ${opts.siteName}\n\nClick to sign in (expires in 1 hour, single use):\n${opts.link}\n\nDidn't request this? You can safely ignore this email.`

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: `Your ${opts.siteName} sign-in link`,
      html,
      text,
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to send email" }
  }
}

/**
 * Purchase-order email sent to the site's rep when a customer submits a cart.
 * No pricing — line items show product + quantity + optional note.
 */
export async function sendPurchaseOrderEmail(opts: {
  to: string
  reference: string
  companyName: string
  customerEmail: string
  tenantSlug?: string
  items: { slug?: string; name: string; qty: number; note?: string }[]
  orderNotes?: string
  brandColor?: string
}): Promise<SendResult> {
  const resend = client()
  if (!resend) return { ok: false, error: "Email is not configured (missing RESEND_API_KEY)." }

  const color = opts.brandColor || "#1e3a5f"
  const company = escapeHtml(opts.companyName)

  const base = siteBaseUrl()
  const rows = opts.items
    .map((it) => {
      const productUrl =
        opts.tenantSlug && it.slug
          ? `${base}/sites/${opts.tenantSlug}/products/${it.slug}`
          : null
      const nameCell = productUrl
        ? `<a href="${productUrl}" style="color:${color};font-weight:600;text-decoration:none;" target="_blank">${escapeHtml(it.name)}</a>`
        : escapeHtml(it.name)
      return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #eef0f2;font-size:14px;color:#111827;">${nameCell}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eef0f2;font-size:14px;color:#111827;text-align:center;font-weight:700;">${it.qty}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eef0f2;font-size:13px;color:#6b7280;">${it.note ? escapeHtml(it.note) : "—"}</td>
      </tr>`
    })
    .join("")

  const notesBlock = opts.orderNotes
    ? `<tr><td style="padding:16px 24px;">
         <div style="font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Order notes</div>
         <div style="font-size:14px;color:#111827;line-height:1.6;white-space:pre-wrap;">${escapeHtml(opts.orderNotes)}</div>
       </td></tr>`
    : ""

  const html = `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
        <tr><td style="background:${color};padding:24px;">
          <div style="font-size:18px;font-weight:800;color:#ffffff;">New order — ${company}</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-top:4px;">Reference ${escapeHtml(opts.reference)}</div>
        </td></tr>
        <tr><td style="padding:20px 24px 8px;">
          <div style="font-size:14px;color:#6b7280;">
            Submitted by <strong style="color:#111827;">${escapeHtml(opts.customerEmail)}</strong>
          </div>
        </td></tr>
        <tr><td style="padding:8px 24px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eef0f2;border-radius:10px;overflow:hidden;">
            <tr style="background:#f9fafb;">
              <th style="padding:10px 12px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Product</th>
              <th style="padding:10px 12px;text-align:center;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Qty</th>
              <th style="padding:10px 12px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Note</th>
            </tr>
            ${rows}
          </table>
        </td></tr>
        ${notesBlock}
        <tr><td style="padding:20px 24px 28px;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:12px;line-height:1.6;color:#9ca3af;">
            Reply directly to ${escapeHtml(opts.customerEmail)} to confirm pricing, lead time, and next steps.
          </p>
        </td></tr>
      </table>
      <p style="margin:20px 0 0;font-size:11px;color:#9ca3af;">Sent by FASTSIGNS storefront</p>
    </td></tr>
  </table>
</body>
</html>`

  const textRows = opts.items
    .map((it) => `  • ${it.name} — qty ${it.qty}${it.note ? ` (note: ${it.note})` : ""}`)
    .join("\n")
  const text = `New order — ${opts.companyName}\nReference ${opts.reference}\nSubmitted by ${opts.customerEmail}\n\n${textRows}\n${opts.orderNotes ? `\nOrder notes:\n${opts.orderNotes}\n` : ""}\nReply to ${opts.customerEmail} to confirm pricing and next steps.`

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: opts.to,
      replyTo: opts.customerEmail,
      subject: `New order ${opts.reference} — ${opts.companyName}`,
      html,
      text,
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to send email" }
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
