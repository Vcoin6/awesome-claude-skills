'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatMoney } from '@/lib/format';
import { addToCart } from '@/lib/cart';

export default function ProductView({ listing }) {
  const router = useRouter();
  const [active, setActive] = useState(0);
  const [added, setAdded] = useState(false);
  const media = listing.media || [];
  const current = media[active];

  function add() {
    addToCart(listing, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }

  function buyNow() {
    addToCart(listing, 1);
    router.push('/checkout');
  }

  const soldOut = listing.stock <= 0;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-ink-card ring-1 ring-ink-line">
            {current ? (
              current.type === 'video' ? (
                <video src={current.url} controls autoPlay muted loop playsInline className="h-full w-full object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={current.url} alt={listing.title} className="h-full w-full object-cover" />
              )
            ) : (
              <div className="grid h-full w-full place-items-center text-white/20">No media</div>
            )}
          </div>
          {media.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {media.map((m, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl ring-2 transition ${i === active ? 'ring-brand-violet' : 'ring-transparent hover:ring-white/20'}`}
                >
                  {m.type === 'video' ? (
                    <>
                      <video src={m.url} muted className="h-full w-full object-cover" />
                      <span className="absolute inset-0 grid place-items-center bg-black/30 text-white">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                      </span>
                    </>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.url} alt="" className="h-full w-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <Link href={`/seller/${listing.sellerId}`} className="inline-flex items-center gap-2 text-sm text-white/55 hover:text-white">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-gradient text-xs font-bold text-white">
              {listing.sellerName?.[0]?.toUpperCase()}
            </span>
            {listing.sellerName}
          </Link>

          <h1 className="mt-4 font-display text-3xl font-700 leading-tight text-white">{listing.title}</h1>
          <div className="mt-3 flex items-center gap-3">
            <span className="font-display text-3xl font-700 gradient-text">{formatMoney(listing.priceCents)}</span>
            {soldOut ? (
              <span className="pill bg-red-500/15 text-red-300">Sold out</span>
            ) : listing.stock <= 5 ? (
              <span className="pill bg-brand-amber/15 text-brand-amber">Only {listing.stock} left</span>
            ) : (
              <span className="pill bg-emerald-500/15 text-emerald-300">In stock</span>
            )}
          </div>

          {listing.description && (
            <p className="mt-5 whitespace-pre-line text-white/70">{listing.description}</p>
          )}

          {listing.tags?.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {listing.tags.map((t) => (
                <span key={t} className="pill bg-white/5 text-white/50 ring-1 ring-white/10">#{t}</span>
              ))}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button onClick={buyNow} disabled={soldOut} className="btn-primary flex-1 py-4">
              {soldOut ? 'Sold out' : 'Buy now'}
            </button>
            <button onClick={add} disabled={soldOut} className="btn-ghost flex-1 py-4">
              {added ? '✓ Added to cart' : 'Add to cart'}
            </button>
          </div>

          <div className="mt-6 rounded-2xl bg-ink-soft p-4 text-sm text-white/55 ring-1 ring-ink-line">
            Secure checkout · Seller receives 95% instantly · Backed by Merchly buyer protection
          </div>
        </div>
      </div>
    </div>
  );
}
