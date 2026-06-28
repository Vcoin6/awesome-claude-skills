import { NextResponse } from 'next/server';
import { isStripeEnabled, getPublishableKey, PLATFORM_FEE_PERCENT } from '@/lib/payments';
import { isBlobEnabled } from '@/lib/storage';

// Must read env at request time (not be statically prerendered at build).
export const dynamic = 'force-dynamic';

// GET /api/config — public runtime config for clients (esp. the mobile app).
export async function GET() {
  return NextResponse.json({
    stripeEnabled: isStripeEnabled(),
    publishableKey: getPublishableKey(),
    platformFeePercent: PLATFORM_FEE_PERCENT,
    // When true, web clients upload media directly to Vercel Blob (no size cap
    // from the serverless function body limit).
    blobEnabled: isBlobEnabled(),
  });
}
