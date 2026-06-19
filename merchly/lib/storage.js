// Media storage with two interchangeable backends, auto-selected at runtime:
//   • Vercel Blob — used when BLOB_READ_WRITE_TOKEN is present (production).
//     Returns a public CDN URL; required because Vercel's FS is not writable.
//   • Local filesystem (public/uploads) — zero-config default for dev.
import { promises as fs } from 'fs';
import path from 'path';
import { uid } from './db';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

// Saves one file and returns its public URL.
// `buffer` is a Node Buffer; `ext` includes the dot (e.g. ".mp4").
export async function saveMedia(buffer, { ext, contentType }) {
  const name = `${uid('m')}${ext}`;

  if (useBlob) {
    const { put } = await import('@vercel/blob');
    const blob = await put(`uploads/${name}`, buffer, {
      access: 'public',
      contentType,
      addRandomSuffix: false,
    });
    return blob.url; // absolute https://...blob.vercel-storage.com/uploads/<name>
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, name), buffer);
  return `/uploads/${name}`; // served from /public by Next.js
}
