import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';
import { verifyPassword, signToken, setAuthCookie, sanitizeUser } from '@/lib/auth';

export async function POST(req) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const db = await readDB();
  const user = db.users.find((u) => u.email === String(email).trim().toLowerCase());
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }
  if (user.suspended) {
    return NextResponse.json({ error: 'This account has been suspended. Contact support.' }, { status: 403 });
  }

  const token = signToken(user);
  setAuthCookie(token);
  // `token` is for native mobile clients (Bearer auth); web uses the cookie.
  return NextResponse.json({ user: sanitizeUser(user), token });
}
