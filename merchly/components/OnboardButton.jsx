'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function OnboardButton({ enabled }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onboard() {
    setBusy(true);
    const res = await fetch('/api/seller/onboard', { method: 'POST' });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url; // Stripe-hosted onboarding
      return;
    }
    setBusy(false);
    router.refresh(); // simulation: payouts now enabled
  }

  if (enabled) {
    return (
      <span className="pill bg-emerald-500/15 text-emerald-300">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12.5 10 17l9-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        Payouts active
      </span>
    );
  }

  return (
    <button onClick={onboard} disabled={busy} className="btn-ghost py-2 text-sm">
      {busy ? 'Connecting…' : 'Enable payouts'}
    </button>
  );
}
