import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getRequestUser } from '@/lib/auth';
import { uid } from '@/lib/db';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAX_BYTES = 50 * 1024 * 1024; // 50MB per file
const ALLOWED = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
};

// POST /api/upload  (multipart form-data, field "files")
export async function POST(req) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'You must be logged in to upload.' }, { status: 401 });

  const form = await req.formData();
  const files = form.getAll('files').filter((f) => typeof f === 'object' && 'arrayBuffer' in f);
  if (files.length === 0) {
    return NextResponse.json({ error: 'No files received.' }, { status: 400 });
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const media = [];

  for (const file of files) {
    const ext = ALLOWED[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type || 'unknown'}.` },
        { status: 415 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Each file must be under 50MB.' }, { status: 413 });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const name = `${uid('m')}${ext}`;
    await fs.writeFile(path.join(UPLOAD_DIR, name), buf);
    media.push({
      url: `/uploads/${name}`,
      type: file.type.startsWith('video') ? 'video' : 'image',
      size: file.size,
    });
  }

  return NextResponse.json({ media });
}
