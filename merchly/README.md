<h1 align="center">🛍️ Merchly</h1>
<p align="center"><strong>Sell your merch. Keep 95%.</strong></p>
<p align="center">The creator-first marketplace for selling merchandise with photos &amp; video — list in seconds, get paid instantly, keep 95% of every sale.</p>

---

## Why "Merchly"?

You asked for the best name to make the app appealing and attractive to sellers.
**Merchly** was chosen because it is:

- **Instantly clear** — "merch" is right in the name, so shoppers and sellers know exactly what it is.
- **Brandable & app-store safe** — short, friendly, easy to say, easy to spell, easy to find.
- **Built around the pitch** — the whole brand leans on the tagline **"Sell your merch. Keep 95%."**, which turns the 5% platform fee into a *selling point* instead of a cost.

> Alternatives considered: *Stalld, Dropt, Vendly, Merchverse*. Merchly tested best for clarity + memorability. The name lives in one place (`components/Logo.jsx` + copy), so it's trivial to rebrand later.

---

## The business model (your 5%)

Every sale is split **automatically**:

| Who | Share | On a $100 sale |
| --- | ----- | -------------- |
| **Seller** (the client) | **95%** | **$95.00** |
| **You** (app owner) | **5%** | **$5.00** |

- The buyer is charged once at checkout.
- The platform's **5% commission is taken automatically** and lands in **your** account.
- The remaining **95% is routed to the seller's** connected payout account.
- Each order is grouped **per seller**, so a multi-seller cart pays out correctly to everyone.

The percentage is a single env var (`PLATFORM_FEE_PERCENT`) — change it any time.

### Two payment modes (zero-config demo → real money)

`lib/payments.js` implements the split two ways and picks automatically:

1. **Simulation (default).** With no API keys, Merchly runs a built-in ledger so the
   entire flow — checkout, the 95/5 split, seller earnings, your fees — is fully
   demoable out of the box.
2. **Stripe Connect (real money).** Add `STRIPE_SECRET_KEY` and the app switches to
   Stripe **destination charges** with an `application_fee_amount` equal to 5%.
   Stripe moves your fee to your account and the seller's 95% to their connected
   account on every transaction — no manual payouts, fully compliant money movement.

---

## Features

- 🔐 **Dual registration** — sign up as a **Seller** or a **Shopper** (role picker on `/register`).
- 🧑‍🎨 **Creator profiles** — every seller gets a public store page at `/seller/[id]`.
- 📸 **Photo & video uploads** — drag-and-drop multi-file uploader; product cards **auto-play video on hover**; product pages have a full gallery.
- 🏪 **Listings** — title, description, price, stock, category, tags, up to 10 media each.
- 🔎 **Marketplace** — live search, category filters, and sorting.
- 🛒 **Cart & checkout** — persistent cart, secure checkout, instant **95/5 split** with a clear breakdown.
- 📊 **Seller dashboard** — net earnings (95%), gross sales, your fees, units sold, listing manager, and recent sales.
- 💳 **Payouts** — one-click Stripe Connect onboarding (simulated in demo mode).
- 📱 **Fully responsive** — looks great on phone, tablet, and desktop (mobile-first).

---

## Design system

A bold, premium, creator-native look designed to feel more modern than the competition.

| Token | Value | Use |
| ----- | ----- | --- |
| Background | `#0B0B12` (near-black "ink") | App canvas |
| Brand Violet | `#7C3AED` | Primary |
| Brand Fuchsia | `#DB2777` | Accent / links |
| Brand Amber | `#F59E0B` | Highlights |
| Signature gradient | violet → fuchsia → amber | Buttons, logo, headlines |

- **Display font:** Space Grotesk (geometric, confident)
- **Body font:** Inter (clean, highly legible)
- Glowing gradient CTAs, soft card surfaces, subtle grid texture, dark premium aesthetic.

---

## Tech stack

- **Next.js 14** (App Router) — one codebase for web UI + API.
- **React 18** + **Tailwind CSS** — fast, responsive, themeable.
- **bcryptjs** + **JWT** httpOnly cookies — secure auth.
- **Stripe** (Connect) — real payment splitting (optional).
- **Zero-dependency JSON datastore** (`lib/db.js`) for instant local runs — swap for Postgres/Prisma in production via the same small API.

---

## Getting started

```bash
cd merchly
npm install

# (optional) seed demo sellers + listings so the marketplace looks alive
node scripts/seed.mjs

npm run dev          # http://localhost:3000
```

Demo seller login (after seeding): **novaprints@demo.merchly** / **password123**

### Production

```bash
npm run build && npm start
```

### Configuration (optional)

Copy `.env.example` → `.env.local`:

```bash
AUTH_SECRET=<long-random-string>
PLATFORM_FEE_PERCENT=5
# Add these to enable REAL money movement via Stripe Connect:
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

Everything runs in **demo mode with no configuration**.

---

## Project structure

```
merchly/
├── app/
│   ├── page.js                 # Landing (hero, how-it-works, pricing)
│   ├── marketplace/            # Browse + search + filter
│   ├── product/[id]/           # Product detail + media gallery
│   ├── seller/[id]/            # Public creator store
│   ├── dashboard/              # Seller dashboard (earnings, listings)
│   ├── register/ login/        # Auth (seller/shopper role picker)
│   ├── cart/ checkout/         # Cart + checkout with 95/5 split
│   └── api/                    # auth, listings, upload, checkout, seller/onboard
├── components/                 # Navbar, ProductCard, MediaUploader, ListingComposer…
├── lib/
│   ├── db.js                   # JSON datastore (swap for a real DB in prod)
│   ├── auth.js                 # Password hashing + JWT cookie sessions
│   ├── payments.js             # 95/5 split engine (Stripe Connect + simulation)
│   ├── cart.js                 # Client cart (localStorage)
│   └── format.js               # Money / time helpers
└── scripts/seed.mjs            # Demo data generator (self-contained SVG media)
```

---

## Security notes

- Passwords are bcrypt-hashed; sessions are signed httpOnly JWT cookies.
- **Checkout never trusts client prices** — every line is re-priced from the database and stock is re-validated server-side.
- Uploads are type- and size-validated (images/video only, 50MB cap, max 10 per listing).

---

## Production roadmap

The MVP is complete and runnable. To scale toward "millions of users":

1. **Database:** swap the JSON store for Postgres (Prisma) — call sites already use a small, stable API.
2. **Media:** move uploads to S3/Cloudflare R2 + a CDN, add image/video transcoding & thumbnails.
3. **Payments:** finish Stripe Connect (webhooks for payout status, refunds, disputes, tax).
4. **Trust & safety:** content moderation, seller verification (KYC via Stripe), buyer protection, ratings/reviews.
5. **Growth:** native mobile apps (React Native/Expo share this API), push notifications, shareable drop pages, creator referral program.
6. **Ops:** rate limiting, audit logs, analytics, and an admin console for you (the owner) to watch revenue.

---

<p align="center">Built to put creators first — and to make every 5% count. 💜</p>
