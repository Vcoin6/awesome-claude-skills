import { NextResponse } from 'next/server';
import { readDB, writeDB, uid } from '@/lib/db';
import { getRequestUser } from '@/lib/auth';
import { attachRatings } from '@/lib/reviews';

// GET /api/listings?q=&category=&seller=&sort=&minPrice=&maxPrice=
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').toLowerCase();
  const category = searchParams.get('category');
  const seller = searchParams.get('seller');
  const sort = searchParams.get('sort') || 'new';
  const minPrice = Number(searchParams.get('minPrice'));
  const maxPrice = Number(searchParams.get('maxPrice'));

  const db = await readDB();
  let items = db.listings.filter((l) => l.status !== 'removed');

  if (q) {
    items = items.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        (l.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  }
  if (category && category !== 'all') items = items.filter((l) => l.category === category);
  if (seller) items = items.filter((l) => l.sellerId === seller);
  if (Number.isFinite(minPrice)) items = items.filter((l) => l.priceCents >= minPrice * 100);
  if (Number.isFinite(maxPrice) && maxPrice > 0) items = items.filter((l) => l.priceCents <= maxPrice * 100);

  // Attach { avg, count } ratings so cards can show stars.
  items = attachRatings(items, db.reviews);

  if (sort === 'price-asc') items.sort((a, b) => a.priceCents - b.priceCents);
  else if (sort === 'price-desc') items.sort((a, b) => b.priceCents - a.priceCents);
  else if (sort === 'rating') items.sort((a, b) => b.rating.avg - a.rating.avg || b.rating.count - a.rating.count);
  else items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return NextResponse.json({ listings: items });
}

// POST /api/listings  (sellers only)
export async function POST(req) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 });
  if (user.role !== 'seller') {
    return NextResponse.json({ error: 'Switch to a seller account to list merch.' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { title, description, price, category, tags, media, stock } = body;

  if (!title || !price) {
    return NextResponse.json({ error: 'Title and price are required.' }, { status: 400 });
  }
  const priceCents = Math.round(Number(price) * 100);
  if (!Number.isFinite(priceCents) || priceCents <= 0) {
    return NextResponse.json({ error: 'Enter a valid price.' }, { status: 400 });
  }
  if (!Array.isArray(media) || media.length === 0) {
    return NextResponse.json({ error: 'Add at least one photo or video.' }, { status: 400 });
  }

  const listing = {
    id: uid('lst'),
    sellerId: user.id,
    sellerName: user.name,
    title: String(title).trim().slice(0, 120),
    description: String(description || '').trim().slice(0, 2000),
    category: category || 'other',
    tags: Array.isArray(tags) ? tags.slice(0, 12) : [],
    priceCents,
    stock: Number.isFinite(Number(stock)) ? Math.max(0, Number(stock)) : 99,
    media: media.slice(0, 10),
    status: 'active',
    views: 0,
    createdAt: new Date().toISOString(),
  };

  await writeDB((d) => {
    d.listings.push(listing);
  });

  return NextResponse.json({ listing }, { status: 201 });
}
