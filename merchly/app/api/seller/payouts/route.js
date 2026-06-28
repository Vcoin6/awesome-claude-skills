import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';
import { getRequestUser } from '@/lib/auth';

// GET /api/seller/payouts?format=csv — the seller's payout history.
// Returns JSON by default, or a downloadable CSV when format=csv.
export async function GET(req) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'seller') return NextResponse.json({ error: 'Sellers only.' }, { status: 403 });

  const db = await readDB();
  const orders = db.orders
    .filter((o) => o.sellerId === user.id && o.status === 'paid')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const format = new URL(req.url).searchParams.get('format');
  if (format !== 'csv') {
    return NextResponse.json({ orders });
  }

  const rows = [
    ['Order ID', 'Date', 'Buyer', 'Items', 'Gross (USD)', 'Fee 5% (USD)', 'Net 95% (USD)', 'Payout status'],
    ...orders.map((o) => [
      o.id,
      new Date(o.createdAt).toISOString(),
      o.buyerName,
      o.items.map((i) => `${i.qty}x ${i.title}`).join('; '),
      (o.amount / 100).toFixed(2),
      (o.platformFee / 100).toFixed(2),
      (o.sellerNet / 100).toFixed(2),
      o.paidOut ? 'paid out' : 'pending',
    ]),
  ];
  const csv = rows.map((r) => r.map(csvCell).join(',')).join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="merchly-payouts-${user.id}.csv"`,
    },
  });
}

function csvCell(value) {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
