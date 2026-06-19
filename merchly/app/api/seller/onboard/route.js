import { NextResponse } from 'next/server';
import { writeDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createSellerOnboarding } from '@/lib/payments';

// POST /api/seller/onboard
// Kicks off Stripe Connect onboarding so the seller can receive 95% payouts.
// In simulation mode this instantly marks the seller as payout-ready.
export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'seller') {
    return NextResponse.json({ error: 'Only sellers need payout accounts.' }, { status: 403 });
  }

  const origin = new URL(req.url).origin;
  const result = await createSellerOnboarding({
    user,
    returnUrl: `${origin}/dashboard`,
  });

  await writeDB((d) => {
    const u = d.users.find((x) => x.id === user.id);
    if (u) {
      u.stripeAccountId = result.accountId;
      // In simulation we consider payouts immediately enabled for demo purposes.
      u.payoutsEnabled = result.mode === 'simulation' ? true : u.payoutsEnabled;
    }
  });

  return NextResponse.json(result);
}
