import { NextResponse } from 'next/server';
import { isStripeEnabled, getPublishableKey, PLATFORM_FEE_PERCENT } from '@/lib/payments';

// GET /api/config — public runtime config for clients (esp. the mobile app).
export async function GET() {
  return NextResponse.json({
    stripeEnabled: isStripeEnabled(),
    publishableKey: getPublishableKey(),
    platformFeePercent: PLATFORM_FEE_PERCENT,
  });
}
