import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { constructWebhookEvent, payoutToSellers } from '@/lib/payments';

// POST /api/webhooks/stripe
// Configure this URL in your Stripe Dashboard (or `stripe listen --forward-to`)
// and set STRIPE_WEBHOOK_SECRET. Stripe needs the RAW request body to verify
// the signature, so we read it with req.text() and never parse it first.
export const dynamic = 'force-dynamic';

export async function POST(req) {
  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature');

  let event;
  try {
    event = await constructWebhookEvent(rawBody, signature);
  } catch (err) {
    return NextResponse.json({ error: `Webhook signature failed: ${err.message}` }, { status: 400 });
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      await onPaymentSucceeded(event.data.object);
      break;
    case 'account.updated':
      await onAccountUpdated(event.data.object);
      break;
    default:
      // Ignore other event types.
      break;
  }

  return NextResponse.json({ received: true });
}

async function onPaymentSucceeded(intent) {
  const db = await readDB();
  const orders = db.orders.filter((o) => o.paymentRef === intent.id && o.status !== 'paid');
  if (orders.length === 0) return;

  // 1) Mark orders paid + decrement stock.
  await writeDB((d) => {
    for (const o of d.orders) {
      if (o.paymentRef !== intent.id) continue;
      o.status = 'paid';
      for (const item of o.items) {
        const listing = d.listings.find((l) => l.id === item.listingId);
        if (listing && typeof listing.stock === 'number') {
          listing.stock = Math.max(0, listing.stock - item.qty);
        }
      }
    }
  });

  // 2) Pay each seller their 95% via a Stripe transfer.
  const splits = orders.map((o) => {
    const seller = db.users.find((u) => u.id === o.sellerId);
    return { sellerId: o.sellerId, stripeAccountId: seller?.stripeAccountId, sellerNet: o.sellerNet, orderId: o.id };
  });

  const transfers = await payoutToSellers({
    transferGroup: orders[0].transferGroup,
    splits,
    sourceCharge: intent.latest_charge,
  });

  // 3) Record payout references.
  await writeDB((d) => {
    for (const t of transfers) {
      const order = d.orders.find((o) => o.id === t.orderId);
      if (order) {
        order.paidOut = true;
        order.transferRef = t.id;
      }
    }
  });
}

async function onAccountUpdated(account) {
  const enabled = Boolean(account.payouts_enabled && account.charges_enabled);
  await writeDB((d) => {
    const user = d.users.find((u) => u.stripeAccountId === account.id);
    if (user) user.payoutsEnabled = enabled;
  });
}
