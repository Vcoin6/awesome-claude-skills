'use client';

import { useEffect, useState } from 'react';
import ProductCard from '@/components/ProductCard';

const CATEGORIES = [
  ['all', 'All'],
  ['apparel', 'Apparel'],
  ['accessories', 'Accessories'],
  ['art', 'Art & Prints'],
  ['music', 'Music'],
  ['digital', 'Digital'],
  ['collectibles', 'Collectibles'],
  ['other', 'Other'],
];

export default function MarketplacePage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('new');

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ q, category, sort });
      fetch(`/api/listings?${params}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d) => setListings(d.listings || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, category, sort]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-700 text-white">Marketplace</h1>
          <p className="text-sm text-white/50">Discover merch from creators worldwide</p>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-72">
            <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" /><path d="m20 20-3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search merch…" className="input pl-9" />
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="input w-auto">
            <option value="new">Newest</option>
            <option value="price-asc">Price ↑</option>
            <option value="price-desc">Price ↓</option>
          </select>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {CATEGORIES.map(([val, label]) => (
          <button
            key={val}
            onClick={() => setCategory(val)}
            className={`pill ring-1 transition ${category === val ? 'bg-brand-gradient text-white ring-transparent' : 'bg-white/5 text-white/60 ring-white/10 hover:text-white'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-ink-card" />
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {listings.map((l) => (
              <ProductCard key={l.id} listing={l} />
            ))}
          </div>
        ) : (
          <div className="card grid place-items-center px-6 py-20 text-center text-white/50">
            No merch matches your search yet.
          </div>
        )}
      </div>
    </div>
  );
}
