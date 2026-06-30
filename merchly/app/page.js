import Link from 'next/link';
import { readDB } from '@/lib/db';
import { attachRatings } from '@/lib/reviews';
import { CATEGORIES } from '@/lib/categories';
import ProductCard from '@/components/ProductCard';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const db = await readDB();
  const featured = attachRatings(
    db.listings
      .filter((l) => l.status === 'active')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 8),
    db.reviews
  );

  return (
    <div>
      {/* ───────────── Hero ───────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-radial" />
        <div className="absolute inset-0 bg-grid" />
        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-20 sm:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="pill mx-auto mb-6 bg-white/5 text-white/70 ring-1 ring-white/10">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-amber" />
              The creator-first merch marketplace
            </span>
            <h1 className="font-display text-5xl font-700 leading-[1.05] tracking-tight text-white sm:text-7xl">
              Sell your merch.
              <br />
              <span className="gradient-text">Keep 95%.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-white/60">
              Upload photos and video, build your store in minutes, and get paid instantly.
              Merchly takes just 5% — the lowest in the game — and the rest lands straight in your account.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/register" className="btn-primary w-full px-7 py-4 text-base sm:w-auto">
                Start selling free
              </Link>
              <Link href="/marketplace" className="btn-ghost w-full px-7 py-4 text-base sm:w-auto">
                Browse the marketplace
              </Link>
            </div>
            <p className="mt-4 text-xs text-white/40">No listing fees · No monthly fees · Payout the moment you sell</p>
          </div>

          <div className="mx-auto mt-14 grid max-w-3xl grid-cols-3 gap-4">
            <Stat value="5%" label="Flat seller fee" />
            <Stat value="95%" label="You keep" />
            <Stat value="<60s" label="To your first listing" />
          </div>
        </div>
      </section>

      {/* ───────────── Shop by category ───────────── */}
      <section className="mx-auto max-w-7xl px-6 pt-8">
        <h2 className="mb-4 font-display text-2xl font-700 text-white sm:text-3xl">Shop by category</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORIES.filter((c) => c.slug !== 'other').map((c) => (
            <Link key={c.slug} href={`/category/${c.slug}`} className="card group relative overflow-hidden p-5 transition hover:ring-brand-violet/60">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand-violet/10 blur-2xl transition group-hover:bg-brand-violet/20" />
              <h3 className="relative font-display text-lg font-700 text-white">{c.name}</h3>
              <p className="relative mt-1 line-clamp-2 text-xs text-white/45">{c.blurb}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ───────────── Featured ───────────── */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-700 text-white sm:text-3xl">Fresh drops</h2>
            <p className="text-sm text-white/50">Newly listed merch from creators around the world</p>
          </div>
          <Link href="/marketplace" className="text-sm font-semibold text-brand-fuchsia hover:text-white">View all →</Link>
        </div>

        {featured.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((l) => (
              <ProductCard key={l.id} listing={l} />
            ))}
          </div>
        ) : (
          <div className="card grid place-items-center gap-3 px-6 py-16 text-center">
            <p className="text-white/60">No listings yet — be the first creator to drop merch.</p>
            <Link href="/register" className="btn-primary">Create your store</Link>
          </div>
        )}
      </section>

      {/* ───────────── How it works ───────────── */}
      <section id="how" className="border-y border-ink-line bg-ink-soft/40">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <h2 className="text-center font-display text-3xl font-700 text-white sm:text-4xl">
            Live in three steps
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-white/55">
            Whether you print hoodies, drop sticker packs, or sell one-of-one art —
            Merchly gets you selling fast.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Step n="01" title="Create your store" body="Sign up as a seller and claim your profile. Add a name, bio, and your vibe — no store-builder degree required." />
            <Step n="02" title="Upload photos & video" body="Show your merch in motion. Drag in images and clips, set a price, hit publish. Your drop is live worldwide." />
            <Step n="03" title="Get paid 95%" body="Buyers check out securely. Merchly automatically keeps 5% and routes the rest straight to your connected payout account." />
          </div>
        </div>
      </section>

      {/* ───────────── Pricing ───────────── */}
      <section id="pricing" className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-700 text-white sm:text-4xl">
              The fairest deal for creators
            </h2>
            <p className="mt-4 text-white/60">
              Other platforms nickel-and-dime you with listing fees, monthly subscriptions,
              and double-digit commissions. Merchly charges one simple flat rate — and nothing else.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Flat 5% per sale — you keep 95%',
                'Zero listing fees, zero monthly fees',
                'Photo + video listings included',
                'Instant, automatic payouts to your account',
                'Sell to shoppers anywhere in the world',
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-white/80">
                  <Check />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/register" className="btn-primary mt-8 px-7 py-4">Start selling free</Link>
          </div>

          <div className="card relative overflow-hidden p-8">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-violet/30 blur-3xl" />
            <p className="text-sm font-semibold uppercase tracking-wide text-white/50">Example sale</p>
            <p className="mt-2 font-display text-5xl font-700 text-white">$100.00</p>
            <div className="mt-6 space-y-3">
              <Row label="You receive (95%)" value="$95.00" highlight />
              <Row label="Merchly fee (5%)" value="$5.00" />
            </div>
            <div className="mt-6 rounded-xl bg-white/5 p-4 text-sm text-white/55">
              On a $100 sale you walk away with <span className="font-semibold text-white">$95</span> —
              automatically deposited to your account the moment the buyer pays.
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── CTA ───────────── */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="card relative overflow-hidden bg-brand-gradient p-12 text-center">
          <div className="absolute inset-0 bg-grid opacity-30" />
          <h2 className="relative font-display text-3xl font-700 text-white sm:text-4xl">
            Your merch deserves a bigger stage
          </h2>
          <p className="relative mx-auto mt-3 max-w-lg text-white/85">
            Join the creators turning their drops into income on Merchly. It’s free to start.
          </p>
          <Link href="/register" className="btn relative mt-7 bg-white px-8 py-4 text-base font-bold text-ink hover:bg-white/90">
            Create your store
          </Link>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="card px-4 py-5 text-center">
      <div className="font-display text-3xl font-700 gradient-text">{value}</div>
      <div className="mt-1 text-xs text-white/50">{label}</div>
    </div>
  );
}

function Step({ n, title, body }) {
  return (
    <div className="card p-7">
      <div className="font-display text-sm font-700 text-brand-fuchsia">{n}</div>
      <h3 className="mt-3 font-display text-xl font-600 text-white">{title}</h3>
      <p className="mt-2 text-sm text-white/55">{body}</p>
    </div>
  );
}

function Row({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 pb-3">
      <span className={highlight ? 'font-semibold text-white' : 'text-white/60'}>{label}</span>
      <span className={highlight ? 'font-display text-xl font-700 gradient-text' : 'text-white/80'}>{value}</span>
    </div>
  );
}

function Check() {
  return (
    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-violet/20 text-brand-fuchsia">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M5 12.5 10 17l9-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </span>
  );
}
