import Link from 'next/link';
import { redirect } from 'next/navigation';
import { readDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { canUserReview } from '@/lib/reviews';
import { formatMoney, timeAgo } from '@/lib/format';
import { RequestRefund } from '@/components/RefundControls';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const db = await readDB();
  const orders = db.orders
    .filter((o) => o.buyerId === user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-display text-3xl font-700 text-white">Your orders</h1>
      <p className="text-sm text-white/50">Track your purchases and review what you’ve bought.</p>

      {orders.length === 0 ? (
        <div className="card mt-8 grid place-items-center gap-3 px-6 py-16 text-center">
          <p className="text-white/60">You haven’t bought anything yet.</p>
          <Link href="/marketplace" className="btn-primary">Browse the marketplace</Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="card p-5">
              <div className="flex items-center justify-between border-b border-ink-line pb-3">
                <div>
                  <p className="text-sm font-semibold text-white">Order #{o.id.slice(-6).toUpperCase()}</p>
                  <p className="text-xs text-white/45">
                    {timeAgo(o.createdAt)} · sold by{' '}
                    <Link href={`/seller/${o.sellerId}`} className="text-brand-fuchsia hover:text-white">{o.sellerName}</Link>
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display font-700 text-white">{formatMoney(o.amount)}</p>
                  <div className="mt-1 flex items-center justify-end gap-1.5">
                    <span className={`pill ${o.status === 'paid' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-brand-amber/15 text-brand-amber'}`}>
                      {o.status}
                    </span>
                    {o.fulfillment?.status && o.fulfillment.status !== 'unfulfilled' && (
                      <span className={`pill ${o.fulfillment.status === 'delivered' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-blue-500/15 text-blue-300'}`}>
                        {o.fulfillment.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {o.fulfillment?.status && o.fulfillment.status !== 'unfulfilled' && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-ink-soft px-3 py-2 text-xs text-white/60 ring-1 ring-ink-line">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><circle cx="7" cy="17" r="1.6" stroke="currentColor" strokeWidth="1.6" /><circle cx="17" cy="17" r="1.6" stroke="currentColor" strokeWidth="1.6" /></svg>
                  {o.fulfillment.carrier ? `${o.fulfillment.carrier.toUpperCase()} · ` : ''}
                  {o.fulfillment.tracking || 'In transit'}
                  {o.fulfillment.trackingUrl && (
                    <a href={o.fulfillment.trackingUrl} target="_blank" rel="noreferrer" className="ml-auto font-semibold text-brand-fuchsia hover:text-white">Track →</a>
                  )}
                </div>
              )}

              <div className="mt-3 space-y-2">
                {o.items.map((i) => {
                  const reviewable =
                    o.status === 'paid' &&
                    canUserReview({ reviews: db.reviews, orders: db.orders, userId: user.id, listingId: i.listingId });
                  return (
                    <div key={i.listingId} className="flex items-center justify-between gap-3">
                      <Link href={`/product/${i.listingId}`} className="line-clamp-1 text-sm text-white/80 hover:text-white">
                        {i.qty}× {i.title}
                      </Link>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-sm text-white/60">{formatMoney(i.priceCents * i.qty)}</span>
                        {reviewable && (
                          <Link href={`/product/${i.listingId}`} className="pill bg-brand-violet/20 text-brand-fuchsia hover:bg-brand-violet/30">
                            ★ Review
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {(o.status === 'paid' || o.refund) && (
                <div className="mt-3 flex items-center justify-end border-t border-ink-line pt-3">
                  <RequestRefund orderId={o.id} refund={o.refund} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
