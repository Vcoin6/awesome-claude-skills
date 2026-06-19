import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(_req, { params }) {
  const db = await readDB();
  const listing = db.listings.find((l) => l.id === params.id && l.status !== 'removed');
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ listing });
}

export async function DELETE(_req, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = await readDB();
  const listing = db.listings.find((l) => l.id === params.id);
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (listing.sellerId !== user.id) {
    return NextResponse.json({ error: 'You can only remove your own listings.' }, { status: 403 });
  }

  await writeDB((d) => {
    const l = d.listings.find((x) => x.id === params.id);
    if (l) l.status = 'removed';
  });
  return NextResponse.json({ ok: true });
}
