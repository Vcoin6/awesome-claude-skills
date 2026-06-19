import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';

// GET /api/auth/me — returns the current user (cookie or Bearer token).
export async function GET(req) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ user: null }, { status: 200 });
  return NextResponse.json({ user });
}
