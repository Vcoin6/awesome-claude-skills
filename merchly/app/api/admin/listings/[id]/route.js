import { NextResponse } from 'next/server';
import { writeDB } from '@/lib/db';
import { getRequestUser } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';

// POST /api/admin/listings/[id]  { action: 'remove' | 'restore' }
export async function POST(req, { params }) {
  const user = await getRequestUser(req);
  if (!isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { action } = await req.json().catch(() => ({}));
  await writeDB((d) => {
    const l = d.listings.find((x) => x.id === params.id);
    if (l) l.status = action === 'restore' ? 'active' : 'removed';
  });
  return NextResponse.json({ ok: true });
}
