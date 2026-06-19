'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DeleteListing({ id }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm('Remove this listing? Buyers will no longer see it.')) return;
    setBusy(true);
    await fetch(`/api/listings/${id}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <button onClick={remove} disabled={busy} className="text-xs font-semibold text-white/40 hover:text-red-300">
      {busy ? '…' : 'Remove'}
    </button>
  );
}
