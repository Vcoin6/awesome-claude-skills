import Logo from './Logo';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-ink-line bg-ink-soft/50">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-white/50">
            Sell your merch. Keep 95%. The creator-first marketplace built for photos, video, and instant payouts.
          </p>
        </div>
        <FooterCol title="Marketplace" links={[['Browse merch', '/marketplace'], ['Start selling', '/register'], ['Log in', '/login']]} />
        <FooterCol title="Company" links={[['How it works', '/#how'], ['Pricing', '/#pricing'], ['Creator stories', '/#stories']]} />
        <FooterCol title="Legal" links={[['Terms', '/#'], ['Privacy', '/#'], ['Seller policy', '/#']]} />
      </div>
      <div className="border-t border-ink-line">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-white/40 sm:flex-row">
          <span>© {new Date().getFullYear()} Merchly. Built for creators worldwide.</span>
          <span>Sellers keep 95% · Merchly fee 5% · Instant payouts</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold text-white">{title}</h4>
      <ul className="space-y-2">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="text-sm text-white/50 hover:text-white">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
