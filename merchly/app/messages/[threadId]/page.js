import { redirect, notFound } from 'next/navigation';
import { readDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { participantsOf } from '@/lib/messages';
import MessageThread from '@/components/MessageThread';

export const dynamic = 'force-dynamic';

export default async function ThreadPage({ params, searchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const parts = participantsOf(params.threadId);
  if (!parts.includes(user.id)) notFound();

  // The other participant — derive from the thread, falling back to ?to=.
  const otherId = parts.find((p) => p !== user.id) || searchParams?.to;
  if (!otherId) notFound();

  const db = await readDB();
  const other = db.users.find((u) => u.id === otherId);

  return (
    <MessageThread
      threadId={params.threadId}
      meId={user.id}
      otherId={otherId}
      otherName={other?.name || 'Seller'}
    />
  );
}
