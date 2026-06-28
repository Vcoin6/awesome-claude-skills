import { notFound } from 'next/navigation';
import { readDB, writeDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { listingRating, canUserReview } from '@/lib/reviews';
import ProductView from '@/components/ProductView';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const db = await readDB();
  const listing = db.listings.find((l) => l.id === params.id);
  if (!listing) return { title: 'Not found — Merchly' };
  return {
    title: `${listing.title} — Merchly`,
    description: listing.description?.slice(0, 150) || 'Merch on Merchly',
  };
}

export default async function ProductPage({ params }) {
  const db = await readDB();
  const listing = db.listings.find((l) => l.id === params.id && l.status !== 'removed');
  if (!listing) notFound();

  const user = await getCurrentUser();
  const rating = listingRating(db.reviews, listing.id);
  const canReview = canUserReview({
    reviews: db.reviews,
    orders: db.orders,
    userId: user?.id,
    listingId: listing.id,
  });

  // Best-effort view counter.
  writeDB((d) => {
    const l = d.listings.find((x) => x.id === params.id);
    if (l) l.views = (l.views || 0) + 1;
  }).catch(() => {});

  return <ProductView listing={listing} rating={rating} canReview={canReview} />;
}
