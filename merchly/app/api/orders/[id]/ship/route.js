import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { getRequestUser } from '@/lib/auth';
import { notify } from '@/lib/notify';

const CARRIERS = {
  usps: (t) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${t}`,
  ups: (t) => `https://www.ups.com/track?tracknum=${t}`,
  fedex: (t) => `https://www.fedex.com/fedextrack/?trknbr=${t}`,
  dhl: (t) => `https://www.dhl.com/en/express/tracking.html?AWB=${t}`,
  other: () => null,
};

// POST /api/orders/[id]/ship — seller marks their order shipped.
// Body: { carrier, tracking, status? }  (status 'shipped' | 'delivered')
export async function POST(req, { params }) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { carrier, tracking, status } = await req.json().catch(() => ({}));
  const db = await readDB();
  const order = db.orders.find((o) => o.id === params.id);
  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  if (order.sellerId !== user.id) return NextResponse.json({ error: 'Not your order.' }, { status: 403 });

  const newStatus = status === 'delivered' ? 'delivered' : 'shipped';
  const carrierKey = CARRIERS[carrier] ? carrier : 'other';
  const trackingUrl = tracking ? CARRIERS[carrierKey](encodeURIComponent(tracking)) : null;

  await writeDB((d) => {
    const o = d.orders.find((x) => x.id === params.id);
    o.fulfillment = {
      status: newStatus,
      carrier: carrierKey,
      tracking: tracking || null,
      trackingUrl,
      shippedAt: o.fulfillment?.shippedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  if (order.buyerId) {
    await notify(order.buyerId, {
      type: 'shipping',
      title: newStatus === 'delivered' ? 'Order delivered 📦' : 'Your order shipped! 🚚',
      body:
        newStatus === 'delivered'
          ? `Your order from ${order.sellerName} was marked delivered.`
          : `${order.sellerName} shipped your order${tracking ? ` — tracking ${tracking}` : ''}.`,
      url: '/orders',
    });
  }

  return NextResponse.json({ ok: true });
}
