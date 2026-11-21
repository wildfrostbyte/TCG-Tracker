// Your collection, an optional friend's collection, and bookkeeping (backups, prompts).
// Everything lives in this browser's localStorage; backups and share links move it elsewhere.

const KEYS = { mine: 'setgaps:collection', friend: 'setgaps:friend', meta: 'setgaps:meta' };
const MAX_COUNT = 999;
// Far above any real collection (TCGdex has ~220 English sets, the biggest ~300 cards), low enough
// that a crafted link or file can't make the app chew through millions of entries.
const MAX_SETS = 1000;
const MAX_CARDS_PER_SET = 2000;
const BAD_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export function emptyCollection(owner = '') {
  return { app: 'setgaps', version: 1, owner, updated: null, sets: {} };
}

// Validates anything imported (files, links, storage). Throws a readable message.
export function normalize(raw) {
  if (!raw || typeof raw !== 'object' || !raw.sets || typeof raw.sets !== 'object' || Array.isArray(raw.sets)) {
    throw new Error("That isn't a SetGaps collection.");
  }
  const out = emptyCollection(typeof raw.owner === 'string' ? raw.owner.trim().slice(0, 40) : '');
  out.updated = typeof raw.updated === 'string' ? raw.updated : null;
  const setEntries = Object.entries(raw.sets);
  if (setEntries.length > MAX_SETS) throw new Error('That collection is too big to be real.');
  for (const [setId, cards] of setEntries) {
    if (!validKey(setId) || !cards || typeof cards !== 'object') continue;
    const cardEntries = Object.entries(cards);
    if (cardEntries.length > MAX_CARDS_PER_SET) throw new Error('That collection is too big to be real.');
    const clean = {};
    for (const [localId, n] of cardEntries) {
      const count = Math.min(MAX_COUNT, Math.floor(Number(n)));
      if (validKey(localId) && count > 0) clean[localId] = count;
    }
    if (Object.keys(clean).length) out.sets[setId] = clean;
  }
  return out;
}

function validKey(key) {
  return typeof key === 'string' && key.length > 0 && key.length <= 40 && !BAD_KEYS.has(key);
}

function read(key) {
  try {
    const text = localStorage.getItem(key);
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function loadCollection(key) {
  const raw = read(key);
  if (!raw) return null;
  try {
    return normalize(raw);
  } catch {
    return null;
  }
}

const META_DEFAULTS = {
  changed: {}, // { setId: { localId: 1 } } cards changed since the last backup
  lastBackupAt: null,
  firstChangeAt: null,
  installDismissals: 0,
  installSnoozeUntil: 0,
  indexRefreshedAt: 0,
};

export const state = {
  mine: loadCollection(KEYS.mine) || emptyCollection(),
  friend: loadCollection(KEYS.friend),
  meta: { ...META_DEFAULTS, ...(read(KEYS.meta) || {}) },
};

const listeners = new Set();
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emit(event) {
  for (const fn of listeners) fn(event);
}

let saveTimer = null;
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 250);
}
export function save() {
  clearTimeout(saveTimer);
  try {
    localStorage.setItem(KEYS.mine, JSON.stringify(state.mine));
    if (state.friend) localStorage.setItem(KEYS.friend, JSON.stringify(state.friend));
    else localStorage.removeItem(KEYS.friend);
    localStorage.setItem(KEYS.meta, JSON.stringify(state.meta));
  } catch {
    emit({ type: 'saveError' });
  }
}
addEventListener('pagehide', save);
document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && save());

// Another tab (or the installed app on desktop/Android) saved: pick up its changes instead of
// overwriting them with this tab's older copy on the next save.
addEventListener('storage', (e) => {
  if (e.key === KEYS.mine) state.mine = loadCollection(KEYS.mine) || emptyCollection();
  else if (e.key === KEYS.friend) state.friend = loadCollection(KEYS.friend);
  else if (e.key === KEYS.meta) state.meta = { ...META_DEFAULTS, ...(read(KEYS.meta) || {}) };
  else if (e.key === null) { // localStorage.clear() in another tab
    state.mine = emptyCollection();
    state.friend = null;
    state.meta = { ...META_DEFAULTS };
  } else return;
  emit({ type: 'replace' });
});

export function count(col, setId, localId) {
  return col?.sets[setId]?.[localId] || 0;
}

export function setCount(setId, localId, n) {
  const next = Math.max(0, Math.min(MAX_COUNT, n));
  const sets = state.mine.sets;
  if (next > 0) (sets[setId] ||= {})[localId] = next;
  else if (sets[setId]) {
    delete sets[setId][localId];
    if (!Object.keys(sets[setId]).length) delete sets[setId];
  }
  state.mine.updated = new Date().toISOString();
  const meta = state.meta;
  (meta.changed[setId] ||= {})[localId] = 1;
  meta.firstChangeAt ||= Date.now();
  scheduleSave();
  emit({ type: 'count', setId, localId, n: next });
}

export function setOwner(name) {
  state.mine.owner = name.trim().slice(0, 40);
  scheduleSave();
}

export function changeCount() {
  return Object.values(state.meta.changed).reduce((sum, cards) => sum + Object.keys(cards).length, 0);
}

export function changedSetIds() {
  return Object.keys(state.meta.changed);
}

export function markBackedUp() {
  state.meta.changed = {};
  state.meta.lastBackupAt = Date.now();
  save();
  emit({ type: 'backup' });
}

export function updateMeta(patch) {
  Object.assign(state.meta, patch);
  scheduleSave();
}

// Replaces everything. Only a restored backup (your own file or link) counts as "backed up";
// taking over a friend's collection doesn't.
export function replaceMine(col, { fromBackup = false } = {}) {
  state.mine = normalize(col);
  state.meta.changed = {};
  if (fromBackup) state.meta.lastBackupAt = Date.now();
  save();
  emit({ type: 'replace' });
}

// Keeps the higher count of each card. Returns how many cards changed.
export function mergeIntoMine(col) {
  const incoming = normalize(col);
  let changed = 0;
  for (const [setId, cards] of Object.entries(incoming.sets)) {
    for (const [localId, n] of Object.entries(cards)) {
      if (n > count(state.mine, setId, localId)) {
        (state.mine.sets[setId] ||= {})[localId] = n;
        (state.meta.changed[setId] ||= {})[localId] = 1;
        changed++;
      }
    }
  }
  if (!state.mine.owner && incoming.owner) state.mine.owner = incoming.owner;
  if (changed) state.mine.updated = new Date().toISOString();
  save();
  emit({ type: 'replace' });
  return changed;
}

export function setFriend(col) {
  state.friend = col ? normalize(col) : null;
  save();
  emit({ type: 'friend' });
}

export function friendName() {
  return state.friend ? state.friend.owner || 'Friend' : null;
}

// Have / spares for one set, counted from the collection alone (no card list needed).
export function setStats(col, setId) {
  let have = 0;
  let spares = 0;
  for (const n of Object.values(col?.sets[setId] || {})) {
    have++;
    spares += n - 1;
  }
  return { have, spares };
}

export function collectionSize(col) {
  let cards = 0;
  for (const cardsInSet of Object.values(col.sets)) for (const n of Object.values(cardsInSet)) cards += n;
  return { cards, sets: Object.keys(col.sets).length };
}

// The one trade rule, used everywhere (Trades screen, set filters, tile outlines, card sheet).
// 'get': you have none and they have a spare. 'give': they have none and you have a spare.
export function tradeStatus(mineCount, theirCount) {
  if (!mineCount && theirCount >= 2) return 'get';
  if (!theirCount && mineCount >= 2) return 'give';
  return null;
}

export function tradeLists(mine, friend, setId) {
  const a = mine?.sets[setId] || {};
  const b = friend?.sets[setId] || {};
  const get = Object.keys(b).filter((id) => tradeStatus(a[id], b[id]) === 'get');
  const give = Object.keys(a).filter((id) => tradeStatus(a[id], b[id]) === 'give');
  const byNumber = (x, y) => x.localeCompare(y, undefined, { numeric: true });
  return { get: get.sort(byNumber), give: give.sort(byNumber) };
}

export function tradeTotals(mine, friend) {
  const ids = new Set([...Object.keys(mine?.sets || {}), ...Object.keys(friend?.sets || {})]);
  const perSet = [];
  let get = 0;
  let give = 0;
  for (const setId of ids) {
    const t = tradeLists(mine, friend, setId);
    if (t.get.length || t.give.length) perSet.push({ setId, ...t });
    get += t.get.length;
    give += t.give.length;
  }
  return { get, give, perSet };
}
