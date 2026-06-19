// Display helpers shared by client and server components.
export function formatMoney(cents, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format((cents || 0) / 100);
}

export function timeAgo(iso) {
  const then = new Date(iso).getTime();
  const secs = Math.floor((Date.now() - then) / 1000);
  const units = [
    ['y', 31536000],
    ['mo', 2592000],
    ['w', 604800],
    ['d', 86400],
    ['h', 3600],
    ['m', 60],
  ];
  for (const [label, size] of units) {
    const v = Math.floor(secs / size);
    if (v >= 1) return `${v}${label} ago`;
  }
  return 'just now';
}
