import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';
import { getRequestUser } from '@/lib/auth';
import { canUserReview } from '@/lib/reviews';

// GET /api/orders/mine — the current buyer's purchase history.
export async function GET(req) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = await readDB();
  const orders = db.orders
    .filter((o) => o.buyerId === user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    // Mark which line items the buyer can still review (paid + not yet reviewed).
    .map((o) => ({
      ...o,
      items: o.items.map((i) => ({
        ...i,
        canReview: canUserReview({ reviews: db.reviews, orders: db.orders, userId: user.id, listingId: i.listingId }),
      })),
    }));

  return NextResponse.json({ orders });
}
