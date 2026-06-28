'use client';

import { useState } from 'react';
import { enablePush } from '@/lib/push';

export default function EnablePushButton() {
  const [state, setState] = useState('idle');

  async function onClick() {
    setState('working');
    const res = await enablePush();
    setState(res.ok ? 'on' : 'failed');
  }

  if (state === 'on') return <span className="pill bg-emerald-500/15 text-emerald-300">Push on</span>;

  return (
    <button onClick={onClick} disabled={state === 'working'} className="btn-ghost py-2 text-sm">
      {state === 'working' ? 'Enabling…' : state === 'failed' ? 'Try again' : 'Enable push'}
    </button>
  );
}
