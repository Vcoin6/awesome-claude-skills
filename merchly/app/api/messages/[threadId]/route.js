import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { getRequestUser } from '@/lib/auth';
import { participantsOf } from '@/lib/messages';

// GET /api/messages/[threadId] — messages in a thread (participant-only).
// Marks messages addressed to the current user as read.
export async function GET(req, { params }) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!participantsOf(params.threadId).includes(user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = await readDB();
  const messages = db.messages
    .filter((m) => m.threadId === params.threadId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  if (messages.some((m) => m.toId === user.id && !m.read)) {
    await writeDB((d) => {
      for (const m of d.messages) {
        if (m.threadId === params.threadId && m.toId === user.id) m.read = true;
      }
    });
  }

  return NextResponse.json({ messages });
}
