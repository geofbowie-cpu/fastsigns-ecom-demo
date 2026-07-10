# FASTSIGNS Demo Builder — User Guide

For the FASTSIGNS sales and account team. This is the tool you use to
spin up branded prospect "demo" sites — fully working mock storefronts
with the prospect's logo, colors, and a curated product catalog you can
walk them through on a call or share via link.

Production: <https://fastsigns-demos.vercel.app>

---

## 1. Logging in

Go to <https://fastsigns-demos.vercel.app> → you'll be sent to the master
login screen → enter the master password (ask Geof).

You stay logged in for 7 days on each device.

---

## 2. The master dashboard

`/master` lists every campaign site. Each row has:

- **Live URL** — the shareable prospect link, e.g.
  `fastsigns-demos.vercel.app/reddy-ice`
- **Status** — Demo or Live
- **Edit** button
- **Delete** (use sparingly)

---

## 3. Creating a new campaign

Click **+ New site** in the top right.

1. **Display name** — e.g. "Reddy Ice", "Boeing"
2. **Slug** — auto-generated from the name. **Fixed after creation**,
   so pick something clean (`reddy-ice`, `the-boeing-company`).
3. **Domain (optional)** — if you enter the prospect's domain (e.g.
   `reddyice.com`) we'll auto-pull their logo, colors, and tagline via
   Brandfetch. You can override everything afterwards.

Click **Create** — you land on the edit screen.

---

## 4. Editing a campaign

The edit screen has several sections:

### Identity
- Display name, admin email.

### Brand
- **Re-fetch from domain** — re-runs Brandfetch on the domain (handy if
  the initial fetch missed something).
- **Colors** — Primary, Accent, Nav text, CTA text. Pickers + hex input.
- **Show pricing** — toggle pricing visibility for the prospect.
- **Logo** — upload a PNG with transparent background.
- **Hero heading / subheading / hero image** — top-of-page content.

### Imported product sets
Toggle which batches of imported products appear in this site's
catalog. Products are tagged by import batch — useful when you've
imported a "safety signage" set vs "trade show" set.

### Product overrides
The advanced section — per-product image swaps. Each row has the
product image cell (see below).

#### Product image cell

Hover the thumbnail to see three icons:
- 👁  **View** — opens the image in a lightbox
- ✏️  **Edit** — opens the image picker with Upload / Brand image /
   Mockup options
- ✕  **Remove** — clears the image

Clicking the thumbnail itself also opens the lightbox.

#### Mockup editor

When editing a product image, choose **Mockup generator** to place the
brand logo onto a product photo.

- **Click the logo** to select it (the dashed bounding box appears).
- **Click empty canvas** to deselect (box disappears).
- **Drag** the logo body to move.
- **Drag the corner handles** to scale.
- **Drag the rotation handle** (top, ↻ icon) to rotate.
- **Color filters** — Original / Black / White / Invert.
- **Perspective** — Horizontal/Vertical skew sliders.
- **Opacity** — 10–100%.
- **Drop shadow** — toggle on, then adjust blur, offset, and color.
- **Alignment** — turn on the **grid** for rule-of-thirds + center guides,
  or use **Center H / V / Both**. Dragging near the middle snaps to center.
- **Logo library** (left panel) — paste any logo URL; remove any logo
  with the × button.
- **✓ Use as product image** — saves the composite as the product image.
  Selection handles and the grid are never baked into the saved image.

**Editing or removing a placed logo:** placements are no longer permanent.
Re-open the editor on a product that already has a logo and it says **"Edit
placed logo"** — it restores everything (position, size, shadow) on the
original image so you can adjust it. **"Remove logo"** reverts to the original
product image.

> **Note on green specks:** if you ever see faint green marks on a saved image,
> it's a stale browser cache — **hard-refresh** (Cmd+Shift+R) or use an
> Incognito window, then re-save the product. Images saved before the fix keep
> the marks until re-saved.

### Storefront design
Each site can use the **Legacy** design or the newer **v2** utility-first
layout — pick it in the "Storefront design" section. You can switch back and
forth anytime; it only changes how the storefront looks.

### Ordering (cart + purchase orders)
Turn on ordering per site with the **cart** option. When on, products show an
**Add to order** button with a quantity stepper, and a cart where the customer
reviews their order. Before submitting, they must fill in a **required contact
section** (first name, last name, business email, phone).

On submit:
- The order is saved and the customer sees a reference number.
- The **rep** (the site's contact email) gets a purchase-order email with the
  items and the customer's contact info.
- The **customer** gets a friendly confirmation email from FASTSIGNS Ely.

See every order and whether its email was delivered at **Master → Orders**.

Some products have **vendor minimums** (e.g. lanyards 100 in packs of 100,
mugs 48). Those default to the minimum quantity and won't let a customer order
below it — nothing to configure per site. To set a minimum on another product,
use the **Minimum order qty** / **Pack increment** fields in Master → Products.

### Access control
- **Allowed domains** — comma-separated. Empty means the portal is
  public (anyone with the URL gets in). Non-empty (e.g. `reddyice.com,
  arcticglacier.com`) means the prospect must enter their work email
  and receive a magic link.

### Site status
- **Demo** vs **Live**. Live shows the contact-to-order CTAs and the rep
  contact bar to visitors. **You must set a contact email before you can
  promote a site to Live** — the button stays greyed until you do.
- There's no per-user ownership: any admin can edit any site, regardless of
  who created it.

Save at the bottom.

---

## 5. Sharing the demo

Each campaign has a clean shareable URL:

```
https://fastsigns-demos.vercel.app/[slug]
```

For example: `https://fastsigns-demos.vercel.app/reddy-ice`

- If `Allowed domains` is empty, send the link directly — the prospect
  lands on the homepage.
- If `Allowed domains` is set, the link redirects to the login screen
  where they enter their work email and receive a magic link. Emails are
  sent via Resend from `noreply@rfq.ely.fastsigns.com` (reliable, no
  rate-limit). Once a prospect is signed in, their session lasts 7 days.

---

## 6. Importing products

`Master → Import products`. Upload a CSV of product rows. Tag the
import batch so you can later toggle it on/off per campaign in the
"Imported product sets" section of the edit screen.

---

## 7. Users

`Master → Users` lists who's authorized on the master admin allow-list.
Each user can sign in with **either** their own password (set a password
per user right on this page) **or** an email magic link. Any admin can edit
any site — there's no per-user ownership.

---

## 8. Tracking

Google Tag Manager (`GTM-NFMTDM7P`) fires on every page including
prospect sites and the master admin. Talk to marketing about which
events to wire up.

---

## Troubleshooting

| Symptom                                       | Likely cause / fix                                       |
| --------------------------------------------- | -------------------------------------------------------- |
| Prospect didn't get the magic link email      | Check spam. Delivery is via Resend now (no rate limit).  |
| Magic link arrives but link doesn't work      | Redirect URL not allowlisted in Supabase dashboard.      |
| Green specks on a saved product image         | Stale browser cache — hard-refresh / Incognito, re-save. |
| Placed logo won't change / looks stuck        | Re-open editor → "Edit placed logo" (or "Remove logo").  |
| Can't promote a site to Live (button greyed)  | Add a contact email first, then the Live button enables. |
| Rep didn't get a purchase-order email         | Check Master → Orders for delivery status + any error.   |
| New changes aren't on the live site           | Vercel auto-deploy is flaky. Ask Geof to re-deploy.      |
| "Site not found" on prospect URL              | Slug typo or campaign hasn't been created yet.           |

If something else breaks, ping Geof.
