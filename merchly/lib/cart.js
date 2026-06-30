// Client-side cart, persisted in localStorage. Keeps the demo serverless-light;
// at checkout the cart is sent to the API which re-prices from the DB (never
// trusting client prices).
const KEY = 'merchly_cart_v1';

function read() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function write(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('merchly:cart'));
}

export function getCart() {
  return read();
}

export function cartCount() {
  return read().reduce((n, i) => n + i.qty, 0);
}

// Each cart line is keyed by listing + variant, so the same product in two
// sizes lives as two lines.
function lineKeyFor(listingId, variantId) {
  return `${listingId}__${variantId || 'default'}`;
}

export function addToCart(listing, qty = 1, variant = null) {
  const items = read();
  const lineKey = lineKeyFor(listing.id, variant?.id);
  const existing = items.find((i) => i.lineKey === lineKey);
  if (existing) {
    existing.qty += qty;
  } else {
    items.push({
      lineKey,
      id: listing.id,
      title: listing.title,
      priceCents: listing.priceCents,
      cover: listing.media?.[0]?.url || null,
      sellerName: listing.sellerName,
      variantId: variant?.id || null,
      variantLabel: variant?.label || null,
      qty,
    });
  }
  write(items);
}

export function updateQty(lineKey, qty) {
  const items = read().map((i) => (i.lineKey === lineKey ? { ...i, qty: Math.max(1, qty) } : i));
  write(items);
}

export function removeFromCart(lineKey) {
  write(read().filter((i) => i.lineKey !== lineKey));
}

export function clearCart() {
  write([]);
}
