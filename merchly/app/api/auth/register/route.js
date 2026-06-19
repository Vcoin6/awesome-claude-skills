import { NextResponse } from 'next/server';
import { readDB, writeDB, uid } from '@/lib/db';
import { hashPassword, signToken, setAuthCookie, sanitizeUser } from '@/lib/auth';

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const { name, email, password, role } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email and password are required.' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
  }
  if (!['seller', 'shopper'].includes(role)) {
    return NextResponse.json({ error: 'Choose whether you are selling or shopping.' }, { status: 400 });
  }

  const db = await readDB();
  const normalizedEmail = String(email).trim().toLowerCase();
  if (db.users.some((u) => u.email === normalizedEmail)) {
    return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = {
    id: uid('usr'),
    name: String(name).trim(),
    email: normalizedEmail,
    role,
    passwordHash,
    bio: '',
    avatarColor: pickColor(name),
    // Seseller payout account (Stripe Connect). Simulated until onboarded.
    stripeAccountId: role === 'seller' ? `acct_sim_pending` : null,
    payoutsEnabled: false,
    createdAt: new Date().toISOString(),
  };

  await writeDB((d) => {
    d.users.push(user);
  });

  const token = signToken(user);
  setAuthCookie(token);
  // `token` is for native mobile clients (Bearer auth); web uses the cookie.
  return NextResponse.json({ user: sanitizeUser(user), token }, { status: 201 });
}

function pickColor(seed = '') {
  const colors = ['#7C3AED', '#DB2777', '#F59E0B', '#10B981', '#3B82F6', '#EF4444'];
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return colors[h % colors.length];
}
