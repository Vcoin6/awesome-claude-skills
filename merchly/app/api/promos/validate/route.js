import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';
import { validatePromo, normalizeCode } from '@/lib/promos';

// POST /api/promos/validate — preview a code's discount for a cart.
// Body: { code, items: [{ id, qty }] }. Resolves the code's seller and applies
// it to that seller's subtotal only.
export async function POST(req) {
  const { code, items } = await req.json().catch(() => ({}));
  const normalized = normalizeCode(code);
  if (!normalized || !Array.isArray(items)) {
    return NextResponse.json({ ok: false, error: 'Enter a code.' }, { status: 400 });
  }

  const db = await readDB();
  const promo = db.promos.find((p) => p.code === normalized && p.active);
  if (!promo) return NextResponse.json({ ok: false, error: 'Invalid code.' }, { status: 200 });

  // Subtotal of items in the cart that belong to this promo's seller.
  let sellerSubtotal = 0;
  for (const item of items) {
    const listing = db.listings.find((l) => l.id === item.id && l.sellerId === promo.sellerId);
    if (listing) sellerSubtotal += listing.priceCents * Math.max(1, Number(item.qty) || 1);
  }
  if (sellerSubtotal === 0) {
    return NextResponse.json({ ok: false, error: 'This code doesn’t apply to anything in your cart.' });
  }

  const result = validatePromo(promo, sellerSubtotal);
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error });

  return NextResponse.json({
    ok: true,
    code: promo.code,
    sellerId: promo.sellerId,
    discount: result.discount,
    label: promo.type === 'percent' ? `${promo.value}% off` : `$${promo.value} off`,
  });
}
