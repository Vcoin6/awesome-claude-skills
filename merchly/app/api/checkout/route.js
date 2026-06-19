import { NextResponse } from 'next/server';
import { readDB, writeDB, uid } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { processPayment, feeBreakdown, isStripeEnabled } from '@/lib/payments';

// POST /api/checkout
// Body: { items: [{ id, qty }], buyer: { email, name } }
// The server NEVER trusts client prices — it re-prices every line from the DB.
export async function POST(req) {
  const currentUser = await getCurrentUser();
  const { items, buyer } = await req.json().catch(() => ({}));

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

  // Re-price and validate stock from the source of truth.
  const lines = [];
  for (const item of items) {
    const listing = db.listings.find((l) => l.id === item.id && l.status === 'active');
    if (!listing) {
      return NextResponse.json({ error: 'An item in your cart is no longer available.' }, { status: 409 });
    }
    const qty = Math.max(1, Math.min(Number(item.qty) || 1, listing.stock || 1));
    lines.push({ listing, qty, lineTotal: listing.priceCents * qty });
  }

  // Group by seller so each seller gets their own 95% payout + 5% to platform.
  const bySeller = new Map();
  for (const line of lines) {
    const sid = line.listing.sellerId;
    if (!bySeller.has(sid)) bySeller.set(sid, []);
    bySeller.get(sid).push(line);
  }

  const orders = [];
  let totalAmount = 0;
  let totalPlatformFee = 0;
  let totalSellerNet = 0;

  for (const [sellerId, sellerLines] of bySeller) {
    const seller = db.users.find((u) => u.id === sellerId);
    const amount = sellerLines.reduce((s, l) => s + l.lineTotal, 0);

    const payment = await processPayment({
      amountCents: amount,
      seller,
      buyer: buyerInfo,
      description: `Merchly order — ${sellerLines.map((l) => l.listing.title).join(', ')}`.slice(0, 200),
    });

    const order = {
      id: uid('ord'),
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
      })),
      amount: payment.amount,
      platformFee: payment.platformFee,
      sellerNet: payment.sellerNet,
      feePercent: payment.feePercent,
      paymentMode: payment.mode,
      paymentRef: payment.reference,
      status: payment.status === 'succeeded' ? 'paid' : 'pending',
      createdAt: new Date().toISOString(),
    };
    orders.push(order);
    totalAmount += payment.amount;
    totalPlatformFee += payment.platformFee;
    totalSellerNet += payment.sellerNet;
  }

  // Persist orders + decrement stock.
  await writeDB((d) => {
    for (const o of orders) d.orders.push(o);
    for (const line of lines) {
      const l = d.listings.find((x) => x.id === line.listing.id);
      if (l && typeof l.stock === 'number') l.stock = Math.max(0, l.stock - line.qty);
    }
  });

  return NextResponse.json({
    ok: true,
    mode: isStripeEnabled() ? 'stripe' : 'simulation',
    orders,
    summary: {
      ...feeBreakdown(totalAmount),
      platformFee: totalPlatformFee,
      sellerNet: totalSellerNet,
      orderCount: orders.length,
    },
  });
}
