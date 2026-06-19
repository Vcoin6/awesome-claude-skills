<h1 align="center">📱 Merchly Mobile</h1>
<p align="center">The native iOS &amp; Android app for Merchly — built with Expo (React Native).</p>

This app talks to the **same backend API** as the Merchly web app (`../merchly`),
so listings, accounts, the 95/5 payment split, and Stripe payouts are all shared.

---

## Features

- 🛍️ **Marketplace** — browse, search, and filter merch with a native grid + pull-to-refresh.
- 🎬 **Product pages** — swipeable photo & video galleries.
- 🔐 **Auth** — register as a **seller** or **shopper**; sessions persist securely via `expo-secure-store` (Bearer-token auth).
- 📈 **Seller dashboard** — live earnings (net 95%, gross, fees, units), listing manager.
- 📸 **Create listings on the go** — pick photos & video from the device (`expo-image-picker`) and upload.
- 🛒 **Cart & checkout** — native **Stripe PaymentSheet** for real card payments (Apple Pay / Google Pay ready), with the same automatic 95/5 split.

---

## Prerequisites

1. The **Merchly backend** running and reachable from your device/emulator
   (`cd ../merchly && npm run dev` → `http://localhost:3000`).
2. [Node.js](https://nodejs.org), and the [Expo Go](https://expo.dev/go) app on your phone (or an iOS/Android simulator).

---

## Run it

```bash
cd merchly-mobile
npm install

# Point the app at your backend. Use your machine's LAN IP (not "localhost")
# when testing on a physical device, e.g. http://192.168.1.50:3000
EXPO_PUBLIC_API_URL="http://localhost:3000" npm start
```

Then press `i` (iOS simulator), `a` (Android), or scan the QR code with Expo Go.

> The API base URL resolves from `EXPO_PUBLIC_API_URL`, then `app.json → expo.extra.apiUrl`,
> then defaults to `http://localhost:3000`.

---

## How it connects

| Concern | Implementation |
| ------- | -------------- |
| API client | `src/api.js` — thin `fetch` wrapper, Bearer-token auth, points at the Next.js API |
| Auth | `src/auth.js` — token stored in `expo-secure-store`, restored on launch via `/api/auth/me` |
| Cart | `src/cart.js` — persisted in `AsyncStorage` |
| Payments | `app/checkout.js` — calls `/api/checkout`, then drives Stripe's **PaymentSheet** with the returned `clientSecret`. The backend webhook pays each seller their 95%. |
| Stripe key | Loaded at launch from `/api/config` so web + mobile share one source of truth |

Because the **split and payouts live server-side**, the mobile app never handles
money math or secrets — it just confirms the payment. Simulation mode works here
too: with no Stripe keys on the server, checkout completes instantly for demos.

---

## Building for the stores

```bash
npm install -g eas-cli
eas build --platform ios       # App Store
eas build --platform android   # Google Play
```

Set `expo.extra.apiUrl` (or an `EXPO_PUBLIC_API_URL` build env) to your production
API URL before building. Configure the Stripe merchant identifiers in `app.json`.
