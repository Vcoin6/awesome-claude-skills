import Link from 'next/link';

export default function Logo({ className = '', compact = false }) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-2.5 ${className}`}>
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient shadow-glow">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 8.5 7 4h10l3 4.5M4 8.5 12 21l8-12.5M4 8.5h16M9 8.5l3 12.5 3-12.5"
            stroke="white"
            strokeWidth="1.7"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {!compact && (
        <span className="font-display text-xl font-700 tracking-tight text-white">
          Merch<span className="gradient-text">ly</span>
        </span>
      )}
    </Link>
  );
}
