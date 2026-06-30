import { NextResponse } from 'next/server';
import { readDB, writeDB, uid } from '@/lib/db';
import { getRequestUser } from '@/lib/auth';
import {
  createCheckoutIntent,
  feeBreakdown,
  isStripeEnabled,
  getPublishableKey,
} from '@/lib/payments';
import { notify } from '@/lib/notify';
import { formatMoney } from '@/lib/format';
import { validatePromo, normalizeCode } from '@/lib/promos';
import { emailOrderReceipt, emailNewSale } from '@/lib/email';

// POST /api/checkout
// Body: { items: [{ id, qty }], buyer: { email, name } }
//
// The server NEVER trusts client prices — it re-prices every line from the DB.
//
// Simulation mode: the charge "succeeds" instantly, orders are marked paid and
//   stock is decremented immediately.
// Stripe mode: ONE PaymentIntent is created for the whole cart total; orders are
//   created as `pending` and a clientSecret is returned for the client to
//   confirm the card. The webhook (`/api/webhooks/stripe`) marks orders paid,
//   pays out each seller their 95%, and decrements stock.
export async function POST(req) {
  const currentUser = await getRequestUser(req);
  const { items, buyer, code, shipping } = await req.json().catch(() => ({}));

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 });
  }

  const db = await readDB();
  const buyerInfo = currentUser
    ? { id: currentUser.id, name: currentUser.name, email: currentUser.email }
    : { id: null, name: buyer?.name || 'Guest', email: buyer?.email || '' };

  if (!buyerInfo.email) {
    return NextResponse.json({ error: 'An email is required for your receipt.' }, { status: 400 });
  }

  // Re-price + validate stock from the source of truth.
  const lines = [];
  for (const item of items) {
    const listing = db.listings.find((l) => l.id === item.id && l.status === 'active');
    if (!listing) {
      return NextResponse.json({ error: 'An item in your cart is no longer available.' }, { status: 409 });
    }
    // Resolve the chosen variant (if any) and validate against its own stock.
    const hasVariants = Array.isArray(listing.variants) && listing.variants.length > 0;
    let variant = null;
    if (hasVariants) {
      variant = listing.variants.find((v) => v.id === item.variantId);
      if (!variant) {
        return NextResponse.json({ error: `Choose an option for “${listing.title}”.` }, { status: 400 });
      }
      if ((variant.stock || 0) <= 0) {
        return NextResponse.json({ error: `“${listing.title}” (${variant.label}) is sold out.` }, { status: 409 });
      }
    } else if ((listing.stock || 0) <= 0) {
      return NextResponse.json({ error: `“${listing.title}” is sold out.` }, { status: 409 });
    }
    const cap = hasVariants ? variant.stock : listing.stock;
    const qty = Math.max(1, Math.min(Number(item.qty) || 1, cap));
    lines.push({ listing, variant, qty, lineTotal: listing.priceCents * qty });
  }

  // Group by seller so each seller gets their own 95% payout.
  const bySeller = new Map();
  for (const line of lines) {
    const sid = line.listing.sellerId;
    if (!bySeller.has(sid)) bySeller.set(sid, []);
    bySeller.get(sid).push(line);
  }

  const transferGroup = uid('grp');
  const stripe = isStripeEnabled();

  // Resolve an optional promo code to the seller it belongs to.
  const normalizedCode = normalizeCode(code);
  const promo = normalizedCode ? db.promos.find((p) => p.code === normalizedCode && p.active) : null;
  const usedPromoIds = [];

  const orders = [];
  const splits = [];
  let totalAmount = 0;
  let totalPlatformFee = 0;
  let totalSellerNet = 0;

  for (const [sellerId, sellerLines] of bySeller) {
    const seller = db.users.find((u) => u.id === sellerId);
    const gross = sellerLines.reduce((s, l) => s + l.lineTotal, 0);

    // Apply the promo only to its own seller's subtotal.
    let discount = 0;
    let appliedCode = null;
    if (promo && promo.sellerId === sellerId) {
      const v = validatePromo(promo, gross);
      if (v.ok && v.discount > 0) {
        discount = v.discount;
        appliedCode = promo.code;
        usedPromoIds.push(promo.id);
      }
    }
    const amount = Math.max(0, gross - discount);
    const split = feeBreakdown(amount);

    orders.push({
      id: uid('ord'),
      transferGroup,
      buyerId: buyerInfo.id,
      buyerName: buyerInfo.name,
      buyerEmail: buyerInfo.email,
      sellerId,
      sellerName: seller?.name || 'Unknown',
      items: sellerLines.map((l) => ({
        listingId: l.listing.id,
        title: l.listing.title,
        priceCents: l.listing.priceCents,
        qty: l.qty,
        variantId: l.variant?.id || null,
        variantLabel: l.variant?.label || null,
      })),
      gross,
      discount,
      code: appliedCode,
      amount: split.amount,
      platformFee: split.platformFee,
      sellerNet: split.sellerNet,
      feePercent: split.feePercent,
      shipping: shipping || null,
      fulfillment: { status: 'unfulfilled', carrier: null, tracking: null, shippedAt: null },
      paymentMode: stripe ? 'stripe' : 'simulation',
      paymentRef: null,
      // Stripe payouts wait for the webhook; simulation is instantly paid.
      status: stripe ? 'pending' : 'paid',
      paidOut: false,
      createdAt: new Date().toISOString(),
    });

    splits.push({ sellerId, stripeAccountId: seller?.stripeAccountId, sellerNet: split.sellerNet });
    totalAmount += split.amount;
    totalPlatformFee += split.platformFee;
    totalSellerNet += split.sellerNet;
  }

  // Create the single buyer charge for the whole cart.
  const intent = await createCheckoutIntent({
    amountCents: totalAmount,
    buyer: buyerInfo,
    transferGroup,
    metadata: { orderCount: String(orders.length) },
  });

  for (const o of orders) o.paymentRef = intent.paymentIntentId;

  // Persist orders. In simulation mode (instant success) also decrement stock now.
  await writeDB((d) => {
    for (const o of orders) d.orders.push(o);
    if (!stripe) {
      for (const line of lines) {
        const l = d.listings.find((x) => x.id === line.listing.id);
        if (!l) continue;
        if (line.variant && Array.isArray(l.variants)) {
          const v = l.variants.find((x) => x.id === line.variant.id);
          if (v) v.stock = Math.max(0, v.stock - line.qty);
          l.stock = l.variants.reduce((s, x) => s + x.stock, 0);
        } else if (typeof l.stock === 'number') {
          l.stock = Math.max(0, l.stock - line.qty);
        }
      }
    }
    // Count promo usage (once per checkout it was applied to).
    for (const pid of usedPromoIds) {
      const p = d.promos.find((x) => x.id === pid);
      if (p) p.uses = (p.uses || 0) + 1;
    }
  });

  // In simulation mode the orders are paid now, so notify immediately.
  // (In Stripe mode the webhook sends these once the charge succeeds.)
  if (!stripe) {
    for (const o of orders) {
      await notify(o.sellerId, {
        type: 'sale',
        title: 'New sale! 🎉',
        body: `${buyerInfo.name} bought ${o.items.map((i) => `${i.qty}× ${i.title}`).join(', ')} — you earned ${formatMoney(o.sellerNet)}.`,
        url: '/dashboard',
      });
      const seller = db.users.find((u) => u.id === o.sellerId);
      emailNewSale(o, seller?.email).catch(() => {});
      emailOrderReceipt(o).catch(() => {});
    }
    if (buyerInfo.id) {
      await notify(buyerInfo.id, {
        type: 'order',
        title: 'Order confirmed',
        body: `Thanks for your purchase — ${formatMoney(totalAmount)} total across ${orders.length} seller(s).`,
        url: '/orders',
      });
    }
  }

  return NextResponse.json({
    ok: true,
    mode: intent.mode,
    transferGroup,
    // Present only in Stripe mode — the client confirms the card with these.
    clientSecret: intent.clientSecret,
    publishableKey: stripe ? getPublishableKey() : null,
    orders: orders.map((o) => ({ id: o.id, sellerName: o.sellerName, sellerNet: o.sellerNet, status: o.status })),
    summary: {
      amount: totalAmount,
      platformFee: totalPlatformFee,
      sellerNet: totalSellerNet,
      feePercent: feeBreakdown(totalAmount).feePercent,
      orderCount: orders.length,
    },
  });
}
