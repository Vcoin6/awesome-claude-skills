'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MediaUploader from './MediaUploader';

const CATEGORIES = ['apparel', 'accessories', 'art', 'music', 'digital', 'collectibles', 'other'];

export default function ListingComposer() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', price: '', category: 'apparel', stock: '25', tags: '' });
  const [media, setMedia] = useState([]);
  const [variants, setVariants] = useState([]); // [{ label, stock }]
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }
  function addVariant() { setVariants((v) => [...v, { label: '', stock: '10' }]); }
  function setVariant(i, k, val) { setVariants((vs) => vs.map((v, idx) => (idx === i ? { ...v, [k]: val } : v))); }
  function removeVariant(i) { setVariants((vs) => vs.filter((_, idx) => idx !== i)); }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (media.length === 0) return setError('Add at least one photo or video.');
    const cleanVariants = variants
      .map((v) => ({ label: v.label.trim(), stock: Number(v.stock) || 0 }))
      .filter((v) => v.label);
    setLoading(true);
    const res = await fetch('/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        tags: form.tags.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean),
        variants: cleanVariants,
        media,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error || 'Could not publish.');
    setForm({ title: '', description: '', price: '', category: 'apparel', stock: '25', tags: '' });
    setMedia([]);
    setVariants([]);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        New listing
      </button>
    );
  }

  return (
    <div className="card p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="font-display text-xl font-700 text-white">Drop new merch</h3>
        <button onClick={() => setOpen(false)} className="text-sm text-white/40 hover:text-white">Cancel</button>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="label">Photos & video</label>
          <MediaUploader media={media} setMedia={setMedia} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Title</label>
            <input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Limited Edition Tour Hoodie" required />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <textarea className="input min-h-[90px]" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Materials, sizing, drop story…" />
          </div>
          <div>
            <label className="label">Price (USD)</label>
            <input type="number" min="0.5" step="0.01" className="input" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="40.00" required />
          </div>
          <div>
            <label className="label">Stock {variants.length > 0 && <span className="text-white/30">(from variants)</span>}</label>
            <input type="number" min="0" step="1" className="input disabled:opacity-40" value={variants.length > 0 ? variants.reduce((s, v) => s + (Number(v.stock) || 0), 0) : form.stock} onChange={(e) => set('stock', e.target.value)} disabled={variants.length > 0} placeholder="25" />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Tags (comma separated)</label>
            <input className="input" value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="streetwear, limited, y2k" />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="label mb-0">Variants — sizes, colors (optional)</label>
            <button type="button" onClick={addVariant} className="text-xs font-semibold text-brand-fuchsia hover:text-white">+ Add variant</button>
          </div>
          {variants.length === 0 ? (
            <p className="text-xs text-white/35">No variants — the single stock value applies. Add variants for sizes/colors with their own stock.</p>
          ) : (
            <div className="space-y-2">
              {variants.map((v, i) => (
                <div key={i} className="flex gap-2">
                  <input className="input flex-1" value={v.label} onChange={(e) => setVariant(i, 'label', e.target.value)} placeholder="e.g. Medium / Black" />
                  <input type="number" min="0" className="input w-24" value={v.stock} onChange={(e) => setVariant(i, 'stock', e.target.value)} placeholder="Stock" />
                  <button type="button" onClick={() => removeVariant(i)} className="px-2 text-white/40 hover:text-red-300">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {form.price && (
          <div className="rounded-xl bg-ink-soft p-3 text-sm text-white/60 ring-1 ring-ink-line">
            You’ll earn <span className="font-semibold text-white">${(Number(form.price) * 0.95).toFixed(2)}</span> per sale ·
            Merchly fee <span className="text-white/70">${(Number(form.price) * 0.05).toFixed(2)}</span> (5%)
          </div>
        )}

        {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-500/20">{error}</p>}

        <button type="submit" className="btn-primary w-full py-4" disabled={loading}>
          {loading ? 'Publishing…' : 'Publish listing'}
        </button>
      </form>
    </div>
  );
}
