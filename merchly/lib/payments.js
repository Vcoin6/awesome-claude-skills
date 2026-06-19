// Payment + commission engine.
//
// Merchly's business model: the seller keeps 95% of every sale, and the
// platform owner automatically receives a 5% commission. This module
// implements that split in two interchangeable ways:
//
//   1. STRIPE CONNECT (real money) — when STRIPE_SECRET_KEY is set, we create a
//      destination charge with an `application_fee_amount` equal to 5%. Stripe
//      moves the platform fee to YOUR account and the remaining 95% to the
//      seller's connected account automatically, on every transaction.
//
//   2. SIMULATION (default) — with no keys configured, Merchly runs a built-in
//      ledger simulation so the entire flow is demoable out of the box.
//
// The 5% number is read from PLATFORM_FEE_PERCENT so you can tune it later.

export const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT || 5);

export function feeBreakdown(amountCents) {
  const platformFee = Math.round(amountCents * (PLATFORM_FEE_PERCENT / 100));
  const sellerNet = amountCents - platformFee;
  return { amount: amountCents, platformFee, sellerNet, feePercent: PLATFORM_FEE_PERCENT };
}

export function isStripeEnabled() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

let _stripe = null;
async function getStripe() {
  if (_stripe) return _stripe;
  const Stripe = (await import('stripe')).default;
  _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return _stripe;
}

// Charge the buyer and split the proceeds 95/5.
// `seller.stripeAccountId` is the seller's Stripe Connect account.
export async function processPayment({ amountCents, currency = 'usd', seller, buyer, description }) {
  const breakdown = feeBreakdown(amountCents);

  if (isStripeEnabled() && seller?.stripeAccountId) {
    const stripe = await getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: breakdown.amount,
      currency,
      description,
      // 5% application fee is kept by the platform automatically.
      application_fee_amount: breakdown.platformFee,
      // The remaining 95% is routed to the seller's connected account.
      transfer_data: { destination: seller.stripeAccountId },
      metadata: {
        buyerId: buyer?.id || '',
        sellerId: seller?.id || '',
        platform: 'merchly',
      },
    });
    return {
      mode: 'stripe',
      status: paymentIntent.status,
      reference: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      ...breakdown,
    };
  }

  // Simulation: pretend the charge succeeded and record the split.
  return {
    mode: 'simulation',
    status: 'succeeded',
    reference: `sim_${Math.random().toString(36).slice(2, 12)}`,
    ...breakdown,
  };
}

// Create (or surface) a seller onboarding link for Stripe Connect so sellers
// can receive their 95% payouts. In simulation mode we return a stub.
export async function createSellerOnboarding({ user, returnUrl }) {
  if (!isStripeEnabled()) {
    return { mode: 'simulation', url: null, accountId: `acct_sim_${user.id}` };
  }
  const stripe = await getStripe();
  const account = await stripe.accounts.create({
    type: 'express',
    email: user.email,
    business_type: 'individual',
    metadata: { merchlyUserId: user.id },
  });
  const link = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: returnUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });
  return { mode: 'stripe', url: link.url, accountId: account.id };
}
