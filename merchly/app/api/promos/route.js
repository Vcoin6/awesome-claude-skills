import { NextResponse } from 'next/server';
import { readDB, writeDB, uid } from '@/lib/db';
import { getRequestUser } from '@/lib/auth';
import { normalizeCode } from '@/lib/promos';

// GET /api/promos — the current seller's promo codes.
export async function GET(req) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = await readDB();
  const promos = db.promos
    .filter((p) => p.sellerId === user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return NextResponse.json({ promos });
}

// POST /api/promos — create a code. { code, type, value, maxUses?, minSubtotal?, expiresAt? }
export async function POST(req) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'seller') return NextResponse.json({ error: 'Sellers only.' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const code = normalizeCode(body.code);
  const type = body.type === 'fixed' ? 'fixed' : 'percent';
  const value = Number(body.value);

  if (!code) return NextResponse.json({ error: 'Enter a code.' }, { status: 400 });
  if (!Number.isFinite(value) || value <= 0) return NextResponse.json({ error: 'Enter a discount value.' }, { status: 400 });
  if (type === 'percent' && value > 90) return NextResponse.json({ error: 'Percent discount can’t exceed 90%.' }, { status: 400 });

  const db = await readDB();
  if (db.promos.some((p) => p.sellerId === user.id && p.code === code && p.active)) {
    return NextResponse.json({ error: 'You already have an active code with that name.' }, { status: 409 });
  }

  const promo = {
    id: uid('promo'),
    sellerId: user.id,
    code,
    type,
    value,
    active: true,
    uses: 0,
    maxUses: Number(body.maxUses) > 0 ? Number(body.maxUses) : null,
    minSubtotal: Number(body.minSubtotal) > 0 ? Number(body.minSubtotal) : null,
    expiresAt: body.expiresAt || null,
    createdAt: new Date().toISOString(),
  };
  await writeDB((d) => {
    d.promos.push(promo);
  });
  return NextResponse.json({ promo }, { status: 201 });
}
