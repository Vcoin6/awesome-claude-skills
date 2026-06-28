// Notification engine. Always records an in-app notification; additionally
// sends a real Web Push when VAPID keys are configured (best-effort, never
// blocks). Mirrors the Stripe/Blob "works zero-config, upgrades with keys" model.
import { writeDB, readDB, uid } from './db';

export function isPushEnabled() {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

export function getVapidPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || '';
}

// Create an in-app notification for `userId` and fire a web push if possible.
export async function notify(userId, { type = 'info', title, body = '', url = '/' }) {
  if (!userId) return;
  const note = {
    id: uid('ntf'),
    userId,
    type,
    title,
    body,
    url,
    read: false,
    createdAt: new Date().toISOString(),
  };
  await writeDB((d) => {
    d.notifications.push(note);
    // Keep the table from growing without bound (last 200 per user).
    const mine = d.notifications.filter((n) => n.userId === userId);
    if (mine.length > 200) {
      const cutoff = mine
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[mine.length - 200].createdAt;
      d.notifications = d.notifications.filter((n) => n.userId !== userId || n.createdAt >= cutoff);
    }
  });
  sendWebPush(userId, note).catch(() => {});
  return note;
}

async function sendWebPush(userId, note) {
  if (!isPushEnabled()) return;
  const db = await readDB();
  const subs = db.pushSubscriptions.filter((s) => s.userId === userId);
  if (subs.length === 0) return;

  const webpush = (await import('web-push')).default;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:hello@merchly.app',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  const payload = JSON.stringify({ title: note.title, body: note.body, url: note.url });

  const dead = [];
  await Promise.all(
    subs.map((s) =>
      webpush.sendNotification(s.subscription, payload).catch((err) => {
        if (err?.statusCode === 404 || err?.statusCode === 410) dead.push(s.id);
      })
    )
  );
  // Prune expired/invalid subscriptions.
  if (dead.length) {
    await writeDB((d) => {
      d.pushSubscriptions = d.pushSubscriptions.filter((s) => !dead.includes(s.id));
    });
  }
}
