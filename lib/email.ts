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
  contact?: { firstName: string; lastName: string; email: string; phone: string }
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

  const c = opts.contact
  const contactName = c ? escapeHtml(`${c.firstName} ${c.lastName}`.trim()) : ""
  const contactBlock = c
    ? `<tr><td style="padding:8px 24px 16px;">
         <div style="font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Contact</div>
         <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px;color:#111827;line-height:1.7;">
           <tr><td style="color:#6b7280;padding-right:12px;">Name</td><td style="font-weight:600;">${contactName}</td></tr>
           <tr><td style="color:#6b7280;padding-right:12px;">Email</td><td><a href="mailto:${escapeHtml(c.email)}" style="color:${color};text-decoration:none;font-weight:600;">${escapeHtml(c.email)}</a></td></tr>
           <tr><td style="color:#6b7280;padding-right:12px;">Phone</td><td><a href="tel:${escapeHtml(c.phone)}" style="color:#111827;text-decoration:none;">${escapeHtml(c.phone)}</a></td></tr>
         </table>
       </td></tr>`
    : ""

  // Who the rep should reply to / contact: prefer the form's business email.
  const replyTarget = c?.email && isValidEmail(c.email) ? c.email : opts.customerEmail
  const replyLabel = contactName ? `${contactName} (${replyTarget})` : replyTarget

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
        ${contactBlock || `<tr><td style="padding:20px 24px 8px;">
          <div style="font-size:14px;color:#6b7280;">
            Submitted by <strong style="color:#111827;">${escapeHtml(opts.customerEmail)}</strong>
          </div>
        </td></tr>`}
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
            Reply directly to ${escapeHtml(replyLabel)} to confirm pricing, lead time, and next steps.
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
  const contactText = c
    ? `Contact: ${contactName}\nEmail: ${c.email}\nPhone: ${c.phone}`
    : `Submitted by ${opts.customerEmail}`
  const text = `New order — ${opts.companyName}\nReference ${opts.reference}\n${contactText}\n\n${textRows}\n${opts.orderNotes ? `\nOrder notes:\n${opts.orderNotes}\n` : ""}\nReply to ${replyLabel} to confirm pricing and next steps.`

  // Audit copy: BCC an internal address on every PO so there's always a
  // human-visible record, independent of DB logging. Set PO_NOTIFY_EMAIL.
  const notify = process.env.PO_NOTIFY_EMAIL?.trim()

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: opts.to,
      // Reply to the form's business email (falls back to customerEmail).
      // Only set when valid — Resend rejects placeholders like "(not signed in)".
      ...(isValidEmail(replyTarget) ? { replyTo: replyTarget } : {}),
      ...(notify && isValidEmail(notify) ? { bcc: notify } : {}),
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

/**
 * Confirmation email sent to the person who placed the order. Plain, friendly,
 * the kind of autoresponder a normal order form sends — thanks them and tells
 * them their named rep at FASTSIGNS Ely will follow up with a quote.
 */
export async function sendOrderConfirmationEmail(opts: {
  to: string
  firstName: string
  repName?: string
  repEmail?: string
  reference: string
  items: { name: string; qty: number }[]
}): Promise<SendResult> {
  const resend = client()
  if (!resend) return { ok: false, error: "Email is not configured (missing RESEND_API_KEY)." }

  const first = escapeHtml(opts.firstName.trim() || "there")
  const rep = opts.repName?.trim()
  const repSafe = rep ? escapeHtml(rep) : ""
  const ref = escapeHtml(opts.reference)

  const repSentence = rep
    ? `${repSafe} at FASTSIGNS Ely has your order and will get right back to you with a quote, usually within one business day.`
    : `Your rep at FASTSIGNS Ely has your order and will get right back to you with a quote, usually within one business day.`
  const signoff = rep ? repSafe : "The FASTSIGNS Ely team"

  const itemRows = opts.items
    .map(
      (it) =>
        `<tr>
          <td style="padding:8px 0;font-size:14px;color:#111827;border-bottom:1px solid #f0f1f3;">${escapeHtml(it.name)}</td>
          <td style="padding:8px 0;font-size:14px;color:#6b7280;text-align:right;border-bottom:1px solid #f0f1f3;">Qty ${it.qty}</td>
        </tr>`
    )
    .join("")

  const html = `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
        <tr><td style="padding:28px 28px 8px;">
          <p style="margin:0 0 16px;font-size:15px;color:#111827;">Hi ${first},</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#111827;">
            Thanks for your order! ${repSentence}
          </p>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#111827;">
            Your reference number is <strong>${ref}</strong>.
          </p>
        </td></tr>
        <tr><td style="padding:0 28px;">
          <div style="font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">What you ordered</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRows}</table>
        </td></tr>
        <tr><td style="padding:20px 28px 28px;">
          <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#6b7280;">
            Need to change something or have a question? Just reply to this email${rep ? ` and it will go straight to ${repSafe}` : ""}.
          </p>
          <p style="margin:0;font-size:15px;color:#111827;">Thanks,<br/>${signoff}<br/><span style="color:#6b7280;">FASTSIGNS Ely</span></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const itemsText = opts.items.map((it) => `  - ${it.name} (Qty ${it.qty})`).join("\n")
  const text = `Hi ${opts.firstName.trim() || "there"},

Thanks for your order! ${rep ? `${rep} at FASTSIGNS Ely` : "Your rep at FASTSIGNS Ely"} has your order and will get right back to you with a quote, usually within one business day.

Your reference number is ${opts.reference}.

What you ordered:
${itemsText}

Need to change something or have a question? Just reply to this email.

Thanks,
${rep || "The FASTSIGNS Ely team"}
FASTSIGNS Ely`

  // Bare address from FROM (which may be "Name <addr>" or just "addr").
  const bareFrom = FROM.includes("<") ? FROM.replace(/^.*<([^>]+)>.*$/, "$1") : FROM

  try {
    const { error } = await resend.emails.send({
      from: `FASTSIGNS Ely <${bareFrom}>`,
      to: opts.to,
      // Replies go to the rep so the customer reaches a human.
      ...(opts.repEmail && isValidEmail(opts.repEmail) ? { replyTo: opts.repEmail } : {}),
      subject: `Thanks for your order (${opts.reference})`,
      html,
      text,
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to send email" }
  }
}

/** Minimal RFC-ish email check — enough to keep junk out of to/replyTo/bcc. */
function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
