@AGENTS.md

# FASTSIGNS Demo Builder — agent notes

This file is for future Claude / agent sessions. Read top to bottom before
making changes; the gotchas are non-obvious.

## What this is

Multi-tenant ecom demo platform. The FASTSIGNS sales team uses a master
admin to spin up branded prospect "campaign" sites. Each campaign is a
tenant row in `ecom_demos.tenants` plus optional product overrides.

- Repo: `/Users/geofbowie/fastsigns-ecom-demo/`
- Production: <https://fastsigns-demos.vercel.app>
- Vercel project: `fastsigns-demos`
- Supabase project: `ctqyjwotffoclbhymyos` ("ecom-demo") — **NOT** the DAM
  project (`icbgcexnpuuoyagsetbn`). Don't confuse them. Both exist.

## URL routing

`next.config.ts` rewrites `/:slug` → `/sites/:slug` (with reserved-path
exclusions for `master`, `api`, `auth`, `sites`, `_next`). So tenant URLs
stay clean (`/reddy-ice`) while the file-system layout is conventional
(`app/sites/[slug]/...`).

| URL                              | Component                                |
| -------------------------------- | ---------------------------------------- |
| `/`                              | `app/page.tsx` → `redirect("/master")`   |
| `/master/login`                  | `app/master/login/page.tsx` (password)   |
| `/master/(authed)/*`             | Protected master admin pages             |
| `/:slug`                         | `app/sites/[slug]/(protected)/page.tsx`  |
| `/:slug/login`                   | `app/sites/[slug]/login/page.tsx`        |

## Auth

- **Master admin** — `MASTER_ADMIN_PASSWORD` env var; HMAC-signed cookie
  via `lib/master-auth.ts`. Magic-link path is in the repo (uses
  `signInWithOtp`) but the root currently uses password login.
- **Tenant portal** — gated by `tenants.allowed_domains` (text[]).
  Empty array = public portal. Non-empty = magic-link flow via Supabase
  email delivery. `signInWithOtp` triggers Supabase's built-in mailer.
  Callback at `/auth/tenant-callback` is a route handler that returns
  an inline HTML script to read the access_token from the URL hash
  (Supabase implicit flow) and POST it to `/api/auth/set-tenant-session`
  which sets the tenant cookie.

## Schema (Supabase `ecom_demos` schema)

- `tenants` — id, slug, name, brand (jsonb), allowed_domains text[],
  enabled_categories[], product_overrides jsonb, admin_email, status,
  import_tags[]
- `tenant_visitors` — tenant_id, email, last_seen_at, sign_in_count
- `portal_users` — master admin allow-list (email)
- `products` — product catalog
- `categories`

## Key files

- `next.config.ts` — `/:slug` → `/sites/:slug` rewrites
- `app/layout.tsx` — GTM (`GTM-NFMTDM7P`), Providers, ConditionalShell
- `app/master/(authed)/sites/[id]/edit/EditSiteForm.tsx` — the heart of
  the master admin (~1300 lines). Brand editor, color pickers,
  product overrides, image management.
- `app/master/(authed)/sites/[id]/edit/MockupEditor.tsx` — canvas-based
  logo placement editor with selection/handles/perspective/skew.
  Selection state is wired through `selected` + `selectedRef` so save
  can synchronously hide handles before capture.
- `lib/master-auth.ts` — master password + HMAC cookie session
- `lib/tenant-auth.ts` — per-slug HMAC cookie for tenant visitors
- `lib/supabase.ts` — `adminClient()` and `publicClient()`, both
  schema-scoped to `ecom_demos`
- `lib/supabase-auth.ts` — auth clients (public schema, for `auth.users`)
- `app/api/auth/tenant-magic-link/route.ts` — `signInWithOtp` call
- `app/auth/tenant-callback/route.ts` — handles both legacy
  `?token_hash=...` and modern hash-based redirects via inline script
- `app/api/auth/set-tenant-session/route.ts` — validates access_token, sets cookie

## Gotchas

- **Two Supabase projects on the same Supabase account** — `ecom-demo`
  is `ctqyjwotffoclbhymyos`, DAM is `icbgcexnpuuoyagsetbn`. Always
  double-check which one you're hitting. Supabase dashboard sometimes
  loads the wrong one — use the direct project URL:
  `https://supabase.com/dashboard/project/ctqyjwotffoclbhymyos`.
- **Dropping a schema that's in the project's "Exposed Schemas" list
  breaks PostgREST.** If you ever `DROP SCHEMA xxx CASCADE` on a
  Supabase project, first remove it from the API exposed-schemas list
  via the Management API (`PATCH /v1/projects/{ref}/postgrest`).
  Otherwise PostgREST returns `PGRST002` on all requests until config
  is fixed.
- **Vercel git auto-deploy isn't firing.** Pushes to `main` don't
  trigger deploys. Use `vercel deploy --prod` manually.
- **Don't use Resend.** Magic links go through Supabase's built-in
  email. `RESEND_API_KEY` env var is not set in production.
- **Supabase free-tier email is 4/hour.** Easy to rate-limit yourself
  while testing. Custom SMTP is on the roadmap (`FUTURE.md`).
- **Magic link redirect URL must be allowlisted** in Supabase
  Dashboard → Authentication → URL Configuration. Add
  `https://fastsigns-demos.vercel.app/**` and
  `http://localhost:3000/**`.
- **GTM is loaded site-wide** including `/master/*`. Add a GTM exclusion
  if you need clean analytics.
- **Two Vercel projects existed earlier** (`fastsigns-demos` and
  `fastsigns-ecom-demo`). The duplicate was deleted. Repo is linked to
  `fastsigns-demos`.

## When in doubt

`FUTURE.md` tracks pending work and known issues. `USER_GUIDE.md` is
written for the sales/account team and is useful context for what the
app *does*.
