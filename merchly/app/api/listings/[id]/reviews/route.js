import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';
import { summarize } from '@/lib/reviews';

// GET /api/listings/[id]/reviews — reviews + summary for a listing.
export async function GET(_req, { params }) {
  const db = await readDB();
  const reviews = db.reviews
    .filter((r) => r.listingId === params.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return NextResponse.json({ reviews, summary: summarize(reviews) });
}
