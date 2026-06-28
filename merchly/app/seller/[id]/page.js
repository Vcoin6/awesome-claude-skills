import { notFound } from 'next/navigation';
import { readDB } from '@/lib/db';
import { timeAgo } from '@/lib/format';
import { attachRatings, sellerRating } from '@/lib/reviews';
import ProductCard from '@/components/ProductCard';
import StarRating from '@/components/StarRating';

export const dynamic = 'force-dynamic';

export default async function SellerPage({ params }) {
  const db = await readDB();
  const seller = db.users.find((u) => u.id === params.id);
  if (!seller) notFound();

  const listings = attachRatings(
    db.listings
      .filter((l) => l.sellerId === seller.id && l.status === 'active')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    db.reviews
  );
  const rating = sellerRating(db.reviews, seller.id);

  return (
    <div>
      <div className="relative overflow-hidden border-b border-ink-line">
        <div className="absolute inset-0 bg-brand-radial" />
        <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 py-14 text-center sm:flex-row sm:text-left">
          <div className="grid h-24 w-24 shrink-0 place-items-center rounded-3xl bg-brand-gradient font-display text-4xl font-700 text-white shadow-glow">
            {seller.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <h1 className="font-display text-3xl font-700 text-white">{seller.name}</h1>
              {seller.role === 'seller' && (
                <span className="pill bg-brand-violet/20 text-brand-fuchsia">Seller</span>
              )}
            </div>
            <p className="mt-1 text-sm text-white/50">
              Joined {timeAgo(seller.createdAt)} · {listings.length} {listings.length === 1 ? 'listing' : 'listings'}
            </p>
            {rating.count > 0 && (
              <div className="mt-2 flex justify-center sm:justify-start">
                <StarRating value={rating.avg} count={rating.count} size={16} />
              </div>
            )}
            {seller.bio && <p className="mt-3 max-w-xl text-white/70">{seller.bio}</p>}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10">
        {listings.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {listings.map((l) => (
              <ProductCard key={l.id} listing={l} />
            ))}
          </div>
        ) : (
          <div className="card grid place-items-center px-6 py-20 text-center text-white/50">
            This creator hasn’t dropped any merch yet.
          </div>
        )}
      </div>
    </div>
  );
}
