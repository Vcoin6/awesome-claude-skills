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

export function addToCart(listing, qty = 1) {
  const items = read();
  const existing = items.find((i) => i.id === listing.id);
  if (existing) {
    existing.qty += qty;
  } else {
    items.push({
      id: listing.id,
      title: listing.title,
      priceCents: listing.priceCents,
      cover: listing.media?.[0]?.url || null,
      sellerName: listing.sellerName,
      qty,
    });
  }
  write(items);
}

export function updateQty(id, qty) {
  const items = read().map((i) => (i.id === id ? { ...i, qty: Math.max(1, qty) } : i));
  write(items);
}

export function removeFromCart(id) {
  write(read().filter((i) => i.id !== id));
}

export function clearCart() {
  write([]);
}
