#!/usr/bin/env node
// Refreshes the card data bundled with the app (data/index.json and data/sets/*.json).
//
//   node scripts/snapshot.mjs            refresh the bundled sets below + the set list
//   node scripts/snapshot.mjs sv03.5     also bundle another set (add it to BUNDLED to keep it)
//
// Released sets rarely change. Re-run for promo sets (which keep growing) or TCGdex data fixes.

import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { fetchIndex, fetchSet } from '../js/tcgdex.js';

const BUNDLED = ['me06', '30th', 'me05', 'me03']; // Delta Reign, 30th Celebration, Pitch Black, Perfect Order

const dataDir = fileURLToPath(new URL('../data/', import.meta.url));
const ids = [...new Set([...BUNDLED, ...process.argv.slice(2)])];

await mkdir(`${dataDir}sets`, { recursive: true });

const index = await fetchIndex();
index.bundled = ids;
const known = new Set(index.series.flatMap((s) => s.sets.map((set) => set.id)));
for (const id of ids) {
  if (!known.has(id)) throw new Error(`Set "${id}" isn't in TCGdex's set list. Check the id at https://api.tcgdex.net/v2/en/sets`);
}
await writeFile(`${dataDir}index.json`, JSON.stringify(index));
console.log(`index.json: ${index.series.length} eras, ${known.size} sets`);

for (const id of ids) {
  const set = await fetchSet(id);
  const typed = set.cards.filter((c) => c[3]).length;
  const rarities = [...new Set(set.cards.map((c) => c[4] || '(none)'))].join(', ');
  if (set.cards.length !== set.total) {
    console.warn(`  warning: ${id} lists ${set.cards.length} cards but says total ${set.total}`);
  }
  await writeFile(`${dataDir}sets/${id}.json`, JSON.stringify(set));
  console.log(`sets/${id}.json: ${set.name}, ${set.cards.length} cards (${set.official} printed), ${typed} typed. Rarities: ${rarities}`);
}
