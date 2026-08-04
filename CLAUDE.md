@AGENTS.md

# FASTSIGNS Demo Builder — agent notes

This file is for future Claude / agent sessions. Read top to bottom before
making changes; the gotchas are non-obvious.

## What this is

Multi-tenant ecom demo platform. The FASTSIGNS sales team uses a master
admin to spin up branded prospect "campaign" sites. Each campaign is a
tenant row in `ecom_demos.tenants` plus optional product overrides.

Sites can run one of two storefront designs (`tenants.theme`: `legacy` |
`v2`) and can optionally enable a cart / purchase-order flow
(`tenants.enable_cart`). Live sites collect required buyer contact details,
email a PO to the rep + a confirmation to the buyer, and record delivery
status. See "Features" below.

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

- **Master admin** — supports BOTH password and magic-link. Password:
  `portal_users.password_hash` (scrypt via `lib/password.ts`), checked by
  `/api/auth/master-password-login`. Magic link: `/api/auth/master-magic-link`
  → `/auth/master-callback` → `/api/auth/set-master-session`. Session is an
  HMAC-signed cookie via `lib/master-auth.ts`. There is also a legacy
  `MASTER_ADMIN_PASSWORD` shared password.
  - **Route Handlers must set cookies on the `NextResponse` object**
    (`setMasterSessionOnResponse(res)` + `res.cookies.set(...)`), NOT via
    `cookies()` from `next/headers` (that's Server-Actions-only and silently
    fails to send the cookie in a route handler).
- **Tenant portal** — gated by `tenants.allowed_domains` (text[]).
  Empty array = public portal. Non-empty = magic-link flow.
  Callback at `/auth/tenant-callback` reads the access_token and POSTs to
  `/api/auth/set-tenant-session` which sets the tenant cookie.

## Email (Resend — this IS how email is sent now)

All transactional email goes through **Resend** in `lib/email.ts`.
- Env: `RESEND_API_KEY` (send-only key), `EMAIL_FROM=noreply@rfq.ely.fastsigns.com`
  (verified Resend domain). `PO_NOTIFY_EMAIL` gets BCC'd on every PO.
- Functions: `sendMagicLinkEmail`, `sendPurchaseOrderEmail`,
  `sendOrderConfirmationEmail`.
- **`reply_to` must be a valid address or omitted** — guest orders carry a
  placeholder like `"(not signed in)"` which Resend rejects and that kills the
  entire send. PO reply-to uses the buyer's business email.

## Schema (Supabase `ecom_demos` schema)

- `tenants` — id, slug, name, brand (jsonb), allowed_domains text[],
  enabled_categories[], product_overrides jsonb, admin_email, status,
  import_tags[], **enable_cart bool** (default false; Reddy Ice always off),
  **theme text** (`legacy` | `v2`, default `legacy`)
- `tenant_visitors` — tenant_id, email, last_seen_at, sign_in_count
- `portal_users` — master admin allow-list; **password_hash** (scrypt)
- `products` — product catalog; **min_order_qty int**, **order_increment int**
  (vendor minimum + pack size; null = no minimum)
- `categories`
- `orders` — cart submissions. tenant_id/slug, customer_email, items jsonb,
  order_notes, **contact_first_name/last_name/email/phone** (required at
  submit), **po_email_to/po_email_status(`sent`|`failed`)/po_email_sent_at/
  po_email_error** (delivery audit trail). Surfaced at `/master/orders`.

`product_overrides` per-product shape (jsonb): `{ disabled, price, imageUrl,
featured, logoPlacement }`. `logoPlacement` (see `lib/product-bank.ts`
`LogoPlacementSpec`) stores the editable logo placement — baseImageUrl,
logoUrl, colorFilter, transform, shadow — so a placed logo can be re-edited
or removed instead of being a permanent flat composite.

## Key files

- `next.config.ts` — `/:slug` → `/sites/:slug` rewrites
- `app/layout.tsx` — GTM (`GTM-NFMTDM7P`), Providers, ConditionalShell
- `app/master/(authed)/sites/[id]/edit/EditSiteForm.tsx` — the heart of
  the master admin (~1300 lines). Brand editor, color pickers,
  product overrides, image management.
- `app/master/(authed)/sites/[id]/edit/MockupEditor.tsx` — canvas-based
  logo placement editor. Selection/handles/perspective/skew, plus **drop
  shadow**, a **centering grid** (rule-of-thirds + center cross-hairs, blue,
  default off) with **Center H/V/Both** buttons + snap-to-center, and
  **editable/removable placement** (saves `logoPlacement` spec, reopens on the
  ORIGINAL base). `selectedRef` hides handles and `capturingRef` hides the grid
  during the `toDataURL` capture. **SVG logos are rasterized server-side via
  `/api/master/rasterize`** before drawing — see the green-artifact gotcha.
- `app/master/(authed)/orders/page.tsx` — admin Orders view (PO delivery status)
- `app/api/master/rasterize/route.ts` — Sharp SVG→PNG rasterizer (SSRF-guarded)
- Cart/PO flow: `app/sites/[slug]/(protected)/_cart/*` (CartProvider,
  AddToCartButton, CartButton), `.../cart/CartClient.tsx` (review + required
  contact form), `app/api/cart/submit/route.ts` (validates minimums + contact,
  persists order, emails PO + confirmation)
- v2 storefront: `app/sites/[slug]/(protected)/_v2/*`,
  `.../products/_v2/*`, `.../products/[productSlug]/_v2/*`,
  `components/v2/ui/*`, `lib/fonts.ts`, `lib/utils.ts` (cn helper). Each page
  checks `tenant.theme === "v2"` and lazy-imports the v2 component.
- `lib/orders-db.ts` — createOrder / listOrders / markOrderEmail / orderReference
- `lib/email.ts` — Resend transactional email (magic link, PO, confirmation)
- `lib/order-qty.ts` — minimum/increment helpers (client + server share these)
- `lib/master-auth.ts` — master password + HMAC cookie session
- `lib/tenant-auth.ts` — per-slug HMAC cookie for tenant visitors
- `lib/supabase.ts` — `adminClient()` and `publicClient()`, both
  schema-scoped to `ecom_demos`
- `lib/supabase-auth.ts` — auth clients (public schema, for `auth.users`)
- `app/api/auth/tenant-magic-link/route.ts` — `signInWithOtp` call
- `app/auth/tenant-callback/route.ts` — handles both legacy
  `?token_hash=...` and modern hash-based redirects via inline script
- `app/api/auth/set-tenant-session/route.ts` — validates access_token, sets cookie

## Features

- **Per-tenant storefront design** — `tenants.theme` (`legacy` | `v2`). Toggle
  in the edit form's "Storefront design" section. Each page route checks the
  flag and lazy-imports the v2 component; legacy is untouched.
- **Cart / purchase orders** — opt-in per site (`enable_cart`). Add-to-order
  controls on listing + detail (v2 and legacy), a cart review page with a
  **required buyer contact form** (first/last name, business email, phone),
  and submit → persist `orders` row → email PO to rep + confirmation to buyer.
  Delivery status is tracked on the order and shown at `/master/orders`.
- **Product minimums** — `min_order_qty` + `order_increment` per product.
  Qty defaults to the minimum, steps by the increment, snaps to valid values;
  enforced client- and server-side.
- **Logo placement editor** — drop shadow, centering grid + center buttons +
  snap, and editable/removable placements. SVG logos rasterized via Sharp.

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
- **New tables created via raw SQL need an explicit GRANT** or the app's
  PostgREST/supabase-js calls fail with `permission denied` (42501) even though
  direct `supabase db query` works (it uses a privileged connection). After
  `create table ecom_demos.foo (...)`, run
  `grant select, insert, update, delete on ecom_demos.foo to service_role;`
  then `notify pgrst, 'reload schema';`. All app DB access is via the
  service-role `adminClient`, so granting `service_role` is sufficient.
- **Vercel git auto-deploy isn't firing.** Pushes to `main` don't
  trigger deploys. Use `npx vercel --prod --yes` manually (auto-aliases the
  production domain). The `git-main` Vercel alias is a stale pointer — ignore it.
- **Email is via Resend now** (see Email section). The old "use Supabase
  built-in mail / don't use Resend" guidance is obsolete. `RESEND_API_KEY`
  and `EMAIL_FROM` ARE set in production.
- **Green artifacts on logo-placed products = SVG-on-canvas chroma fringe.**
  The browser's `<canvas>` rasterizes SVG logos (with `feColorMatrix` filters)
  with green fringing on high-contrast edges, which bakes into the saved PNG.
  PNG/JPG logos are fine; only SVGs. Fix: the editor proxies SVG logos through
  `/api/master/rasterize` (Sharp), which is clean. If green ever returns, first
  suspect a **stale client bundle** (hard-refresh / incognito) — the fix is
  client-side JS. Composites saved before the fix keep baked-in green until
  re-saved. (Do NOT reintroduce green as a UI color in this editor.)
- **Minimums are enforced server-side too.** `app/api/cart/submit` re-validates
  every line against `products.min_order_qty`/`order_increment` via
  `lib/order-qty.ts` — client checks are not authoritative.
- **`enable_cart` defaults false; never enable Reddy Ice** (live marketing).
- **GTM is loaded site-wide** including `/master/*`. Add a GTM exclusion
  if you need clean analytics.
- **Two Vercel projects existed earlier** (`fastsigns-demos` and
  `fastsigns-ecom-demo`). The duplicate was deleted. Repo is linked to
  `fastsigns-demos`.

## When in doubt

`FUTURE.md` tracks pending work and known issues. `USER_GUIDE.md` is
written for the sales/account team and is useful context for what the
app *does*.
