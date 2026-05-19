# FASTSIGNS Demo Builder

Multi-tenant ecommerce demo platform. Sales/account managers spin up
branded prospect "campaign" sites in minutes — each one a fully working
mock storefront with the prospect's logo, colors, and a curated product
catalog.

Production: <https://fastsigns-demos.vercel.app>

## Stack

- Next.js 14 (App Router) — note: this version has breaking changes vs. older
  Next, see `AGENTS.md`
- Supabase (Postgres + Auth + Storage) — project `ctqyjwotffoclbhymyos`
  ("ecom-demo"). **This is a separate project from the DAM
  (`icbgcexnpuuoyagsetbn`).**
- Tailwind CSS
- Vercel deployment (project `fastsigns-demos`)
- Dynamic Mockups API (logo-on-product preview generation)
- Brandfetch API (auto-pull brand identity from a domain)
- Google Tag Manager (`GTM-NFMTDM7P`) — site-wide

## Local development

```bash
npm install
npm run dev   # http://localhost:3000
```

`.env.local` must point to the `ctqyjwotffoclbhymyos` Supabase project.

## Architecture

Two surfaces in one Next.js app:

| URL                              | Audience           | What it is                                 |
| -------------------------------- | ------------------ | ------------------------------------------ |
| `/`                              | FASTSIGNS internal | Redirects to `/master`                     |
| `/master/login`                  | FASTSIGNS internal | Master password login                      |
| `/master`                        | FASTSIGNS internal | List + manage all campaign sites           |
| `/master/sites/[id]/edit`        | FASTSIGNS internal | Edit a single campaign                     |
| `/:slug`                         | Prospect           | Tenant campaign portal (e.g. `/reddy-ice`) |
| `/:slug/login`                   | Prospect           | Tenant magic-link login (when gated)       |
| `/:slug/products`                | Prospect           | Product catalog                            |
| `/:slug/products/[productSlug]`  | Prospect           | Product detail                             |

URL rewrites in `next.config.ts` map `/:slug` → `/sites/:slug` so prospects
get clean shareable URLs.

## Auth

- **Master admin** — single password (`MASTER_ADMIN_PASSWORD` env var) →
  HMAC-signed cookie. Endpoint: `POST /api/master/login`.
- **Tenant portals** — optional. If `tenants.allowed_domains` is empty,
  the portal is public. If it has any domain (e.g. `reddyice.com`), the
  protected layout redirects to `/:slug/login` and the visitor receives
  a magic link via Supabase's own email delivery (`signInWithOtp`).
  Currently rate-limited to 4 emails/hour on free tier — see `FUTURE.md`
  for the custom-SMTP plan.

## Deploy

Production deploys to the `fastsigns-demos` Vercel project. The GitHub
auto-deploy integration is currently flaky — push to `main` then run:

```bash
vercel deploy --prod
```

from the repo root. The custom domain `fastsigns-demos.vercel.app` is
configured as a proper project domain (not just an alias).

## Key env vars (production)

| Name                            | Notes                                      |
| ------------------------------- | ------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | `https://ctqyjwotffoclbhymyos.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` |                                            |
| `SUPABASE_SERVICE_ROLE_KEY`     |                                            |
| `MASTER_ADMIN_PASSWORD`         | Master login password                      |
| `MASTER_SESSION_SECRET`         | HMAC secret for session cookies            |
| `SITE_URL`                      | `https://fastsigns-demos.vercel.app`       |
| `NEXT_PUBLIC_SITE_URL`          | Same                                       |
| `DYNAMIC_MOCKUPS_API_KEY`       | Product-mockup generation                  |
| `BRANDFETCH_API_KEY`            | Auto-pull brand identity                   |

`RESEND_API_KEY` is **not used** — emails go through Supabase's built-in
delivery.

## See also

- `CLAUDE.md` — architecture notes for Claude / future-agent sessions
- `USER_GUIDE.md` — how to use the demo builder (sales/account team)
- `FUTURE.md` — planned features and known issues
- `AGENTS.md` — Next.js 14 caveats
