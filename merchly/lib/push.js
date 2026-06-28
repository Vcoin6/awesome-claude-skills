'use client';

// Registers the service worker and subscribes the browser to Web Push — but
// only if the server has VAPID keys configured and the user grants permission.
// No-ops gracefully everywhere else (in-app notifications still work).

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

let attempted = false;

export async function ensurePushSubscribed() {
  if (attempted) return;
  attempted = true;
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  const cfg = await fetch('/api/push/subscribe').then((r) => r.json()).catch(() => null);
  if (!cfg?.enabled || !cfg.publicKey) return; // push not configured on server

  // Only subscribe if permission is already granted (don't nag on load).
  if (Notification.permission !== 'granted') return;

  const reg = await navigator.serviceWorker.register('/sw.js');
  const existing = await reg.pushManager.getSubscription();
  const sub =
    existing ||
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(cfg.publicKey),
    }));

  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription: sub }),
  });
}

// Call from a user gesture (button) to request permission then subscribe.
export async function enablePush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { ok: false, reason: 'unsupported' };
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, reason: 'denied' };
  attempted = false;
  await ensurePushSubscribed();
  return { ok: true };
}
