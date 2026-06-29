import { NextResponse } from 'next/server';
import { writeDB } from '@/lib/db';
import { getRequestUser } from '@/lib/auth';

// DELETE /api/promos/[id] — deactivate a code (kept for usage history).
export async function DELETE(req, { params }) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let ok = false;
  await writeDB((d) => {
    const promo = d.promos.find((p) => p.id === params.id && p.sellerId === user.id);
    if (promo) {
      promo.active = false;
      ok = true;
    }
  });
  if (!ok) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
