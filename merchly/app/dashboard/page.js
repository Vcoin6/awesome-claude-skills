import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { readDB } from '@/lib/db';
import { formatMoney, timeAgo } from '@/lib/format';
import ListingComposer from '@/components/ListingComposer';
import DeleteListing from '@/components/DeleteListing';
import OnboardButton from '@/components/OnboardButton';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'seller') redirect('/marketplace');

  const db = await readDB();
  const listings = db.listings
    .filter((l) => l.sellerId === user.id && l.status !== 'removed')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const orders = db.orders
    .filter((o) => o.sellerId === user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const grossCents = orders.reduce((s, o) => s + o.amount, 0);
  const netCents = orders.reduce((s, o) => s + o.sellerNet, 0);
  const feeCents = orders.reduce((s, o) => s + o.platformFee, 0);
  const unitsSold = orders.reduce((s, o) => s + o.items.reduce((n, i) => n + i.qty, 0), 0);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-700 text-white">Seller dashboard</h1>
          <p className="text-sm text-white/50">
            Welcome back, {user.name} · <Link href={`/seller/${user.id}`} className="text-brand-fuchsia hover:text-white">View public store →</Link>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <OnboardButton enabled={user.payoutsEnabled} />
          <ListingComposer />
        </div>
      </div>

      {!user.payoutsEnabled && (
        <div className="mt-6 rounded-2xl bg-brand-amber/10 px-5 py-4 text-sm text-brand-amber ring-1 ring-brand-amber/20">
          Turn on payouts to start receiving your 95% on every sale. Click <strong>Enable payouts</strong> above.
        </div>
      )}

      {/* Earnings */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Net earnings (95%)" value={formatMoney(netCents)} accent />
        <StatCard label="Gross sales" value={formatMoney(grossCents)} />
        <StatCard label="Merchly fees (5%)" value={formatMoney(feeCents)} />
        <StatCard label="Units sold" value={String(unitsSold)} />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        {/* Listings */}
        <section className="lg:col-span-2">
          <h2 className="mb-4 font-display text-xl font-700 text-white">Your listings ({listings.length})</h2>
          {listings.length === 0 ? (
            <div className="card grid place-items-center gap-3 px-6 py-14 text-center text-white/50">
              <p>No listings yet. Hit <strong className="text-white">New listing</strong> to drop your first merch.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {listings.map((l) => {
                const cover = l.media?.[0];
                return (
                  <div key={l.id} className="card flex items-center gap-4 p-3">
                    <Link href={`/product/${l.id}`} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-ink-soft">
                      {cover ? (
                        cover.type === 'video' ? (
                          <video src={cover.url} muted className="h-full w-full object-cover" />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cover.url} alt="" className="h-full w-full object-cover" />
                        )
                      ) : null}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link href={`/product/${l.id}`} className="line-clamp-1 font-semibold text-white hover:text-brand-fuchsia">{l.title}</Link>
                      <p className="text-xs text-white/45">
                        {formatMoney(l.priceCents)} · {l.stock} in stock · {l.views || 0} views · {timeAgo(l.createdAt)}
                      </p>
                    </div>
                    <DeleteListing id={l.id} />
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent orders */}
        <section>
          <h2 className="mb-4 font-display text-xl font-700 text-white">Recent sales</h2>
          {orders.length === 0 ? (
            <div className="card grid place-items-center px-6 py-14 text-center text-sm text-white/45">
              Sales will appear here the moment a buyer checks out.
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 8).map((o) => (
                <div key={o.id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{formatMoney(o.sellerNet)}</span>
                    <span className="pill bg-emerald-500/15 text-emerald-300">{o.status}</span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-white/45">
                    {o.items.map((i) => `${i.qty}× ${i.title}`).join(', ')}
                  </p>
                  <p className="mt-1 text-xs text-white/35">{o.buyerName} · {timeAgo(o.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="card p-5">
      <div className="text-xs uppercase tracking-wide text-white/45">{label}</div>
      <div className={`mt-1 font-display text-2xl font-700 ${accent ? 'gradient-text' : 'text-white'}`}>{value}</div>
    </div>
  );
}
