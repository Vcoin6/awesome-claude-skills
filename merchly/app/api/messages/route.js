import { NextResponse } from 'next/server';
import { readDB, writeDB, uid } from '@/lib/db';
import { getRequestUser } from '@/lib/auth';
import { threadIdFor } from '@/lib/messages';
import { notify } from '@/lib/notify';

// GET /api/messages — thread summaries for the current user.
export async function GET(req) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ threads: [] });

  const db = await readDB();
  const mine = db.messages.filter((m) => m.fromId === user.id || m.toId === user.id);

  const byThread = new Map();
  for (const m of mine) {
    const arr = byThread.get(m.threadId) || [];
    arr.push(m);
    byThread.set(m.threadId, arr);
  }

  const threads = [...byThread.entries()].map(([threadId, msgs]) => {
    msgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const last = msgs[msgs.length - 1];
    const otherId = last.fromId === user.id ? last.toId : last.fromId;
    const other = db.users.find((u) => u.id === otherId);
    const unread = msgs.filter((m) => m.toId === user.id && !m.read).length;
    return {
      threadId,
      otherId,
      otherName: other?.name || 'Unknown',
      lastText: last.text,
      lastAt: last.createdAt,
      unread,
    };
  });
  threads.sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));

  return NextResponse.json({ threads });
}

// POST /api/messages — send a message. { toId, listingId?, text }
export async function POST(req) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Log in to send messages.' }, { status: 401 });

  const { toId, listingId, text } = await req.json().catch(() => ({}));
  const body = String(text || '').trim();
  if (!toId || !body) return NextResponse.json({ error: 'Message and recipient are required.' }, { status: 400 });
  if (toId === user.id) return NextResponse.json({ error: 'You can’t message yourself.' }, { status: 400 });

  const db = await readDB();
  const recipient = db.users.find((u) => u.id === toId);
  if (!recipient) return NextResponse.json({ error: 'Recipient not found.' }, { status: 404 });

  const message = {
    id: uid('msg'),
    threadId: threadIdFor(user.id, toId),
    fromId: user.id,
    toId,
    listingId: listingId || null,
    text: body.slice(0, 2000),
    read: false,
    createdAt: new Date().toISOString(),
  };
  await writeDB((d) => {
    d.messages.push(message);
  });

  await notify(toId, {
    type: 'message',
    title: `New message from ${user.name}`,
    body: body.slice(0, 120),
    url: `/messages/${message.threadId}`,
  });

  return NextResponse.json({ message }, { status: 201 });
}
