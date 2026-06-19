import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';
import { getRequestUser } from '@/lib/auth';

// GET /api/seller/orders — the current seller's sales + earnings summary.
// Used by the mobile dashboard (and any future web API consumers).
export async function GET(req) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'seller') {
    return NextResponse.json({ error: 'Sellers only.' }, { status: 403 });
  }

  const db = await readDB();
  const orders = db.orders
    .filter((o) => o.sellerId === user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Only paid orders count toward realized earnings.
  const paid = orders.filter((o) => o.status === 'paid');
  const summary = {
    grossCents: paid.reduce((s, o) => s + o.amount, 0),
    netCents: paid.reduce((s, o) => s + o.sellerNet, 0),
    feeCents: paid.reduce((s, o) => s + o.platformFee, 0),
    unitsSold: paid.reduce((s, o) => s + o.items.reduce((n, i) => n + i.qty, 0), 0),
    orderCount: paid.length,
  };

  return NextResponse.json({ orders, summary, payoutsEnabled: user.payoutsEnabled });
}
