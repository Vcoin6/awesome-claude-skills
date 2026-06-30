import Link from 'next/link';
import { notFound } from 'next/navigation';
import { readDB } from '@/lib/db';
import { attachRatings } from '@/lib/reviews';
import { categoryBySlug, CATEGORIES } from '@/lib/categories';
import ProductCard from '@/components/ProductCard';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const cat = categoryBySlug(params.slug);
  if (!cat) return { title: 'Category — Merchly' };
  return {
    title: `${cat.name} merch — Merchly`,
    description: cat.blurb,
  };
}

export default async function CategoryPage({ params }) {
  const cat = categoryBySlug(params.slug);
  if (!cat) notFound();

  const db = await readDB();
  const listings = attachRatings(
    db.listings
      .filter((l) => l.category === cat.slug && l.status === 'active')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    db.reviews
  );

  return (
    <div>
      <div className="relative overflow-hidden border-b border-ink-line">
        <div className="absolute inset-0 bg-brand-radial" />
        <div className="relative mx-auto max-w-7xl px-6 py-14">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-fuchsia">Category</p>
          <h1 className="mt-1 font-display text-4xl font-700 text-white">{cat.name}</h1>
          <p className="mt-2 max-w-xl text-white/60">{cat.blurb}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {CATEGORIES.filter((c) => c.slug !== cat.slug).map((c) => (
              <Link key={c.slug} href={`/category/${c.slug}`} className="pill bg-white/5 text-white/60 ring-1 ring-white/10 hover:text-white">{c.name}</Link>
            ))}
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
          <div className="card grid place-items-center gap-3 px-6 py-20 text-center">
            <p className="text-white/60">No {cat.name.toLowerCase()} listings yet.</p>
            <Link href="/marketplace" className="btn-primary">Browse all merch</Link>
          </div>
        )}
      </div>
    </div>
  );
}
