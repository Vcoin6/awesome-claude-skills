'use client';

import { useCallback, useEffect, useState } from 'react';
import StarRating from './StarRating';
import { timeAgo } from '@/lib/format';

export default function ReviewsSection({ listingId, canReview }) {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ avg: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [eligible, setEligible] = useState(canReview);

  // Form state
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/listings/${listingId}/reviews`);
    const data = await res.json();
    setReviews(data.reviews || []);
    setSummary(data.summary || { avg: 0, count: 0 });
    setLoading(false);
  }, [listingId]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (rating < 1) return setError('Pick a star rating.');
    setSubmitting(true);
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId, rating, text }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) return setError(data.error || 'Could not submit review.');
    setRating(0);
    setText('');
    setEligible(false);
    load();
  }

  return (
    <section className="mt-12 border-t border-ink-line pt-8">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-700 text-white">Reviews</h2>
        <StarRating value={summary.avg} count={summary.count} size={18} />
      </div>

      {eligible && (
        <form onSubmit={submit} className="mt-5 rounded-2xl bg-ink-soft p-4 ring-1 ring-ink-line">
          <p className="mb-2 text-sm font-semibold text-white">Rate your purchase</p>
          <StarRating value={rating} onChange={setRating} size={26} showCount={false} />
          <textarea
            className="input mt-3 min-h-[80px]"
            placeholder="Share what you loved (optional)…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
          <button type="submit" className="btn-primary mt-3" disabled={submitting}>
            {submitting ? 'Posting…' : 'Post review'}
          </button>
        </form>
      )}

      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-sm text-white/40">Loading reviews…</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-white/40">No reviews yet — be the first verified buyer to review.</p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="rounded-xl bg-ink-card p-4 ring-1 ring-ink-line">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-gradient text-xs font-bold text-white">
                    {r.buyerName?.[0]?.toUpperCase() || 'U'}
                  </span>
                  <span className="text-sm font-semibold text-white">{r.buyerName}</span>
                  <span className="pill bg-emerald-500/15 text-[10px] text-emerald-300">Verified buyer</span>
                </div>
                <span className="text-xs text-white/35">{timeAgo(r.createdAt)}</span>
              </div>
              <div className="mt-2">
                <StarRating value={r.rating} size={14} showCount={false} />
              </div>
              {r.text && <p className="mt-2 text-sm text-white/70">{r.text}</p>}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
