'use client';

import { useEffect, useState } from 'react';

export default function PromosManager() {
  const [promos, setPromos] = useState([]);
  const [form, setForm] = useState({ code: '', type: 'percent', value: '', maxUses: '', minSubtotal: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch('/api/promos');
    const data = await res.json();
    setPromos(data.promos || []);
  }
  useEffect(() => { load(); }, []);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function create(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = await fetch('/api/promos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: form.code,
        type: form.type,
        value: Number(form.value),
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        minSubtotal: form.minSubtotal ? Number(form.minSubtotal) : undefined,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error || 'Could not create code.');
    setForm({ code: '', type: 'percent', value: '', maxUses: '', minSubtotal: '' });
    load();
  }

  async function deactivate(id) {
    await fetch(`/api/promos/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form onSubmit={create} className="card h-fit p-5">
        <h2 className="font-display text-lg font-700 text-white">Create a code</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="label">Code</label>
            <input className="input uppercase" value={form.code} onChange={(e) => set('code', e.target.value)} placeholder="SUMMER20" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={(e) => set('type', e.target.value)}>
                <option value="percent">% off</option>
                <option value="fixed">$ off</option>
              </select>
            </div>
            <div>
              <label className="label">{form.type === 'percent' ? 'Percent' : 'Amount (USD)'}</label>
              <input type="number" min="1" className="input" value={form.value} onChange={(e) => set('value', e.target.value)} placeholder={form.type === 'percent' ? '20' : '10'} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Max uses (optional)</label>
              <input type="number" min="1" className="input" value={form.maxUses} onChange={(e) => set('maxUses', e.target.value)} placeholder="∞" />
            </div>
            <div>
              <label className="label">Min spend USD (optional)</label>
              <input type="number" min="0" className="input" value={form.minSubtotal} onChange={(e) => set('minSubtotal', e.target.value)} placeholder="0" />
            </div>
          </div>
          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
          <button type="submit" className="btn-primary w-full py-3" disabled={busy}>{busy ? 'Creating…' : 'Create code'}</button>
        </div>
      </form>

      <div>
        <h2 className="mb-4 font-display text-lg font-700 text-white">Your codes</h2>
        {promos.length === 0 ? (
          <div className="card grid place-items-center px-6 py-12 text-center text-sm text-white/45">No codes yet.</div>
        ) : (
          <div className="space-y-3">
            {promos.map((p) => (
              <div key={p.id} className={`card flex items-center justify-between p-4 ${p.active ? '' : 'opacity-50'}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-700 text-white">{p.code}</span>
                    <span className="pill bg-brand-violet/20 text-brand-fuchsia">
                      {p.type === 'percent' ? `${p.value}% off` : `$${p.value} off`}
                    </span>
                    {!p.active && <span className="pill bg-white/10 text-white/50">inactive</span>}
                  </div>
                  <p className="mt-1 text-xs text-white/45">
                    {p.uses} used{p.maxUses ? ` / ${p.maxUses}` : ''}{p.minSubtotal ? ` · min $${p.minSubtotal}` : ''}
                  </p>
                </div>
                {p.active && (
                  <button onClick={() => deactivate(p.id)} className="text-xs font-semibold text-white/40 hover:text-red-300">Deactivate</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
