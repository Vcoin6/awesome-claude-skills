'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCart, clearCart } from '@/lib/cart';
import { formatMoney } from '@/lib/format';

export default function CheckoutPage() {
  const [items, setItems] = useState([]);
  const [buyer, setBuyer] = useState({ name: '', email: '' });
  const [card, setCard] = useState({ number: '', exp: '', cvc: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    setItems(getCart());
  }, []);

  const subtotal = items.reduce((s, i) => s + i.priceCents * i.qty, 0);
  const fee = Math.round(subtotal * 0.05);
  const sellerNet = subtotal - fee;

  async function pay(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items.map((i) => ({ id: i.id, qty: i.qty })), buyer }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error || 'Payment failed.');
    clearCart();
    setResult(data);
  }

  if (result) {
    return (
      <div className="mx-auto grid min-h-[70vh] max-w-lg place-items-center px-6 text-center">
        <div className="card w-full p-8">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/15 text-emerald-300">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="M5 12.5 10 17l9-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <h1 className="mt-5 font-display text-2xl font-700 text-white">Order confirmed 🎉</h1>
          <p className="mt-2 text-sm text-white/55">
            {result.mode === 'simulation'
              ? 'Demo payment processed. Sellers were credited their 95% and Merchly kept its 5%.'
              : 'Payment processed via Stripe. Sellers receive 95% automatically.'}
          </p>
          <div className="mt-5 space-y-2 rounded-xl bg-ink-soft p-4 text-left text-sm">
            <Row label="Total paid" value={formatMoney(result.summary.amount)} />
            <Row label="To sellers (95%)" value={formatMoney(result.summary.sellerNet)} />
            <Row label="Merchly fee (5%)" value={formatMoney(result.summary.platformFee)} />
          </div>
          <Link href="/marketplace" className="btn-primary mt-6 w-full py-4">Keep shopping</Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto grid min-h-[60vh] max-w-md place-items-center px-6 text-center">
        <div>
          <h1 className="font-display text-2xl font-700 text-white">Nothing to check out</h1>
          <Link href="/marketplace" className="btn-primary mt-6">Browse merch</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-display text-3xl font-700 text-white">Checkout</h1>
      <form onSubmit={pay} className="mt-6 grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card p-5">
            <h2 className="mb-4 font-display text-lg font-700 text-white">Contact</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Full name</label>
                <input className="input" value={buyer.name} onChange={(e) => setBuyer((b) => ({ ...b, name: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Email (for receipt)</label>
                <input type="email" className="input" value={buyer.email} onChange={(e) => setBuyer((b) => ({ ...b, email: e.target.value }))} required />
              </div>
            </div>
          </section>

          <section className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-700 text-white">Payment</h2>
              <span className="pill bg-white/5 text-white/50 ring-1 ring-white/10">Demo / test mode</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Card number</label>
                <input className="input" value={card.number} onChange={(e) => setCard((c) => ({ ...c, number: e.target.value }))} placeholder="4242 4242 4242 4242" inputMode="numeric" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Expiry</label>
                  <input className="input" value={card.exp} onChange={(e) => setCard((c) => ({ ...c, exp: e.target.value }))} placeholder="MM/YY" />
                </div>
                <div>
                  <label className="label">CVC</label>
                  <input className="input" value={card.cvc} onChange={(e) => setCard((c) => ({ ...c, cvc: e.target.value }))} placeholder="123" />
                </div>
              </div>
              <p className="text-xs text-white/35">
                This demo simulates the payment split. Add Stripe keys in <code className="text-white/50">.env.local</code> to move real money via Stripe Connect.
              </p>
            </div>
          </section>
        </div>

        <div className="card h-fit p-5">
          <h2 className="font-display text-lg font-700 text-white">Order</h2>
          <div className="mt-4 space-y-3">
            {items.map((i) => (
              <div key={i.id} className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-ink-soft">
                  {i.cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={i.cover} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm text-white">{i.title}</p>
                  <p className="text-xs text-white/40">Qty {i.qty}</p>
                </div>
                <span className="text-sm text-white/80">{formatMoney(i.priceCents * i.qty)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-2 border-t border-ink-line pt-4 text-sm">
            <Row label="Subtotal" value={formatMoney(subtotal)} />
            <Row label="To seller (95%)" value={formatMoney(sellerNet)} muted />
            <Row label="Merchly fee (5%)" value={formatMoney(fee)} muted />
          </div>
          {error && <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
          <button type="submit" className="btn-primary mt-5 w-full py-4" disabled={loading}>
            {loading ? 'Processing…' : `Pay ${formatMoney(subtotal)}`}
          </button>
        </div>
      </form>
    </div>
  );
}

function Row({ label, value, muted }) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? 'text-white/45' : 'text-white/70'}>{label}</span>
      <span className={muted ? 'text-white/60' : 'font-semibold text-white'}>{value}</span>
    </div>
  );
}
