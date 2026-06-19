// Authentication helpers: password hashing + signed httpOnly cookie sessions.
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { readDB } from './db';

const SECRET = process.env.AUTH_SECRET || 'merchly-dev-secret-change-me';
const COOKIE = 'merchly_token';

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, name: user.name },
    SECRET,
    { expiresIn: '30d' }
  );
}

export function setAuthCookie(token) {
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearAuthCookie() {
  cookies().set(COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}

async function userFromToken(token) {
  if (!token) return null;
  let payload;
  try {
    payload = jwt.verify(token, SECRET);
  } catch {
    return null;
  }
  const db = await readDB();
  const user = db.users.find((u) => u.id === payload.sub);
  return sanitizeUser(user || null);
}

// For server components: reads the httpOnly cookie.
export async function getCurrentUser() {
  return userFromToken(cookies().get(COOKIE)?.value);
}

// For API route handlers: accepts a mobile "Authorization: Bearer <token>"
// header (native apps can't use httpOnly cookies) and falls back to the cookie
// used by the web client.
export async function getRequestUser(req) {
  const header = req?.headers?.get?.('authorization') || '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : null;
  return userFromToken(bearer || cookies().get(COOKIE)?.value);
}

export function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}
