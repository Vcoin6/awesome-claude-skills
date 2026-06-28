import { NextResponse } from 'next/server';
import { readDB, writeDB, uid } from '@/lib/db';
import { getRequestUser } from '@/lib/auth';
import { getVapidPublicKey, isPushEnabled } from '@/lib/notify';

// GET /api/push/subscribe — returns the VAPID public key (and whether push is on).
export async function GET() {
  return NextResponse.json({ enabled: isPushEnabled(), publicKey: getVapidPublicKey() });
}

// POST /api/push/subscribe — store a browser PushSubscription for the user.
export async function POST(req) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { subscription } = await req.json().catch(() => ({}));
  if (!subscription?.endpoint) {
    return NextResponse.json({ error: 'Invalid subscription.' }, { status: 400 });
  }

  const db = await readDB();
  if (db.pushSubscriptions.some((s) => s.subscription?.endpoint === subscription.endpoint)) {
    return NextResponse.json({ ok: true }); // already stored
  }
  await writeDB((d) => {
    d.pushSubscriptions.push({ id: uid('sub'), userId: user.id, subscription, createdAt: new Date().toISOString() });
  });
  return NextResponse.json({ ok: true });
}
