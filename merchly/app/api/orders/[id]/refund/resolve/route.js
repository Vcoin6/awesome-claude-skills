import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { getRequestUser } from '@/lib/auth';
import { refundOrder } from '@/lib/payments';
import { notify } from '@/lib/notify';
import { formatMoney } from '@/lib/format';

// POST /api/orders/[id]/refund/resolve — seller approves or rejects. { action }
export async function POST(req, { params }) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { action } = await req.json().catch(() => ({}));
  const db = await readDB();
  const order = db.orders.find((o) => o.id === params.id);
  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  if (order.sellerId !== user.id) return NextResponse.json({ error: 'Not your order.' }, { status: 403 });
  if (order.refund?.status !== 'requested') {
    return NextResponse.json({ error: 'No pending refund request.' }, { status: 400 });
  }

  if (action === 'reject') {
    await writeDB((d) => {
      const o = d.orders.find((x) => x.id === params.id);
      o.refund.status = 'rejected';
      o.refund.resolvedAt = new Date().toISOString();
    });
    await notify(order.buyerId, {
      type: 'refund',
      title: 'Refund declined',
      body: `Your refund request for order #${order.id.slice(-6).toUpperCase()} was declined.`,
      url: '/orders',
    });
    return NextResponse.json({ ok: true, status: 'rejected' });
  }

  // Approve → process the refund + restock.
  const result = await refundOrder({
    paymentIntentId: order.paymentRef,
    transferRef: order.transferRef,
    amountCents: order.amount,
    sellerNetCents: order.sellerNet,
  });

  await writeDB((d) => {
    const o = d.orders.find((x) => x.id === params.id);
    o.status = 'refunded';
    o.refund.status = 'refunded';
    o.refund.resolvedAt = new Date().toISOString();
    o.refund.reference = result.id;
    for (const item of o.items) {
      const listing = d.listings.find((l) => l.id === item.listingId);
      if (!listing) continue;
      if (item.variantId && Array.isArray(listing.variants)) {
        const v = listing.variants.find((x) => x.id === item.variantId);
        if (v) v.stock += item.qty;
        listing.stock = listing.variants.reduce((s, x) => s + x.stock, 0);
      } else if (typeof listing.stock === 'number') {
        listing.stock += item.qty;
      }
    }
  });

  await notify(order.buyerId, {
    type: 'refund',
    title: 'Refund approved 💸',
    body: `You’ve been refunded ${formatMoney(order.amount)} for order #${order.id.slice(-6).toUpperCase()}.`,
    url: '/orders',
  });

  return NextResponse.json({ ok: true, status: 'refunded', mode: result.mode });
}
