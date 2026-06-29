'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ListingAction({ id, removed }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function act(action) {
    setBusy(true);
    await fetch(`/api/admin/listings/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
    router.refresh();
  }
  return removed ? (
    <button onClick={() => act('restore')} disabled={busy} className="text-xs font-semibold text-emerald-300 hover:text-white">Restore</button>
  ) : (
    <button onClick={() => act('remove')} disabled={busy} className="text-xs font-semibold text-red-300 hover:text-white">Remove</button>
  );
}

export function UserAction({ id, suspended }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function act(action) {
    if (action === 'suspend' && !confirm('Suspend this user? They will be unable to log in.')) return;
    setBusy(true);
    await fetch(`/api/admin/users/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
    router.refresh();
  }
  return suspended ? (
    <button onClick={() => act('unsuspend')} disabled={busy} className="text-xs font-semibold text-emerald-300 hover:text-white">Unsuspend</button>
  ) : (
    <button onClick={() => act('suspend')} disabled={busy} className="text-xs font-semibold text-red-300 hover:text-white">Suspend</button>
  );
}

export function ReviewAction({ id }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function del() {
    if (!confirm('Delete this review permanently?')) return;
    setBusy(true);
    await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
    router.refresh();
  }
  return <button onClick={del} disabled={busy} className="text-xs font-semibold text-red-300 hover:text-white">Delete</button>;
}
