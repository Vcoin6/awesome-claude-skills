import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import PromosManager from '@/components/PromosManager';

export const dynamic = 'force-dynamic';

export default async function PromosPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'seller') redirect('/marketplace');

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/dashboard" className="text-sm text-brand-fuchsia hover:text-white">← Dashboard</Link>
      <h1 className="mt-1 font-display text-3xl font-700 text-white">Discount codes</h1>
      <p className="mb-8 text-sm text-white/50">Create promo codes buyers can apply at checkout to your merch.</p>
      <PromosManager />
    </div>
  );
}
