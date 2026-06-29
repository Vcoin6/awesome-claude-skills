'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CARRIERS = [
  ['usps', 'USPS'],
  ['ups', 'UPS'],
  ['fedex', 'FedEx'],
  ['dhl', 'DHL'],
  ['other', 'Other'],
];

export default function ShipControls({ orderId, fulfillment }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [carrier, setCarrier] = useState(fulfillment?.carrier || 'usps');
  const [tracking, setTracking] = useState(fulfillment?.tracking || '');
  const [busy, setBusy] = useState(false);

  const status = fulfillment?.status || 'unfulfilled';

  async function submit(status) {
    setBusy(true);
    await fetch(`/api/orders/${orderId}/ship`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ carrier, tracking, status }),
    });
    setBusy(false);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <div className="flex items-center gap-2">
        <StatusPill status={status} />
        <button onClick={() => setOpen(true)} className="text-xs font-semibold text-brand-fuchsia hover:text-white">
          {status === 'unfulfilled' ? 'Mark shipped' : 'Update'}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-2 rounded-xl bg-ink-soft p-3 ring-1 ring-ink-line sm:flex-row sm:items-center">
      <select value={carrier} onChange={(e) => setCarrier(e.target.value)} className="input w-auto py-2 text-sm">
        {CARRIERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Tracking #" className="input flex-1 py-2 text-sm" />
      <button onClick={() => submit('shipped')} disabled={busy} className="btn-primary py-2 text-sm">Shipped</button>
      <button onClick={() => submit('delivered')} disabled={busy} className="btn-ghost py-2 text-sm">Delivered</button>
      <button onClick={() => setOpen(false)} className="text-xs text-white/40">Cancel</button>
    </div>
  );
}

export function StatusPill({ status }) {
  const map = {
    unfulfilled: ['bg-brand-amber/15 text-brand-amber', 'Unfulfilled'],
    shipped: ['bg-blue-500/15 text-blue-300', 'Shipped'],
    delivered: ['bg-emerald-500/15 text-emerald-300', 'Delivered'],
  };
  const [cls, label] = map[status] || map.unfulfilled;
  return <span className={`pill ${cls}`}>{label}</span>;
}
