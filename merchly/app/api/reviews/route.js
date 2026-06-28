import { NextResponse } from 'next/server';
import { readDB, writeDB, uid } from '@/lib/db';
import { getRequestUser } from '@/lib/auth';
import { canUserReview } from '@/lib/reviews';

// POST /api/reviews  { listingId, rating (1-5), text }
// Only verified buyers (paid order containing the item, no prior review) may post.
export async function POST(req) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'You must be logged in to review.' }, { status: 401 });

  const { listingId, rating, text } = await req.json().catch(() => ({}));
  const stars = Math.round(Number(rating));
  if (!listingId || !Number.isFinite(stars) || stars < 1 || stars > 5) {
    return NextResponse.json({ error: 'Pick a rating from 1 to 5 stars.' }, { status: 400 });
  }

  const db = await readDB();
  const listing = db.listings.find((l) => l.id === listingId);
  if (!listing) return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });

  if (!canUserReview({ reviews: db.reviews, orders: db.orders, userId: user.id, listingId })) {
    return NextResponse.json(
      { error: 'Only verified buyers can review, and only once per item.' },
      { status: 403 }
    );
  }

  const review = {
    id: uid('rev'),
    listingId,
    sellerId: listing.sellerId,
    buyerId: user.id,
    buyerName: user.name,
    rating: stars,
    text: String(text || '').trim().slice(0, 1000),
    createdAt: new Date().toISOString(),
  };

  await writeDB((d) => {
    d.reviews.push(review);
  });

  return NextResponse.json({ review }, { status: 201 });
}
