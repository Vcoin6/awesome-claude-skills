'use client';

import { useRef, useState } from 'react';

export default function MediaUploader({ media, setMedia }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    setError('');
    setUploading(true);
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setMedia((m) => [...m, ...data.media].slice(0, 10));
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  function remove(i) {
    setMedia((m) => m.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`grid cursor-pointer place-items-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${drag ? 'border-brand-violet bg-brand-violet/5' : 'border-ink-line hover:border-white/25'}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-gradient text-white">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 16V4m0 0 4 4m-4-4-4 4M5 20h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <p className="mt-3 text-sm font-semibold text-white">
          {uploading ? 'Uploading…' : 'Drop photos & video here'}
        </p>
        <p className="text-xs text-white/40">PNG, JPG, WEBP, GIF, MP4, WEBM, MOV · up to 50MB each · max 10</p>
      </div>

      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}

      {media.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {media.map((m, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-xl bg-ink-soft ring-1 ring-ink-line">
              {m.type === 'video' ? (
                <video src={m.url} muted className="h-full w-full object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt="" className="h-full w-full object-cover" />
              )}
              {i === 0 && <span className="pill absolute left-1 top-1 bg-black/70 text-[10px] text-white">Cover</span>}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); remove(i); }}
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white opacity-0 transition group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
