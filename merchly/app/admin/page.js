import Link from 'next/link';
import { redirect } from 'next/navigation';
import { readDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { formatMoney, timeAgo } from '@/lib/format';
import { ListingAction, UserAction, ReviewAction } from '@/components/AdminActions';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!isAdmin(user)) redirect('/');

  const db = await readDB();
  const paid = db.orders.filter((o) => o.status === 'paid');
  const gmv = paid.reduce((s, o) => s + o.amount, 0);
  const platformRevenue = paid.reduce((s, o) => s + o.platformFee, 0);

  const listings = [...db.listings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 25);
  const users = [...db.users].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 25);
  const reviews = [...db.reviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 25);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center gap-2">
        <h1 className="font-display text-3xl font-700 text-white">Admin console</h1>
        <span className="pill bg-red-500/15 text-red-300">Moderation</span>
      </div>
      <p className="mb-8 text-sm text-white/50">Signed in as {user.name} ({user.email})</p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Users" value={String(db.users.length)} />
        <Stat label="Listings" value={String(db.listings.filter((l) => l.status !== 'removed').length)} />
        <Stat label="Orders" value={String(paid.length)} />
        <Stat label="GMV" value={formatMoney(gmv)} />
        <Stat label="Platform 5%" value={formatMoney(platformRevenue)} accent />
      </div>

      <Section title="Listings">
        {listings.map((l) => (
          <Row key={l.id}>
            <div className="min-w-0">
              <Link href={`/product/${l.id}`} className="line-clamp-1 font-semibold text-white hover:text-brand-fuchsia">{l.title}</Link>
              <p className="text-xs text-white/45">{l.sellerName} · {formatMoney(l.priceCents)} · {l.status}</p>
            </div>
            <ListingAction id={l.id} removed={l.status === 'removed'} />
          </Row>
        ))}
      </Section>

      <Section title="Users">
        {users.map((u) => (
          <Row key={u.id}>
            <div className="min-w-0">
              <p className="font-semibold text-white">{u.name} {u.suspended && <span className="pill bg-red-500/15 text-red-300">suspended</span>}</p>
              <p className="text-xs text-white/45">{u.email} · {u.role}</p>
            </div>
            <UserAction id={u.id} suspended={!!u.suspended} />
          </Row>
        ))}
      </Section>

      <Section title="Reviews">
        {reviews.length === 0 ? (
          <p className="px-1 py-3 text-sm text-white/45">No reviews.</p>
        ) : reviews.map((r) => (
          <Row key={r.id}>
            <div className="min-w-0">
              <p className="text-sm text-white/80">{'★'.repeat(r.rating)} <span className="text-white/50">by {r.buyerName}</span></p>
              <p className="line-clamp-1 text-xs text-white/45">{r.text || '(no text)'} · {timeAgo(r.createdAt)}</p>
            </div>
            <ReviewAction id={r.id} />
          </Row>
        ))}
      </Section>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-white/45">{label}</div>
      <div className={`mt-1 font-display text-xl font-700 ${accent ? 'gradient-text' : 'text-white'}`}>{value}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 font-display text-lg font-700 text-white">{title}</h2>
      <div className="card divide-y divide-ink-line">{children}</div>
    </section>
  );
}

function Row({ children }) {
  return <div className="flex items-center justify-between gap-3 px-4 py-3">{children}</div>;
}
