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

// ── Media uploads ────────────────────────────────────────────────────────────
// Mirrors the web app: when the backend has Vercel Blob configured, upload each
// file DIRECTLY to Blob (bypassing the serverless ~4.5MB body limit, so large
// videos work). Otherwise fall back to multipart through /api/upload.
let _configCache;
async function getConfig() {
  if (!_configCache) _configCache = api.config().catch(() => ({}));
  return _configCache;
}

function guessType(asset) {
  const isVideo = asset.type === 'video';
  return {
    isVideo,
    name: asset.fileName || `upload.${isVideo ? 'mp4' : 'jpg'}`,
    contentType: asset.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg'),
  };
}

// Accepts expo-image-picker assets; returns [{ url, type, size }].
export async function uploadAssets(assets) {
  const cfg = await getConfig();

  if (cfg.blobEnabled) {
    const { upload } = await import('@vercel/blob/client');
    const out = [];
    for (const asset of assets) {
      const { isVideo, name, contentType } = guessType(asset);
      // Pull the local file into a Blob the uploader can stream.
      const fileBlob = await (await fetch(asset.uri)).blob();
      const result = await upload(name, fileBlob, {
        access: 'public',
        contentType,
        handleUploadUrl: `${API_URL}/api/upload/blob`,
        // No cookie on native — pass the JWT so the broker can authenticate us.
        clientPayload: authToken || '',
      });
      out.push({ url: result.url, type: isVideo ? 'video' : 'image', size: asset.fileSize || 0 });
    }
    return out;
  }

  // Fallback: multipart to the server (filesystem/dev).
  const form = new FormData();
  for (const asset of assets) {
    const { name, contentType } = guessType(asset);
    form.append('files', { uri: asset.uri, name, type: contentType });
  }
  const res = await api.upload(form);
  return res.media;
}

export function mediaUrl(path) {
  if (!path) return null;
  return path.startsWith('http') ? path : `${API_URL}${path}`;
}

export function formatMoney(cents) {
  return `$${((cents || 0) / 100).toFixed(2)}`;
}
