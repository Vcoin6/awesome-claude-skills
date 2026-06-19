# Deploying Merchly to Vercel

Merchly is a standard Next.js 14 app, so it deploys cleanly on Vercel — with one
thing to set up: **persistent storage**. Serverless filesystems are read-only and
ephemeral, so production uses **Vercel KV** for data and **Vercel Blob** for media.
Merchly auto-detects both (locally it falls back to a JSON file + `public/uploads`,
so `npm run dev` stays zero-config).

---

## 1. Import the project

1. Push this repo to GitHub (already done) and open <https://vercel.com/new>.
2. Import the repository.
3. **Set the Root Directory to `merchly`** (this app lives in a subfolder).
   Framework preset auto-detects as **Next.js**. Leave build/output defaults.

## 2. Add storage (required)

In the Vercel project → **Storage**:

- **Create a KV (Redis) store** → "Connect to Project". Vercel injects
  `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically.
- **Create a Blob store** → "Connect to Project". Vercel injects
  `BLOB_READ_WRITE_TOKEN` automatically.

That's all the wiring — `lib/db.js` and `lib/storage.js` switch to these the
moment the env vars exist.

## 3. Add environment variables

Project → **Settings → Environment Variables** (Production + Preview):

| Variable | Value |
| -------- | ----- |
| `AUTH_SECRET` | a long random string (`openssl rand -base64 48`) |
| `PLATFORM_FEE_PERCENT` | `5` |
| `STRIPE_SECRET_KEY` | `sk_live_…` (or `sk_test_…` to start) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_…` / `pk_test_…` |
| `STRIPE_WEBHOOK_SECRET` | from step 5 |

`KV_*` and `BLOB_READ_WRITE_TOKEN` are added for you when you connect the stores.

## 4. Deploy

Click **Deploy**. You'll get a URL like `https://merchly.vercel.app`.
Without Stripe keys the app runs in simulation mode; with them it processes real
payments and the 95/5 split.

## 5. Point Stripe at your live webhook

1. <https://dashboard.stripe.com/webhooks> → **Add endpoint**.
2. URL: `https://<your-domain>/api/webhooks/stripe`
3. Events: `payment_intent.succeeded` and `account.updated`.
4. Copy the endpoint's **Signing secret** (`whsec_…`) into the
   `STRIPE_WEBHOOK_SECRET` env var, then redeploy.

Also enable **Connect → Express accounts** in the Stripe dashboard so sellers can
onboard for their 95% payouts.

## 6. (Optional) Deploy hooks / CLI

```bash
npm i -g vercel
cd merchly
vercel            # link + preview deploy
vercel --prod     # production deploy
```

---

## Notes & limits

- **Uploads:** handled by **client-side direct-to-Blob** (`@vercel/blob/client`).
  When a Blob store is connected, the browser uploads files **straight to Vercel
  Blob** after getting a scoped token from `/api/upload/blob`, bypassing the
  serverless ~4.5 MB request-body limit — so full-size videos (up to 200 MB)
  work in production. Locally (no Blob token) it falls back to multipart through
  `/api/upload` to the filesystem. This switch is automatic.
- **KV single-key store:** the whole dataset lives under one KV key with
  serialized writes — perfect for an MVP. For heavy concurrent traffic, migrate
  `lib/db.js` to Vercel Postgres / Neon (same `readDB`/`writeDB` API).
- **Regions:** set a primary region near your users in Project → Settings.
- The **mobile app** (`../merchly-mobile`) just needs `EXPO_PUBLIC_API_URL` set to
  your deployed URL — it reads the Stripe publishable key from `/api/config`.
