// API client for the Merchly backend (the same Next.js API the web app uses).
// The base URL is configurable via app.json -> expo.extra.apiUrl, or the
// EXPO_PUBLIC_API_URL env var. Point it at your deployed server in production.
import Constants from 'expo-constants';

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiUrl ||
  'http://localhost:3000';

// Native clients authenticate with a Bearer token (set after login/register).
let authToken = null;
export function setAuthToken(token) {
  authToken = token;
}

async function request(path, { method = 'GET', body, headers = {}, isForm = false } = {}) {
  const opts = { method, headers: { ...headers } };
  if (authToken) opts.headers.Authorization = `Bearer ${authToken}`;
  if (body && !isForm) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  } else if (body && isForm) {
    opts.body = body; // FormData; let fetch set the multipart boundary
  }

  const res = await fetch(`${API_URL}${path}`, opts);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  // Auth
  register: (payload) => request('/api/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/api/auth/login', { method: 'POST', body: payload }),
  me: () => request('/api/auth/me'),

  // Config (Stripe mode + publishable key)
  config: () => request('/api/config'),

  // Listings
  listings: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/listings${qs ? `?${qs}` : ''}`);
  },
  listing: (id) => request(`/api/listings/${id}`),
  createListing: (payload) => request('/api/listings', { method: 'POST', body: payload }),
  deleteListing: (id) => request(`/api/listings/${id}`, { method: 'DELETE' }),

  // Media upload (FormData of { files })
  upload: (formData) => request('/api/upload', { method: 'POST', body: formData, isForm: true }),

  // Checkout + payouts
  checkout: (payload) => request('/api/checkout', { method: 'POST', body: payload }),
  onboard: () => request('/api/seller/onboard', { method: 'POST' }),
  sellerOrders: () => request('/api/seller/orders'),
};

export function mediaUrl(path) {
  if (!path) return null;
  return path.startsWith('http') ? path : `${API_URL}${path}`;
}

export function formatMoney(cents) {
  return `$${((cents || 0) / 100).toFixed(2)}`;
}
