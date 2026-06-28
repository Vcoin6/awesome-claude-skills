// Datastore with two interchangeable backends, auto-selected at runtime:
//
//   • Vercel KV (Redis) — used in production when KV_REST_API_URL is present.
//     Serverless filesystems are read-only/ephemeral, so the whole DB object is
//     stored under a single KV key with serialized read-modify-write.
//   • Local JSON file — zero-config default for `npm run dev`.
//
// Both backends expose the same tiny API (readDB / writeDB / uid) so call sites
// never change. For very high scale, swap KV for Postgres behind this same API.
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'merchly.json');
const KV_KEY = 'merchly:db';

const DEFAULT_DB = {
  users: [],
  listings: [],
  orders: [],
  reviews: [],
  favorites: [],        // { id, userId, listingId, createdAt }
  notifications: [],     // { id, userId, type, title, body, url, read, createdAt }
  messages: [],          // { id, threadId, fromId, toId, listingId, text, createdAt }
  pushSubscriptions: [], // { id, userId, subscription, createdAt }
};

const useKV = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

let writeChain = Promise.resolve();
let _kv = null;

async function getKV() {
  if (!_kv) _kv = (await import('@vercel/kv')).kv;
  return _kv;
}

// ── Reads ──
export async function readDB() {
  if (useKV) {
    const kv = await getKV();
    const data = await kv.get(KV_KEY);
    return data ? { ...DEFAULT_DB, ...data } : { ...DEFAULT_DB };
  }
  return readFile();
}

async function readFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(DB_FILE, 'utf-8');
    return { ...DEFAULT_DB, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_DB };
  }
}

// ── Writes (serialized so concurrent requests don't clobber each other) ──
export function writeDB(mutator) {
  writeChain = writeChain.then(async () => {
    const db = await readDB();
    const result = await mutator(db);
    if (useKV) {
      const kv = await getKV();
      await kv.set(KV_KEY, db);
    } else {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2));
    }
    return result;
  });
  return writeChain;
}

export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}
