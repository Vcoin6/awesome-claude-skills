import { NextResponse } from 'next/server';
import { writeDB } from '@/lib/db';
import { getRequestUser } from '@/lib/auth';
import { createSellerOnboarding, syncAccountStatus } from '@/lib/payments';

// GET /api/seller/onboard — re-sync payout status (called when a seller returns
// from Stripe-hosted onboarding to the dashboard).
export async function GET(req) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const status = await syncAccountStatus(user.stripeAccountId);
  await writeDB((d) => {
    const u = d.users.find((x) => x.id === user.id);
    if (u) u.payoutsEnabled = status.payoutsEnabled;
  });
  return NextResponse.json(status);
}

// POST /api/seller/onboard
// Kicks off Stripe Connect onboarding so the seller can receive 95% payouts.
// In simulation mode this instantly marks the seller as payout-ready.
export async function POST(req) {
  const user = await getRequestUser(req);
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
      // Simulation enables payouts instantly; for Stripe we wait for the
      // account.updated webhook (or the GET re-sync) to flip this true.
      u.payoutsEnabled = result.mode === 'simulation' ? true : u.payoutsEnabled;
    }
  });

  return NextResponse.json(result);
}
