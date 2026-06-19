// Payment + commission engine.
//
// Merchly's business model: the seller keeps 95% of every sale, and the
// platform owner automatically receives a 5% commission.
//
// Two interchangeable implementations, selected automatically:
//
//   1. STRIPE CONNECT (real money) — when STRIPE_SECRET_KEY is set we use the
//      "separate charges and transfers" model, which is the correct pattern for
//      a marketplace where one cart can contain items from MULTIPLE sellers:
//        a) Charge the buyer ONCE on the platform account for the cart total
//           (a single PaymentIntent → one card entry, one client secret).
//        b) When the payment succeeds (confirmed via webhook), create a Stripe
//           Transfer to each seller's connected account for their 95% share,
//           tagged with a shared transfer_group. The platform keeps whatever
//           is left — i.e. the 5% commission on every line — automatically.
//
//   2. SIMULATION (default) — with no keys, Merchly runs a built-in ledger so
//      the whole flow is demoable/testable out of the box.
//
// The fee percent is read from PLATFORM_FEE_PERCENT so you can tune it later.

export const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT || 5);

export function feeBreakdown(amountCents) {
  const platformFee = Math.round(amountCents * (PLATFORM_FEE_PERCENT / 100));
  const sellerNet = amountCents - platformFee;
  return { amount: amountCents, platformFee, sellerNet, feePercent: PLATFORM_FEE_PERCENT };
}

export function isStripeEnabled() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getPublishableKey() {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY || '';
}

let _stripe = null;
export async function getStripe() {
  if (_stripe) return _stripe;
  const Stripe = (await import('stripe')).default;
  _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
  return _stripe;
}

// ── Checkout ────────────────────────────────────────────────────────────────

// Create the single buyer-facing charge for the whole cart.
// `transferGroup` links this charge to the seller transfers created later.
// Returns a clientSecret the web/mobile client uses to confirm the card.
export async function createCheckoutIntent({ amountCents, currency = 'usd', buyer, transferGroup, metadata = {} }) {
  if (!isStripeEnabled()) {
    // Simulation: pretend the charge succeeded immediately.
    return {
      mode: 'simulation',
      status: 'succeeded',
      paymentIntentId: `sim_pi_${Math.random().toString(36).slice(2, 12)}`,
      clientSecret: null,
      ...feeBreakdown(amountCents),
    };
  }

  const stripe = await getStripe();
  const intent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency,
    transfer_group: transferGroup,
    automatic_payment_methods: { enabled: true },
    receipt_email: buyer?.email || undefined,
    metadata: { platform: 'merchly', transferGroup, ...metadata },
  });
  return {
    mode: 'stripe',
    status: intent.status, // requires_payment_method until the client confirms
    paymentIntentId: intent.id,
    clientSecret: intent.client_secret,
    ...feeBreakdown(amountCents),
  };
}

// After the charge succeeds, pay each seller their 95% share.
// `splits` = [{ stripeAccountId, sellerNet, sellerId }]. Returns the transfers.
export async function payoutToSellers({ transferGroup, currency = 'usd', splits, sourceCharge }) {
  if (!isStripeEnabled()) {
    return splits.map((s) => ({ mode: 'simulation', id: `sim_tr_${Math.random().toString(36).slice(2, 10)}`, ...s }));
  }
  const stripe = await getStripe();
  const out = [];
  for (const s of splits) {
    if (!s.stripeAccountId || s.stripeAccountId.startsWith('acct_sim')) continue;
    const transfer = await stripe.transfers.create({
      amount: s.sellerNet,
      currency,
      destination: s.stripeAccountId,
      transfer_group: transferGroup,
      source_transaction: sourceCharge || undefined,
      metadata: { platform: 'merchly', sellerId: s.sellerId || '' },
    });
    out.push({ mode: 'stripe', id: transfer.id, ...s });
  }
  return out;
}

// ── Seller onboarding (Stripe Connect Express) ───────────────────────────────

export async function createSellerOnboarding({ user, returnUrl }) {
  if (!isStripeEnabled()) {
    return { mode: 'simulation', url: null, accountId: `acct_sim_${user.id}`, payoutsEnabled: true };
  }
  const stripe = await getStripe();

  // Reuse an existing connected account if the seller already started onboarding.
  let accountId = user.stripeAccountId && user.stripeAccountId.startsWith('acct_') && !user.stripeAccountId.startsWith('acct_sim')
    ? user.stripeAccountId
    : null;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      email: user.email,
      business_type: 'individual',
      capabilities: { transfers: { requested: true } },
      metadata: { merchlyUserId: user.id },
    });
    accountId = account.id;
  }

  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: returnUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });
  return { mode: 'stripe', url: link.url, accountId, payoutsEnabled: false };
}

// Check whether a connected account can receive payouts yet.
export async function syncAccountStatus(accountId) {
  if (!isStripeEnabled() || !accountId || accountId.startsWith('acct_sim')) {
    return { payoutsEnabled: true };
  }
  const stripe = await getStripe();
  const account = await stripe.accounts.retrieve(accountId);
  return {
    payoutsEnabled: Boolean(account.payouts_enabled && account.charges_enabled),
    chargesEnabled: Boolean(account.charges_enabled),
  };
}

// ── Webhooks ─────────────────────────────────────────────────────────────────

export async function constructWebhookEvent(rawBody, signature) {
  const stripe = await getStripe();
  return stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
}
