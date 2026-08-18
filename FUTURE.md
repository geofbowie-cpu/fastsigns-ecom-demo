# Future Features

Backlog of planned work for the FASTSIGNS Demo Builder. Items here are scoped
but not yet started.

## ✅ Done — Email via Resend

Transactional email now goes through Resend (`lib/email.ts`) from the verified
domain `noreply@rfq.ely.fastsigns.com`: master/tenant magic links, purchase-order
emails to the rep (+ BCC audit copy via `PO_NOTIFY_EMAIL`), and buyer order
confirmations. Master login supports both password and magic link. This
replaces the old Supabase-built-in-mail / SMTP plan.

## ✅ Done — Per-site marketing popup

Opt-in per site via `tenants.popup` (jsonb; see `lib/popup.ts`), edited in the
"Popup" section of the site edit form. Either a pasted third-party snippet
(HubSpot form embed etc., framed in our own overlay by default) or a built-in
modal we render in the site's brand colors. Trigger is load / delay / scroll
depth / exit intent, with a `localStorage` frequency cap in days. Views,
dismissals and CTA clicks land in `site_events` and surface under
`/master/analytics`.

**Known limits / possible follow-ups:**
- It shows on every page of the site — no per-page or per-category targeting.
- No A/B testing or scheduling (start/end dates).
- Pasted embed code can't be previewed in the admin, only on the live site.
- Embed mode only logs `popup_shown` — dismissals and conversions happen inside
  the third party's own UI, so we can't see them.

## Slack alert for new orders (optional)

**Goal:** Post a message to a Slack channel when a PO is submitted, in addition
to the rep email + BCC + `/master/orders` record.

**Effort:** ~½ hr once an incoming-webhook URL exists. Add `SLACK_WEBHOOK_URL`
env and a fire-and-forget POST in `app/api/cart/submit/route.ts`.

## Bulk re-composite old logo placements

**Goal:** One-time script to re-rasterize + re-composite any product images
saved before the SVG-rasterize fix (those have baked-in green chroma fringe).
For now they're fixed by re-saving each in the editor.

## Fix Vercel git auto-deploy

**Goal:** Pushes to `main` should trigger automatic production deploys. They
currently don't — we have to `vercel deploy --prod` manually.

**Effort:** ~15 min. Likely the GitHub integration is disconnected or the
production branch isn't set. Vercel Dashboard → Project → Settings → Git.

## DAM integration — pull product/logo images from the SOAR DAM

**Goal:** Inside the product image editor (and logo library in the mockup
editor), let users browse and pick assets from the SOAR DAM instead of having
to upload or paste a URL.

**Effort:** ~½ day if DAM already exposes a list/search API, ~1 day if a thin
public endpoint needs to be built on the DAM side.

**Scope:**
- **DAM side** — `GET /api/dam/assets?q=&page=&tag=` returning
  `[{ url, title, thumb_url, tags[] }]`, guarded by a shared API key header.
- **Auth** — start with a single shared API key. Optionally add a
  `demo_visible` flag on DAM assets so not everything is exposed.
- **Ecom-demo side** — new "Browse DAM" tab in the existing `ProductImageCell`
  editor modal, alongside Upload / Brand image / Mockup. Grid + search →
  click an asset → set image URL. Reuse existing modal infrastructure.
- **CORS** — DAM Supabase Storage bucket needs cross-origin reads enabled so
  the MockupEditor canvas doesn't taint when using a DAM image as the base.

**Why later:** Email and master login stabilization come first. This is a nice
upgrade once the demo flow is solid.

**Catch:** The two apps live on separate Supabase projects
(`icbgcexnpuuoyagsetbn` for DAM, `ctqyjwotffoclbhymyos` for ecom-demo).
Integration is over HTTP, not a shared DB. If usage tracking (e.g. "Reddy Ice
used 12 DAM assets") becomes a requirement, either consolidate projects or
write tracking back to the DAM.
