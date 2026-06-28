// CI sanity check for the Expo app: Babel-parses every source file to catch
// syntax/JSX errors without needing the full React Native toolchain installed.
// Usage: node scripts/ci-parse.mjs   (requires @babel/core + @babel/preset-react)
import babel from '@babel/core';
import { readdirSync } from 'fs';
import path from 'path';

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === 'node_modules' ? [] : walk(p);
    return p.endsWith('.js') || p.endsWith('.jsx') ? [p] : [];
  });
}

const files = [...walk('app'), ...walk('src')];
let failed = 0;
for (const f of files) {
  try {
    babel.transformFileSync(f, { presets: ['@babel/preset-react'] });
  } catch (e) {
    failed++;
    console.error(`FAIL ${f}\n  ${e.message.split('\n')[0]}`);
  }
}

if (failed) {
  console.error(`\n✗ ${failed}/${files.length} file(s) failed to parse`);
  process.exit(1);
}
console.log(`✓ All ${files.length} files parse cleanly`);
