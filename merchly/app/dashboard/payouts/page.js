import Link from 'next/link';
import { redirect } from 'next/navigation';
import { readDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { formatMoney, timeAgo } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function PayoutsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'seller') redirect('/marketplace');

  const db = await readDB();
  const paid = db.orders
    .filter((o) => o.sellerId === user.id && o.status === 'paid')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalNet = paid.reduce((s, o) => s + o.sellerNet, 0);
  const totalGross = paid.reduce((s, o) => s + o.amount, 0);
  const totalFees = paid.reduce((s, o) => s + o.platformFee, 0);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-brand-fuchsia hover:text-white">← Dashboard</Link>
          <h1 className="mt-1 font-display text-3xl font-700 text-white">Payout history</h1>
        </div>
        {paid.length > 0 && (
          <a href="/api/seller/payouts?format=csv" className="btn-ghost py-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Export CSV
          </a>
        )}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <Stat label="Net earned (95%)" value={formatMoney(totalNet)} accent />
        <Stat label="Gross sales" value={formatMoney(totalGross)} />
        <Stat label="Merchly fees (5%)" value={formatMoney(totalFees)} />
      </div>

      {paid.length === 0 ? (
        <div className="card mt-8 grid place-items-center px-6 py-16 text-center text-white/50">
          No payouts yet. Your earnings will appear here after your first sale.
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl ring-1 ring-ink-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-soft text-white/50">
              <tr>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Items</th>
                <th className="px-4 py-3 text-right font-semibold">Net</th>
                <th className="px-4 py-3 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {paid.map((o) => (
                <tr key={o.id} className="border-t border-ink-line">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">#{o.id.slice(-6).toUpperCase()}</div>
                    <div className="text-xs text-white/40">{timeAgo(o.createdAt)}</div>
                  </td>
                  <td className="px-4 py-3 text-white/70">
                    <span className="line-clamp-1">{o.items.map((i) => `${i.qty}× ${i.title}`).join(', ')}</span>
                    <span className="text-xs text-white/35">{o.buyerName}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-white">{formatMoney(o.sellerNet)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`pill ${o.paidOut ? 'bg-emerald-500/15 text-emerald-300' : 'bg-brand-amber/15 text-brand-amber'}`}>
                      {o.paidOut ? 'paid out' : 'pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
