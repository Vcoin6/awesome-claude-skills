import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-md place-items-center px-6 text-center">
      <div>
        <p className="font-display text-7xl font-700 gradient-text">404</p>
        <h1 className="mt-2 font-display text-2xl font-700 text-white">We couldn’t find that</h1>
        <p className="mt-2 text-white/50">The page or listing may have been removed.</p>
        <Link href="/marketplace" className="btn-primary mt-6">Back to marketplace</Link>
      </div>
    </div>
  );
}
