import Link from 'next/link';
import { redirect } from 'next/navigation';
import { readDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { formatMoney } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'seller') redirect('/marketplace');

  const db = await readDB();
  const listings = db.listings.filter((l) => l.sellerId === user.id && l.status !== 'removed');
  const paid = db.orders.filter((o) => o.sellerId === user.id && o.status === 'paid');

  const net = paid.reduce((s, o) => s + o.sellerNet, 0);
  const gross = paid.reduce((s, o) => s + o.amount, 0);
  const units = paid.reduce((s, o) => s + o.items.reduce((n, i) => n + i.qty, 0), 0);
  const aov = paid.length ? Math.round(gross / paid.length) : 0;
  const totalViews = listings.reduce((s, l) => s + (l.views || 0), 0);
  const conversion = totalViews ? (units / totalViews) * 100 : 0;
  const uniqueBuyers = new Set(paid.map((o) => o.buyerId || o.buyerEmail)).size;
  const repeat = uniqueBuyers ? ((paid.length - uniqueBuyers) / paid.length) * 100 : 0;

  // Revenue over the last 14 days (net), bucketed by day.
  const days = 14;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buckets = Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    return { date: d, cents: 0 };
  });
  for (const o of paid) {
    const od = new Date(o.createdAt);
    od.setHours(0, 0, 0, 0);
    const idx = buckets.findIndex((b) => b.date.getTime() === od.getTime());
    if (idx >= 0) buckets[idx].cents += o.sellerNet;
  }
  const maxCents = Math.max(1, ...buckets.map((b) => b.cents));

  // Top products by revenue.
  const byProduct = new Map();
  for (const o of paid) {
    for (const i of o.items) {
      const cur = byProduct.get(i.listingId) || { title: i.title, units: 0, cents: 0 };
      cur.units += i.qty;
      cur.cents += i.priceCents * i.qty;
      byProduct.set(i.listingId, cur);
    }
  }
  const topProducts = [...byProduct.entries()].sort((a, b) => b[1].cents - a[1].cents).slice(0, 5);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/dashboard" className="text-sm text-brand-fuchsia hover:text-white">← Dashboard</Link>
      <h1 className="mt-1 font-display text-3xl font-700 text-white">Analytics</h1>
      <p className="mb-8 text-sm text-white/50">Your store performance at a glance.</p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Net revenue" value={formatMoney(net)} accent />
        <Stat label="Orders" value={String(paid.length)} />
        <Stat label="Avg order value" value={formatMoney(aov)} />
        <Stat label="Units sold" value={String(units)} />
        <Stat label="Total views" value={String(totalViews)} />
        <Stat label="Conversion" value={`${conversion.toFixed(1)}%`} />
        <Stat label="Unique buyers" value={String(uniqueBuyers)} />
        <Stat label="Repeat rate" value={`${repeat.toFixed(0)}%`} />
      </div>

      <div className="card mt-8 p-5">
        <h2 className="font-display text-lg font-700 text-white">Net revenue · last {days} days</h2>
        <div className="mt-5 flex h-40 items-end gap-1.5">
          {buckets.map((b, i) => (
            <div key={i} className="group relative flex flex-1 flex-col items-center justify-end">
              <div
                className="w-full rounded-t bg-brand-gradient transition-all"
                style={{ height: `${Math.max(2, (b.cents / maxCents) * 140)}px` }}
                title={`${b.date.toLocaleDateString()} · ${formatMoney(b.cents)}`}
              />
              {(i % 2 === 0 || i === days - 1) && (
                <span className="mt-1 text-[9px] text-white/35">{b.date.getMonth() + 1}/{b.date.getDate()}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card mt-8 p-5">
        <h2 className="font-display text-lg font-700 text-white">Top products</h2>
        {topProducts.length === 0 ? (
          <p className="mt-3 text-sm text-white/45">No sales yet.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {topProducts.map(([id, p]) => (
              <div key={id} className="flex items-center justify-between border-b border-ink-line pb-2 text-sm">
                <Link href={`/product/${id}`} className="line-clamp-1 text-white/80 hover:text-white">{p.title}</Link>
                <span className="shrink-0 text-white/55">{p.units} sold · <span className="font-semibold text-white">{formatMoney(p.cents)}</span></span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-white/45">{label}</div>
      <div className={`mt-1 font-display text-xl font-700 ${accent ? 'gradient-text' : 'text-white'}`}>{value}</div>
    </div>
  );
}
