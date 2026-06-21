'use client';

import { useEffect, useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';

const VIDEO = (type) => type.startsWith('video');

export default function MediaUploader({ media, setMedia }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);
  // Whether the server has Vercel Blob configured → use direct client uploads.
  const [blobEnabled, setBlobEnabled] = useState(false);
  // Per-file upload progress: [{ name, pct }].
  const [progress, setProgress] = useState([]);

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((c) => setBlobEnabled(Boolean(c.blobEnabled)))
      .catch(() => {});
  }, []);

  function setPct(index, pct) {
    setProgress((prev) => prev.map((it, i) => (i === index ? { ...it, pct } : it)));
  }

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    setError('');
    setUploading(true);
    setProgress(files.map((f) => ({ name: f.name, pct: 0 })));
    try {
      const uploaded = blobEnabled
        ? await uploadDirectToBlob(files)
        : await uploadViaServer(files);
      setMedia((m) => [...m, ...uploaded].slice(0, 10));
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
      setProgress([]);
    }
  }

  // Production path: browser → Vercel Blob directly (no function body limit).
  async function uploadDirectToBlob(files) {
    const out = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const blob = await upload(file.name, file, {
        access: 'public',
        contentType: file.type,
        handleUploadUrl: '/api/upload/blob',
        onUploadProgress: (e) => setPct(i, Math.round(e.percentage)),
      });
      setPct(i, 100);
      out.push({ url: blob.url, type: VIDEO(file.type) ? 'video' : 'image', size: file.size });
    }
    return out;
  }

  // Local/dev path: multipart through our route. Uses XHR so we get real upload
  // progress events (fetch doesn't expose upload progress). One request → the
  // same percentage is mirrored across all the files in this batch.
  function uploadViaServer(files) {
    return new Promise((resolve, reject) => {
      const fd = new FormData();
      files.forEach((f) => fd.append('files', f));
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload');
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setProgress((prev) => prev.map((it) => ({ ...it, pct })));
        }
      };
      xhr.onload = () => {
        let data = {};
        try { data = JSON.parse(xhr.responseText); } catch {}
        if (xhr.status >= 200 && xhr.status < 300) resolve(data.media || []);
        else reject(new Error(data.error || 'Upload failed'));
      };
      xhr.onerror = () => reject(new Error('Network error during upload.'));
      xhr.send(fd);
    });
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
        <p className="text-xs text-white/40">PNG, JPG, WEBP, GIF, MP4, WEBM, MOV · up to {blobEnabled ? '200MB' : '50MB'} each · max 10</p>
      </div>

      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}

      {progress.length > 0 && (
        <div className="mt-3 space-y-2">
          {progress.map((p, i) => (
            <div key={i}>
              <div className="mb-1 flex justify-between text-xs text-white/50">
                <span className="line-clamp-1 pr-2">{p.name}</span>
                <span className="tabular-nums">{p.pct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-ink-soft ring-1 ring-ink-line">
                <div
                  className="h-full rounded-full bg-brand-gradient transition-all duration-200"
                  style={{ width: `${p.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

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
