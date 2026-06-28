import Link from 'next/link';
import { redirect } from 'next/navigation';
import { readDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { attachRatings } from '@/lib/reviews';
import ProductCard from '@/components/ProductCard';

export const dynamic = 'force-dynamic';

export default async function FavoritesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const db = await readDB();
  const favIds = db.favorites
    .filter((f) => f.userId === user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((f) => f.listingId);
  const listings = attachRatings(
    favIds.map((id) => db.listings.find((l) => l.id === id)).filter((l) => l && l.status !== 'removed'),
    db.reviews
  );

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="font-display text-3xl font-700 text-white">Saved items</h1>
      <p className="text-sm text-white/50">Merch you’ve hearted, ready when you are.</p>

      {listings.length === 0 ? (
        <div className="card mt-8 grid place-items-center gap-3 px-6 py-16 text-center">
          <p className="text-white/60">No saved items yet. Tap the ♥ on any listing to save it here.</p>
          <Link href="/marketplace" className="btn-primary">Browse the marketplace</Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {listings.map((l) => (
            <ProductCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}
