'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState('seller');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, role }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error || 'Something went wrong.');
    router.push(role === 'seller' ? '/dashboard' : '/marketplace');
    router.refresh();
  }

  return (
    <div className="relative mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6 py-12">
      <div className="absolute inset-0 bg-brand-radial" />
      <div className="relative">
        <h1 className="font-display text-3xl font-700 text-white">Create your account</h1>
        <p className="mt-2 text-sm text-white/55">Join Merchly and start selling — or shopping — in seconds.</p>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-ink-soft p-1 ring-1 ring-ink-line">
          <RoleTab active={role === 'seller'} onClick={() => setRole('seller')} title="I'm selling" sub="List merch & get paid" />
          <RoleTab active={role === 'shopper'} onClick={() => setRole('shopper')} title="I'm shopping" sub="Buy creator merch" />
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label">{role === 'seller' ? 'Store / display name' : 'Your name'}</label>
            <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder={role === 'seller' ? 'e.g. Nova Prints' : 'e.g. Alex Rivera'} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" required />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" className="input" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="At least 6 characters" required />
          </div>

          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-500/20">{error}</p>}

          <button type="submit" className="btn-primary w-full py-4" disabled={loading}>
            {loading ? 'Creating…' : role === 'seller' ? 'Create my store' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/50">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-brand-fuchsia hover:text-white">Log in</Link>
        </p>
      </div>
    </div>
  );
}

function RoleTab({ active, onClick, title, sub }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-3 text-left transition ${active ? 'bg-brand-gradient text-white shadow-glow' : 'text-white/60 hover:bg-white/5'}`}
    >
      <div className="text-sm font-semibold">{title}</div>
      <div className={`text-xs ${active ? 'text-white/80' : 'text-white/40'}`}>{sub}</div>
    </button>
  );
}
