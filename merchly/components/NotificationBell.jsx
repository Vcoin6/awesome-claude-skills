'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { timeAgo } from '@/lib/format';
import { ensurePushSubscribed } from '@/lib/push';

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  async function load() {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      setItems(data.notifications || []);
      setUnread(data.unread || 0);
    } catch {}
  }

  useEffect(() => {
    load();
    ensurePushSubscribed().catch(() => {});
    const t = setInterval(load, 30000); // light polling
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  async function openPanel() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      await fetch('/api/notifications/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      setUnread(0);
    }
  }

  function go(n) {
    setOpen(false);
    if (n.url) router.push(n.url);
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={openPanel} className="relative grid h-10 w-10 place-items-center rounded-xl bg-white/5 ring-1 ring-white/10 hover:bg-white/10" aria-label="Notifications">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand-fuchsia px-1 text-[11px] font-bold text-white">{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl bg-ink-card shadow-glow ring-1 ring-ink-line">
          <div className="border-b border-ink-line px-4 py-3 text-sm font-semibold text-white">Notifications</div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-white/40">You’re all caught up.</p>
            ) : (
              items.map((n) => (
                <button key={n.id} onClick={() => go(n)} className={`block w-full border-b border-ink-line px-4 py-3 text-left hover:bg-white/5 ${n.read ? '' : 'bg-brand-violet/5'}`}>
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-fuchsia" />}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">{n.title}</p>
                      {n.body && <p className="line-clamp-2 text-xs text-white/55">{n.body}</p>}
                      <p className="mt-0.5 text-[11px] text-white/35">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
