'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function RequestRefund({ orderId, refund }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  if (refund && refund.status !== 'rejected') {
    const map = {
      requested: ['bg-brand-amber/15 text-brand-amber', 'Refund requested'],
      refunded: ['bg-emerald-500/15 text-emerald-300', 'Refunded'],
    };
    const [cls, label] = map[refund.status] || ['bg-white/10 text-white/50', refund.status];
    return <span className={`pill ${cls}`}>{label}</span>;
  }

  async function submit() {
    setBusy(true);
    await fetch(`/api/orders/${orderId}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    setBusy(false);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs font-semibold text-white/40 hover:text-red-300">
        {refund?.status === 'rejected' ? 'Request again' : 'Request refund'}
      </button>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-2 rounded-xl bg-ink-soft p-3 ring-1 ring-ink-line">
      <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" className="input py-2 text-sm" />
      <div className="flex gap-2">
        <button onClick={submit} disabled={busy} className="btn-primary py-2 text-sm">Submit request</button>
        <button onClick={() => setOpen(false)} className="text-xs text-white/40">Cancel</button>
      </div>
    </div>
  );
}

export function ResolveRefund({ orderId }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function act(action) {
    if (action === 'approve' && !confirm('Approve refund? The buyer will be refunded and items restocked.')) return;
    setBusy(true);
    await fetch(`/api/orders/${orderId}/refund/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    router.refresh();
  }
  return (
    <div className="flex gap-2">
      <button onClick={() => act('approve')} disabled={busy} className="btn-primary py-1.5 text-xs">Approve refund</button>
      <button onClick={() => act('reject')} disabled={busy} className="btn-ghost py-1.5 text-xs">Reject</button>
    </div>
  );
}
