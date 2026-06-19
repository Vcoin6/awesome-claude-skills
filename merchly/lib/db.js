// Tiny zero-dependency JSON datastore.
// For a demo/MVP this keeps everything runnable with no external database.
// In production swap this module for Postgres/Prisma — the call sites use a
// small, stable API (read/write/collection helpers) to make that easy.
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'merchly.json');

const DEFAULT_DB = {
  users: [],
  listings: [],
  orders: [],
};

let writeChain = Promise.resolve();

async function ensureFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.writeFile(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2));
  }
}

export async function readDB() {
  await ensureFile();
  const raw = await fs.readFile(DB_FILE, 'utf-8');
  try {
    return { ...DEFAULT_DB, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_DB };
  }
}

// Serialize writes so concurrent requests don't clobber the file.
export function writeDB(mutator) {
  writeChain = writeChain.then(async () => {
    const db = await readDB();
    const result = await mutator(db);
    await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2));
    return result;
  });
  return writeChain;
}

export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}
