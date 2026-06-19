// Seed Merchly with demo sellers + listings so the marketplace looks alive.
// Generates self-contained SVG placeholder media (no network needed).
//   node scripts/seed.mjs
import { promises as fs } from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'data');
const UPLOAD_DIR = path.join(ROOT, 'public', 'uploads');

function uid(p) {
  return `${p}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

function svg(label, c1, c2) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
  </linearGradient></defs>
  <rect width="800" height="800" fill="${c1}"/>
  <rect width="800" height="800" fill="url(#g)" opacity="0.9"/>
  <circle cx="640" cy="160" r="220" fill="#ffffff" opacity="0.10"/>
  <circle cx="160" cy="640" r="160" fill="#000000" opacity="0.12"/>
  <text x="400" y="420" font-family="Arial, sans-serif" font-size="64" font-weight="800"
    fill="#ffffff" text-anchor="middle" opacity="0.95">${label}</text>
</svg>`;
}

async function writeSvg(label, c1, c2) {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const name = `seed_${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}_${Math.random().toString(36).slice(2, 6)}.svg`;
  await fs.writeFile(path.join(UPLOAD_DIR, name), svg(label, c1, c2));
  return { url: `/uploads/${name}`, type: 'image', size: 0 };
}

const palette = [
  ['#7C3AED', '#DB2777'],
  ['#DB2777', '#F59E0B'],
  ['#3B82F6', '#7C3AED'],
  ['#10B981', '#3B82F6'],
  ['#F59E0B', '#EF4444'],
  ['#EC4899', '#8B5CF6'],
];

async function run() {
  const pass = await bcrypt.hash('password123', 10);

  const sellers = [
    { name: 'Nova Prints', bio: 'Hand-screened streetwear & limited drops. Shipped worldwide.' },
    { name: 'Echo Audio', bio: 'Vinyl, cassettes, and tour merch from the underground.' },
    { name: 'Pixel Forge', bio: 'Digital art, posters, and collectible prints.' },
  ].map((s) => ({
    id: uid('usr'),
    name: s.name,
    email: `${s.name.toLowerCase().replace(/\s+/g, '')}@demo.merchly`,
    role: 'seller',
    passwordHash: pass,
    bio: s.bio,
    avatarColor: '#7C3AED',
    stripeAccountId: `acct_sim_${Math.random().toString(36).slice(2, 8)}`,
    payoutsEnabled: true,
    createdAt: new Date(Date.now() - Math.random() * 9e9).toISOString(),
  }));

  const catalog = [
    ['Limited Tour Hoodie', 'apparel', 6500, ['streetwear', 'limited'], 'Hoodie'],
    ['Holographic Sticker Pack', 'accessories', 1200, ['stickers', 'y2k'], 'Stickers'],
    ['Signed Vinyl — Midnight LP', 'music', 3400, ['vinyl', 'music'], 'Vinyl'],
    ['Embroidered Dad Cap', 'apparel', 2800, ['cap', 'classic'], 'Cap'],
    ['A2 Risograph Print', 'art', 4000, ['print', 'art'], 'Print'],
    ['Enamel Pin Set', 'collectibles', 1800, ['pins', 'collectible'], 'Pins'],
    ['Oversized Logo Tee', 'apparel', 3200, ['tee', 'oversized'], 'Tee'],
    ['Digital Wallpaper Pack', 'digital', 900, ['digital', 'download'], 'Wallpapers'],
    ['Canvas Tote Bag', 'accessories', 2400, ['tote', 'eco'], 'Tote'],
    ['Glow Vinyl Figure', 'collectibles', 5200, ['figure', 'glow'], 'Figure'],
  ];

  const listings = [];
  for (let i = 0; i < catalog.length; i++) {
    const [title, category, priceCents, tags, short] = catalog[i];
    const seller = sellers[i % sellers.length];
    const [c1, c2] = palette[i % palette.length];
    const media = [await writeSvg(short, c1, c2), await writeSvg(short + ' ·', c2, c1)];
    listings.push({
      id: uid('lst'),
      sellerId: seller.id,
      sellerName: seller.name,
      title,
      description: `${title} from ${seller.name}. Premium quality, limited run. Ships in 3–5 days.`,
      category,
      tags,
      priceCents,
      stock: 5 + Math.floor(Math.random() * 40),
      media,
      status: 'active',
      views: Math.floor(Math.random() * 800),
      createdAt: new Date(Date.now() - Math.random() * 8e9).toISOString(),
    });
  }

  const db = { users: sellers, listings, orders: [] };
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, 'merchly.json'), JSON.stringify(db, null, 2));

  console.log(`Seeded ${sellers.length} sellers and ${listings.length} listings.`);
  console.log('Demo seller login → email: novaprints@demo.merchly  password: password123');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
