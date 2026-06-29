import Link from 'next/link';
import { redirect } from 'next/navigation';
import { readDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { formatMoney, timeAgo } from '@/lib/format';
import ShipControls from '@/components/ShipControls';

export const dynamic = 'force-dynamic';

export default async function SellerOrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'seller') redirect('/marketplace');

  const db = await readDB();
  const orders = db.orders
    .filter((o) => o.sellerId === user.id && o.status === 'paid')
    .sort((a, b) => {
      // Unfulfilled first, then newest.
      const fa = (a.fulfillment?.status || 'unfulfilled') === 'unfulfilled' ? 0 : 1;
      const fb = (b.fulfillment?.status || 'unfulfilled') === 'unfulfilled' ? 0 : 1;
      return fa - fb || new Date(b.createdAt) - new Date(a.createdAt);
    });

  const toShip = orders.filter((o) => (o.fulfillment?.status || 'unfulfilled') === 'unfulfilled').length;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/dashboard" className="text-sm text-brand-fuchsia hover:text-white">← Dashboard</Link>
      <h1 className="mt-1 font-display text-3xl font-700 text-white">Orders to fulfill</h1>
      <p className="mb-8 text-sm text-white/50">
        {toShip > 0 ? `${toShip} order${toShip > 1 ? 's' : ''} awaiting shipment.` : 'You’re all caught up — nothing to ship.'}
      </p>

      {orders.length === 0 ? (
        <div className="card grid place-items-center px-6 py-16 text-center text-white/50">No paid orders yet.</div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">#{o.id.slice(-6).toUpperCase()} · {formatMoney(o.sellerNet)} net</p>
                  <p className="text-xs text-white/45">{o.buyerName} · {timeAgo(o.createdAt)}</p>
                </div>
                <ShipControls orderId={o.id} fulfillment={o.fulfillment} />
              </div>
              <p className="mt-2 text-sm text-white/70">{o.items.map((i) => `${i.qty}× ${i.title}`).join(', ')}</p>
              {o.shipping?.address && (
                <p className="mt-1 text-xs text-white/45">
                  Ship to: {o.shipping.name}, {o.shipping.address}, {o.shipping.city} {o.shipping.zip} {o.shipping.country}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
