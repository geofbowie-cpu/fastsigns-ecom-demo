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
- **Logo library** (left panel) — paste any logo URL; remove any logo
  with the × button.
- **✓ Use as product image** — saves the composite as the product image.
  Selection handles are never baked into the saved image.

### Access control
- **Allowed domains** — comma-separated. Empty means the portal is
  public (anyone with the URL gets in). Non-empty (e.g. `reddyice.com,
  arcticglacier.com`) means the prospect must enter their work email
  and receive a magic link.

### Site status
- **Demo** vs **Live** — affects badges only at the moment.

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
  where they enter their work email and receive a magic link from
  Supabase. Magic-link delivery is currently rate-limited to
  ~4/hour — don't test repeatedly. Once a prospect is signed in,
  their session lasts 7 days.

---

## 6. Importing products

`Master → Import products`. Upload a CSV of product rows. Tag the
import batch so you can later toggle it on/off per campaign in the
"Imported product sets" section of the edit screen.

---

## 7. Users

`Master → Users` lists who's authorized on the master admin allow-list.
For now we use a single shared master password — the users list is for
future magic-link admin auth.

---

## 8. Tracking

Google Tag Manager (`GTM-NFMTDM7P`) fires on every page including
prospect sites and the master admin. Talk to marketing about which
events to wire up.

---

## Troubleshooting

| Symptom                                       | Likely cause / fix                                       |
| --------------------------------------------- | -------------------------------------------------------- |
| Prospect didn't get the magic link email      | Free-tier rate limit (4/hr). Wait or check spam.         |
| Magic link arrives but link doesn't work      | Redirect URL not allowlisted in Supabase dashboard.      |
| Logo box is baked into saved product image    | Should be fixed — if it recurs, deselect before saving.  |
| New changes aren't on the live site           | Vercel auto-deploy is flaky. Ask Geof to re-deploy.      |
| "Site not found" on prospect URL              | Slug typo or campaign hasn't been created yet.           |

If something else breaks, ping Geof.
