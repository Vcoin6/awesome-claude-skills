import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { getRequestUser } from '@/lib/auth';
import { notify } from '@/lib/notify';

// POST /api/orders/[id]/refund — buyer requests a refund/return. { reason }
export async function POST(req, { params }) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { reason } = await req.json().catch(() => ({}));
  const db = await readDB();
  const order = db.orders.find((o) => o.id === params.id);
  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  if (order.buyerId !== user.id) return NextResponse.json({ error: 'Not your order.' }, { status: 403 });
  if (order.status !== 'paid') return NextResponse.json({ error: 'Only paid orders can be refunded.' }, { status: 400 });
  if (order.refund && order.refund.status !== 'rejected') {
    return NextResponse.json({ error: 'A refund is already in progress for this order.' }, { status: 409 });
  }

  await writeDB((d) => {
    const o = d.orders.find((x) => x.id === params.id);
    o.refund = {
      status: 'requested',
      reason: String(reason || '').trim().slice(0, 500),
      amount: o.amount,
      requestedAt: new Date().toISOString(),
      resolvedAt: null,
    };
  });

  await notify(order.sellerId, {
    type: 'refund',
    title: 'Refund requested',
    body: `${order.buyerName} requested a refund for order #${order.id.slice(-6).toUpperCase()}.`,
    url: '/dashboard/orders',
  });

  return NextResponse.json({ ok: true });
}
