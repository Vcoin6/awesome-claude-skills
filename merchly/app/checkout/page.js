'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCart, clearCart } from '@/lib/cart';
import { formatMoney } from '@/lib/format';
import StripePayment from '@/components/StripePayment';

export default function CheckoutPage() {
  const [items, setItems] = useState([]);
  const [buyer, setBuyer] = useState({ name: '', email: '' });
  const [shipping, setShipping] = useState({ address: '', city: '', zip: '', country: '' });
  const [card, setCard] = useState({ number: '', exp: '', cvc: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  // When Stripe is configured the API returns a clientSecret to confirm.
  const [stripeIntent, setStripeIntent] = useState(null);
  // Promo code state.
  const [codeInput, setCodeInput] = useState('');
  const [promo, setPromo] = useState(null); // { code, discount, label }
  const [promoMsg, setPromoMsg] = useState('');

  useEffect(() => {
    setItems(getCart());
  }, []);

  const subtotal = items.reduce((s, i) => s + i.priceCents * i.qty, 0);
  const discount = promo?.discount || 0;
  const total = Math.max(0, subtotal - discount);
  const fee = Math.round(total * 0.05);
  const sellerNet = total - fee;

  async function applyCode() {
    setPromoMsg('');
    if (!codeInput.trim()) return;
    const res = await fetch('/api/promos/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: codeInput, items: items.map((i) => ({ id: i.id, qty: i.qty })) }),
    });
    const data = await res.json();
    if (!data.ok) {
      setPromo(null);
      setPromoMsg(data.error || 'Invalid code.');
    } else {
      setPromo(data);
      setPromoMsg('');
    }
  }

  // Step 1: create the order(s) + payment intent on the server.
  async function startCheckout(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const hasAddress = shipping.address.trim().length > 0;
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map((i) => ({ id: i.id, qty: i.qty })),
        buyer,
        code: promo?.code || codeInput || null,
        shipping: hasAddress ? { ...shipping, name: buyer.name } : null,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error || 'Checkout failed.');

    if (data.mode === 'stripe' && data.clientSecret) {
      // Hand off to the Stripe Payment Element for real card capture.
      setStripeIntent({ clientSecret: data.clientSecret, publishableKey: data.publishableKey, summary: data.summary });
    } else {
      // Simulation: payment already succeeded server-side.
      clearCart();
      setResult(data);
    }
  }

  function onStripeSuccess() {
    clearCart();
    setResult({
      mode: 'stripe',
      summary: stripeIntent.summary,
    });
  }

  // ── Success screen ──
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
              : 'Payment captured via Stripe. Each seller is automatically paid their 95%.'}
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
      <form onSubmit={startCheckout} className="mt-6 grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card p-5">
            <h2 className="mb-4 font-display text-lg font-700 text-white">Contact</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Full name</label>
                <input className="input" value={buyer.name} onChange={(e) => setBuyer((b) => ({ ...b, name: e.target.value }))} disabled={!!stripeIntent} required />
              </div>
              <div>
                <label className="label">Email (for receipt)</label>
                <input type="email" className="input" value={buyer.email} onChange={(e) => setBuyer((b) => ({ ...b, email: e.target.value }))} disabled={!!stripeIntent} required />
              </div>
            </div>

            <h3 className="mb-3 mt-5 text-sm font-semibold text-white/80">Shipping address</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label">Street address</label>
                <input className="input" value={shipping.address} onChange={(e) => setShipping((s) => ({ ...s, address: e.target.value }))} disabled={!!stripeIntent} placeholder="123 Main St" />
              </div>
              <div>
                <label className="label">City</label>
                <input className="input" value={shipping.city} onChange={(e) => setShipping((s) => ({ ...s, city: e.target.value }))} disabled={!!stripeIntent} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">ZIP</label>
                  <input className="input" value={shipping.zip} onChange={(e) => setShipping((s) => ({ ...s, zip: e.target.value }))} disabled={!!stripeIntent} />
                </div>
                <div>
                  <label className="label">Country</label>
                  <input className="input" value={shipping.country} onChange={(e) => setShipping((s) => ({ ...s, country: e.target.value }))} disabled={!!stripeIntent} />
                </div>
              </div>
            </div>
          </section>

          <section className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-700 text-white">Payment</h2>
              <span className="pill bg-white/5 text-white/50 ring-1 ring-white/10">
                {stripeIntent ? 'Stripe secure' : 'Demo / test mode'}
              </span>
            </div>

            {stripeIntent ? (
              <StripePayment
                clientSecret={stripeIntent.clientSecret}
                publishableKey={stripeIntent.publishableKey}
                amountCents={subtotal}
                onSuccess={onStripeSuccess}
              />
            ) : (
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
                  This demo simulates the 95/5 split. Add Stripe keys in <code className="text-white/50">.env.local</code> to capture real cards via Stripe Connect.
                </p>
              </div>
            )}
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
          {!stripeIntent && (
            <div className="mt-4 border-t border-ink-line pt-4">
              <label className="label">Discount code</label>
              <div className="flex gap-2">
                <input className="input uppercase" value={codeInput} onChange={(e) => setCodeInput(e.target.value)} placeholder="SUMMER20" />
                <button type="button" onClick={applyCode} className="btn-ghost px-4">Apply</button>
              </div>
              {promo && <p className="mt-2 text-xs text-emerald-300">Code {promo.code} applied — {promo.label} (−{formatMoney(promo.discount)})</p>}
              {promoMsg && <p className="mt-2 text-xs text-red-300">{promoMsg}</p>}
            </div>
          )}

          <div className="mt-5 space-y-2 border-t border-ink-line pt-4 text-sm">
            <Row label="Subtotal" value={formatMoney(subtotal)} />
            {discount > 0 && <Row label={`Discount (${promo.code})`} value={`−${formatMoney(discount)}`} />}
            <Row label="Total" value={formatMoney(total)} />
            <Row label="To seller (95%)" value={formatMoney(sellerNet)} muted />
            <Row label="Merchly fee (5%)" value={formatMoney(fee)} muted />
          </div>
          {error && <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
          {!stripeIntent && (
            <button type="submit" className="btn-primary mt-5 w-full py-4" disabled={loading}>
              {loading ? 'Processing…' : `Pay ${formatMoney(total)}`}
            </button>
          )}
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
