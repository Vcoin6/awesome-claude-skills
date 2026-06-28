'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { formatMoney } from '@/lib/format';

export default function ProductCard({ listing }) {
  const videoRef = useRef(null);
  const cover = listing.media?.[0];
  const isVideo = cover?.type === 'video';

  function onEnter() {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }
  function onLeave() {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }

  return (
    <Link
      href={`/product/${listing.id}`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="group block overflow-hidden rounded-2xl bg-ink-card ring-1 ring-ink-line transition hover:ring-brand-violet/60 hover:shadow-glow"
    >
      <div className="relative aspect-square overflow-hidden bg-ink-soft">
        {cover ? (
          isVideo ? (
            <video
              ref={videoRef}
              src={cover.url}
              muted
              loop
              playsInline
              preload="metadata"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover.url}
              alt={listing.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          )
        ) : (
          <div className="grid h-full w-full place-items-center text-white/20">No media</div>
        )}

        {listing.media?.some((m) => m.type === 'video') && (
          <span className="pill absolute left-2 top-2 bg-black/60 text-white backdrop-blur">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            Video
          </span>
        )}
        {listing.media?.length > 1 && (
          <span className="pill absolute right-2 top-2 bg-black/60 text-white backdrop-blur">{listing.media.length} ·</span>
        )}
      </div>

      <div className="space-y-1 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-sm font-semibold text-white">{listing.title}</h3>
          <span className="shrink-0 font-display text-sm font-700 text-white">{formatMoney(listing.priceCents)}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="line-clamp-1 text-xs text-white/45">by {listing.sellerName}</p>
          {listing.rating?.count > 0 && (
            <span className="flex shrink-0 items-center gap-0.5 text-xs text-white/60">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="#F59E0B"><path d="m12 2 2.9 6.26 6.1.5-4.6 4 1.4 6.74L12 16.9 6.2 19.5l1.4-6.74-4.6-4 6.1-.5z" /></svg>
              {listing.rating.avg.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
