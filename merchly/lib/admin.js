// Admin gating. A user is an admin if their record has isAdmin: true, or their
// email is listed in the ADMIN_EMAILS env var (comma-separated). This lets you
// grant admin access by configuration without a separate signup flow.
export function isAdmin(user) {
  if (!user) return false;
  if (user.isAdmin) return true;
  const allow = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes((user.email || '').toLowerCase());
}
