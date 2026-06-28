import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';
import { getRequestUser } from '@/lib/auth';

// GET /api/notifications — recent notifications + unread count for the user.
export async function GET(req) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ notifications: [], unread: 0 });

  const db = await readDB();
  const mine = db.notifications
    .filter((n) => n.userId === user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const unread = mine.filter((n) => !n.read).length;
  return NextResponse.json({ notifications: mine.slice(0, 30), unread });
}
