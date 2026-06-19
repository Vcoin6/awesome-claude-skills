'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCart, updateQty, removeFromCart } from '@/lib/cart';
import { formatMoney } from '@/lib/format';

export default function CartPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const sync = () => setItems(getCart());
    sync();
    window.addEventListener('merchly:cart', sync);
    return () => window.removeEventListener('merchly:cart', sync);
  }, []);

  const subtotal = items.reduce((s, i) => s + i.priceCents * i.qty, 0);

  if (items.length === 0) {
    return (
      <div className="mx-auto grid min-h-[60vh] max-w-md place-items-center px-6 text-center">
        <div>
          <h1 className="font-display text-2xl font-700 text-white">Your cart is empty</h1>
          <p className="mt-2 text-white/50">Find something worth dropping into it.</p>
          <Link href="/marketplace" className="btn-primary mt-6">Browse merch</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-display text-3xl font-700 text-white">Your cart</h1>
      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {items.map((i) => (
            <div key={i.id} className="card flex items-center gap-4 p-3">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-ink-soft">
                {i.cover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={i.cover} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/product/${i.id}`} className="line-clamp-1 font-semibold text-white hover:text-brand-fuchsia">{i.title}</Link>
                <p className="text-xs text-white/45">by {i.sellerName}</p>
                <div className="mt-2 inline-flex items-center rounded-lg ring-1 ring-ink-line">
                  <button onClick={() => updateQty(i.id, i.qty - 1)} className="px-3 py-1 text-white/60 hover:text-white">−</button>
                  <span className="w-8 text-center text-sm text-white">{i.qty}</span>
                  <button onClick={() => updateQty(i.id, i.qty + 1)} className="px-3 py-1 text-white/60 hover:text-white">+</button>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-white">{formatMoney(i.priceCents * i.qty)}</div>
                <button onClick={() => removeFromCart(i.id)} className="mt-2 text-xs text-white/40 hover:text-red-300">Remove</button>
              </div>
            </div>
          ))}
        </div>

        <div className="card h-fit p-5">
          <h2 className="font-display text-lg font-700 text-white">Summary</h2>
          <div className="mt-4 flex items-center justify-between border-b border-ink-line pb-3 text-sm">
            <span className="text-white/55">Subtotal</span>
            <span className="font-semibold text-white">{formatMoney(subtotal)}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-white/55">Shipping</span>
            <span className="text-white/70">Set by seller</span>
          </div>
          <Link href="/checkout" className="btn-primary mt-6 w-full py-4">Checkout</Link>
          <p className="mt-3 text-center text-xs text-white/35">Secure payment · Sellers paid 95% instantly</p>
        </div>
      </div>
    </div>
  );
}
