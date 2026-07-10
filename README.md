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
- Resend (transactional email — magic links, purchase orders, confirmations)
- Sharp (server-side image rasterize/composite)
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
| `/:slug/cart`                    | Prospect           | Cart review + submit (when cart enabled)   |
| `/master/orders`                 | FASTSIGNS internal | Purchase orders + email delivery status    |

URL rewrites in `next.config.ts` map `/:slug` → `/sites/:slug` so prospects
get clean shareable URLs. Storefront pages render one of two designs per the
`tenants.theme` flag (`legacy` | `v2`).

## Auth

- **Master admin** — per-user password (`portal_users.password_hash`, scrypt)
  or email magic link; HMAC-signed cookie. There's also a legacy shared
  `MASTER_ADMIN_PASSWORD`. No per-user ownership — any admin edits any site.
- **Tenant portals** — optional. If `tenants.allowed_domains` is empty,
  the portal is public. If it has any domain, the protected layout redirects
  to `/:slug/login` and the visitor receives a magic link. Email is sent via
  **Resend** from a verified domain (no rate limit).

## Deploy

Production deploys to the `fastsigns-demos` Vercel project. The GitHub
auto-deploy integration is flaky — push to `main` then run:

```bash
npx vercel --prod --yes
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
| `RESEND_API_KEY`                | Transactional email (send-only key)        |
| `EMAIL_FROM`                    | `noreply@rfq.ely.fastsigns.com` (verified) |
| `PO_NOTIFY_EMAIL`               | BCC audit copy of every purchase order     |
| `UNSPLASH_ACCESS_KEY`           | Hero image picker (optional)               |

## See also

- `CLAUDE.md` — architecture notes for Claude / future-agent sessions
- `USER_GUIDE.md` — how to use the demo builder (sales/account team)
- `FUTURE.md` — planned features and known issues
- `AGENTS.md` — Next.js 14 caveats
