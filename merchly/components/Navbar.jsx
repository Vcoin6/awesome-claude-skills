'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from './Logo';
import { cartCount } from '@/lib/cart';

export default function Navbar({ user }) {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const update = () => setCount(cartCount());
    update();
    window.addEventListener('merchly:cart', update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener('merchly:cart', update);
      window.removeEventListener('storage', update);
    };
  }, []);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-ink-line/70 bg-ink/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/marketplace" className="text-sm text-white/70 hover:text-white">Marketplace</Link>
            <Link href="/#how" className="text-sm text-white/70 hover:text-white">How it works</Link>
            <Link href="/#pricing" className="text-sm text-white/70 hover:text-white">Pricing</Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/cart" className="relative grid h-10 w-10 place-items-center rounded-xl bg-white/5 ring-1 ring-white/10 hover:bg-white/10" aria-label="Cart">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 4h2l2.4 12.3a1 1 0 0 0 1 .7h8.7a1 1 0 0 0 1-.8L21 8H6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="20" r="1.4" fill="currentColor"/><circle cx="18" cy="20" r="1.4" fill="currentColor"/></svg>
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand-fuchsia px-1 text-[11px] font-bold text-white">{count}</span>
            )}
          </Link>

          {user ? (
            <div className="hidden items-center gap-2 sm:flex">
              {user.role === 'seller' && (
                <Link href="/dashboard" className="btn-ghost py-2">Dashboard</Link>
              )}
              <Link href={`/seller/${user.id}`} className="grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient text-sm font-bold text-white" title={user.name}>
                {user.name?.[0]?.toUpperCase() || 'U'}
              </Link>
              <button onClick={logout} className="text-sm text-white/50 hover:text-white">Sign out</button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/login" className="btn-ghost py-2">Log in</Link>
              <Link href="/register" className="btn-primary py-2">Start selling</Link>
            </div>
          )}

          <button onClick={() => setOpen((o) => !o)} className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 ring-1 ring-white/10 sm:hidden" aria-label="Menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-ink-line px-4 py-3 sm:hidden">
          <div className="flex flex-col gap-1">
            <Link href="/marketplace" className="rounded-lg px-3 py-2 text-white/80 hover:bg-white/5" onClick={() => setOpen(false)}>Marketplace</Link>
            {user?.role === 'seller' && <Link href="/dashboard" className="rounded-lg px-3 py-2 text-white/80 hover:bg-white/5" onClick={() => setOpen(false)}>Dashboard</Link>}
            {user ? (
              <button onClick={logout} className="rounded-lg px-3 py-2 text-left text-white/80 hover:bg-white/5">Sign out</button>
            ) : (
              <>
                <Link href="/login" className="rounded-lg px-3 py-2 text-white/80 hover:bg-white/5" onClick={() => setOpen(false)}>Log in</Link>
                <Link href="/register" className="btn-primary mt-1" onClick={() => setOpen(false)}>Start selling</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
