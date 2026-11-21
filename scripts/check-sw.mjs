#!/usr/bin/env node
// Checks that sw.js precaches every app file, so offline mode can't silently break.
//
//   node scripts/check-sw.mjs
//
// Run before deploying (after adding or renaming a file in js/). Exits with an error listing
// files missing from SHELL_FILES, or listed there but not on disk.

import { readFile, readdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const sw = await readFile(`${root}sw.js`, 'utf8');
const listed = new Set([...sw.match(/const SHELL_FILES = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map((m) => m[1]));

async function filesIn(dir) {
  const out = [];
  for (const entry of await readdir(`${root}${dir}`, { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) out.push(...(await filesIn(path)));
    else out.push(path);
  }
  return out;
}

const required = ['index.html', 'styles.css', 'manifest.webmanifest', 'data/index.json', ...(await filesIn('js'))];
const missing = required.filter((f) => !listed.has(f));
const gone = [];
for (const f of listed) {
  if (f === './') continue;
  try {
    await access(`${root}${f}`);
  } catch {
    gone.push(f);
  }
}

if (missing.length || gone.length) {
  if (missing.length) console.error(`Not precached in sw.js SHELL_FILES (won't work offline):\n  ${missing.join('\n  ')}`);
  if (gone.length) console.error(`Listed in sw.js SHELL_FILES but not on disk (service worker install will fail):\n  ${gone.join('\n  ')}`);
  process.exit(1);
}
console.log(`sw.js precaches all ${required.length} app files.`);
