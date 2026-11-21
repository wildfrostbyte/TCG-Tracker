// Card data for the app: bundled files first, then this device's cache, then TCGdex.
// Sets fetched from TCGdex are kept in the Cache API so they open instantly and offline next time
// (the type/rarity query is a POST, which the service worker can't cache on its own).

import { fetchIndex, fetchSet, searchCards as searchRemote } from './tcgdex.js';
import { state, updateMeta } from './store.js';

const DATA_CACHE = 'setgaps-data-v1';
const DAY = 24 * 60 * 60 * 1000;
const memory = new Map();

function cacheKey(name) {
  return new URL(`./__data/${encodeURIComponent(name)}`, location.href).href;
}

// Storage can be blocked or stall (private modes, broken profiles). Never let that hold up the app.
function withTimeout(promise, ms = 2000) {
  return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);
}

async function cacheGet(name) {
  try {
    return await withTimeout((async () => {
      const res = await (await caches.open(DATA_CACHE)).match(cacheKey(name));
      return res ? res.json() : null;
    })());
  } catch {
    return null;
  }
}

async function cachePut(name, data) {
  try {
    await withTimeout((async () => {
      const cache = await caches.open(DATA_CACHE);
      await cache.put(cacheKey(name), new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } }));
    })());
  } catch {
    // Private mode or storage blocked: the app still works, it just refetches.
  }
}

async function getLocalJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Couldn't load ${path}`);
  return res.json();
}

let bundledIds = [];

// The set list shown on Home. Uses whichever copy is newer: the bundled one or a refreshed one.
export async function loadIndex() {
  const bundled = await getLocalJSON('data/index.json');
  bundledIds = bundled.bundled || [];
  const refreshed = await cacheGet('index');
  const index = refreshed && refreshed.generated > bundled.generated ? { ...refreshed, bundled: bundledIds } : bundled;
  return prepareIndex(index);
}

// At most once a day, fetch TCGdex's current set list so new releases appear without a redeploy.
export async function refreshIndex() {
  if (!navigator.onLine || Date.now() - (state.meta.indexRefreshedAt || 0) < DAY) return null;
  try {
    const fresh = await fetchIndex();
    if (!fresh.series.length) return null;
    await cachePut('index', fresh);
    updateMeta({ indexRefreshedAt: Date.now() });
    return prepareIndex({ ...fresh, bundled: bundledIds });
  } catch {
    return null;
  }
}

function prepareIndex(index) {
  // rank: release order (series and sets are listed oldest first), used to sort newest first.
  const byId = new Map();
  let rank = 0;
  for (const serie of index.series) {
    for (const set of serie.sets) byId.set(set.id, { ...set, rank: rank++, serie: { id: serie.id, name: serie.name } });
  }
  return { ...index, byId };
}

export function isBundled(setId) {
  return bundledIds.includes(setId);
}

// Resolves to a set with cards, or rejects if it can't be loaded (e.g. offline and never opened).
// The in-progress load is shared, so opening a set twice quickly downloads it once.
export function getSet(setId) {
  if (!memory.has(setId)) {
    const loading = loadSet(setId);
    memory.set(setId, loading);
    loading.catch(() => memory.delete(setId)); // so "Try again" really tries again
  }
  return memory.get(setId);
}

async function loadSet(setId) {
  let set = null;
  if (isBundled(setId)) {
    try {
      set = await getLocalJSON(`data/sets/${encodeURIComponent(setId)}.json`);
    } catch {
      set = null;
    }
  }
  if (!set) {
    set = await cacheGet(`set:${setId}`);
    // Promo sets keep growing: refresh a cached copy in the background once it's a week old.
    if (set && Date.now() - Date.parse(set.fetchedAt || 0) > 7 * DAY && navigator.onLine) {
      fetchSet(setId).then((fresh) => cachePut(`set:${setId}`, fresh)).catch(() => {});
    }
  }
  if (!set) {
    set = await fetchSet(setId);
    await cachePut(`set:${setId}`, set);
  }
  return set;
}

export async function searchCards(query, signal) {
  const results = await searchRemote(query, signal);
  return Array.isArray(results) ? results : [];
}
