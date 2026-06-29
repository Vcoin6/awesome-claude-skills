import { NextResponse } from 'next/server';
import { writeDB } from '@/lib/db';
import { getRequestUser } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';

// POST /api/admin/users/[id]  { action: 'suspend' | 'unsuspend' }
export async function POST(req, { params }) {
  const user = await getRequestUser(req);
  if (!isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (params.id === user.id) return NextResponse.json({ error: 'You can’t suspend yourself.' }, { status: 400 });

  const { action } = await req.json().catch(() => ({}));
  await writeDB((d) => {
    const u = d.users.find((x) => x.id === params.id);
    if (u) u.suspended = action === 'suspend';
  });
  return NextResponse.json({ ok: true });
}
