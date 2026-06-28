import { NextResponse } from 'next/server';
import { readDB, writeDB, uid } from '@/lib/db';
import { getRequestUser } from '@/lib/auth';
import { attachRatings } from '@/lib/reviews';

// GET /api/favorites — current user's saved listings (+ the set of ids).
export async function GET(req) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ ids: [], listings: [] });

  const db = await readDB();
  const favIds = db.favorites.filter((f) => f.userId === user.id).map((f) => f.listingId);
  const listings = attachRatings(
    db.listings.filter((l) => favIds.includes(l.id) && l.status !== 'removed'),
    db.reviews
  );
  return NextResponse.json({ ids: favIds, listings });
}

// POST /api/favorites — toggle a listing in/out of favorites. { listingId }
export async function POST(req) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Log in to save favorites.' }, { status: 401 });

  const { listingId } = await req.json().catch(() => ({}));
  if (!listingId) return NextResponse.json({ error: 'Missing listingId.' }, { status: 400 });

  let favorited;
  await writeDB((d) => {
    const existing = d.favorites.find((f) => f.userId === user.id && f.listingId === listingId);
    if (existing) {
      d.favorites = d.favorites.filter((f) => f !== existing);
      favorited = false;
    } else {
      d.favorites.push({ id: uid('fav'), userId: user.id, listingId, createdAt: new Date().toISOString() });
      favorited = true;
    }
  });
  return NextResponse.json({ favorited });
}
