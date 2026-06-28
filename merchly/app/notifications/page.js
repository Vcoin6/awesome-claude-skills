import Link from 'next/link';
import { redirect } from 'next/navigation';
import { readDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isPushEnabled } from '@/lib/notify';
import { timeAgo } from '@/lib/format';
import EnablePushButton from '@/components/EnablePushButton';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const db = await readDB();
  const notes = db.notifications
    .filter((n) => n.userId === user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-700 text-white">Notifications</h1>
        {isPushEnabled() && <EnablePushButton />}
      </div>

      {notes.length === 0 ? (
        <div className="card mt-8 grid place-items-center px-6 py-16 text-center text-white/50">
          Nothing here yet — sales, reviews, and messages will show up here.
        </div>
      ) : (
        <div className="mt-8 space-y-2">
          {notes.map((n) => (
            <Link key={n.id} href={n.url || '#'} className={`card flex items-start gap-3 p-4 hover:ring-brand-violet/50 ${n.read ? '' : 'ring-brand-violet/40'}`}>
              {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-fuchsia" />}
              <div className={n.read ? 'opacity-70' : ''}>
                <p className="text-sm font-semibold text-white">{n.title}</p>
                {n.body && <p className="text-sm text-white/55">{n.body}</p>}
                <p className="mt-1 text-xs text-white/35">{timeAgo(n.createdAt)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
