import { NextResponse } from 'next/server';
import { writeDB } from '@/lib/db';
import { getRequestUser } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';

// DELETE /api/admin/reviews/[id] — remove an abusive/spam review.
export async function DELETE(req, { params }) {
  const user = await getRequestUser(req);
  if (!isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await writeDB((d) => {
    d.reviews = d.reviews.filter((r) => r.id !== params.id);
  });
  return NextResponse.json({ ok: true });
}
