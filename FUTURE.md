# Future Features

Backlog of planned work for the FASTSIGNS Demo Builder. Items here are scoped
but not yet started.

## Custom SMTP for magic-link emails

**Goal:** Replace Supabase's built-in email (4/hr rate-limited free tier) with
custom SMTP so magic links deliver reliably from a verified `@fastsigns.com`
or similar domain.

**Effort:** ~½ day. Verify a domain in Resend/SendGrid/Mailgun (DNS records),
add SMTP creds to the Supabase project (Dashboard → Auth → SMTP Settings),
done.

**Why later:** master login is on password for now, so this isn't blocking.
Tenant magic links work for occasional testing but won't scale to a real
prospect rollout without SMTP.

## Restore magic-link login at root

**Goal:** Switch `/` back to a magic-link login (instead of master password)
once SMTP is set up. Code is already in the repo at
`app/api/auth/magic-link/route.ts` and `app/auth/callback/route.ts` — just
swap the root `app/page.tsx` redirect.

**Effort:** ~30 min after SMTP is live.

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
