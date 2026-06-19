'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error || 'Something went wrong.');
    router.push(data.user.role === 'seller' ? '/dashboard' : '/marketplace');
    router.refresh();
  }

  return (
    <div className="relative mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6 py-12">
      <div className="absolute inset-0 bg-brand-radial" />
      <div className="relative">
        <h1 className="font-display text-3xl font-700 text-white">Welcome back</h1>
        <p className="mt-2 text-sm text-white/55">Log in to manage your store and orders.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="you@example.com" required />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" className="input" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Your password" required />
          </div>

          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-500/20">{error}</p>}

          <button type="submit" className="btn-primary w-full py-4" disabled={loading}>
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/50">
          New to Merchly?{' '}
          <Link href="/register" className="font-semibold text-brand-fuchsia hover:text-white">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
