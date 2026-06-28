import Link from 'next/link';
import { redirect } from 'next/navigation';
import { readDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { timeAgo } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const db = await readDB();
  const mine = db.messages.filter((m) => m.fromId === user.id || m.toId === user.id);

  const byThread = new Map();
  for (const m of mine) {
    (byThread.get(m.threadId) || byThread.set(m.threadId, []).get(m.threadId)).push(m);
  }
  const threads = [...byThread.entries()]
    .map(([threadId, msgs]) => {
      msgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      const last = msgs[msgs.length - 1];
      const otherId = last.fromId === user.id ? last.toId : last.fromId;
      const other = db.users.find((u) => u.id === otherId);
      return {
        threadId,
        otherName: other?.name || 'Unknown',
        lastText: last.text,
        lastAt: last.createdAt,
        unread: msgs.filter((m) => m.toId === user.id && !m.read).length,
      };
    })
    .sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="font-display text-3xl font-700 text-white">Messages</h1>

      {threads.length === 0 ? (
        <div className="card mt-8 grid place-items-center gap-3 px-6 py-16 text-center text-white/50">
          <p>No conversations yet. Message a seller from any product page.</p>
          <Link href="/marketplace" className="btn-primary">Browse the marketplace</Link>
        </div>
      ) : (
        <div className="mt-8 space-y-2">
          {threads.map((t) => (
            <Link key={t.threadId} href={`/messages/${t.threadId}`} className="card flex items-center gap-3 p-4 hover:ring-brand-violet/50">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-gradient font-bold text-white">
                {t.otherName?.[0]?.toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{t.otherName}</span>
                  <span className="text-xs text-white/35">{timeAgo(t.lastAt)}</span>
                </div>
                <p className="line-clamp-1 text-sm text-white/55">{t.lastText}</p>
              </div>
              {t.unread > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-fuchsia px-1 text-[11px] font-bold text-white">{t.unread}</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
