import { NextResponse } from 'next/server';
import { writeDB } from '@/lib/db';
import { getRequestUser } from '@/lib/auth';

// POST /api/notifications/read — mark all (or one { id }) as read.
export async function POST(req) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json().catch(() => ({}));
  await writeDB((d) => {
    for (const n of d.notifications) {
      if (n.userId === user.id && (!id || n.id === id)) n.read = true;
    }
  });
  return NextResponse.json({ ok: true });
}
