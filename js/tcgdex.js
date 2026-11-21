// TCGdex client shared by the app (browser) and scripts/snapshot.mjs (Node 18+).
// Card data: https://tcgdex.dev, free, no API key.

export const API = 'https://api.tcgdex.net/v2';
const ASSETS = 'https://assets.tcgdex.net';
const LANG = 'en';

export const TYPES = ['Grass', 'Fire', 'Water', 'Lightning', 'Psychic', 'Fighting', 'Darkness', 'Metal', 'Dragon', 'Fairy', 'Colorless'];
const CATEGORY = { Pokemon: 'P', Trainer: 'T', Energy: 'E' };

// On a weak signal a request can hang for minutes. Give up so the app can show "Try again".
const TIMEOUT_MS = 15000;
const timeoutSignal = () => AbortSignal.timeout?.(TIMEOUT_MS);

// The timeout, plus the caller's own cancel signal when given (e.g. a newer search replaced this one).
function requestSignal(signal) {
  const timeout = timeoutSignal();
  if (!signal || !timeout) return signal || timeout;
  return AbortSignal.any ? AbortSignal.any([signal, timeout]) : signal;
}

async function getJSON(url, signal) {
  const res = await fetch(url, { signal: requestSignal(signal) });
  if (!res.ok) throw new Error(`TCGdex returned ${res.status} for ${url}`);
  return res.json();
}

async function graphql(query) {
  const res = await fetch(`${API}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
    signal: timeoutSignal(),
  });
  if (!res.ok) throw new Error(`TCGdex GraphQL returned ${res.status}`);
  const body = await res.json();
  if (!body.data && body.errors?.length) throw new Error(body.errors[0].message);
  return body.data;
}

// Every era ("series") with its sets, as listed by TCGdex (oldest first).
export async function fetchIndex() {
  const list = await getJSON(`${API}/${LANG}/series`);
  const details = await Promise.all(
    list.map((s) => getJSON(`${API}/${LANG}/series/${encodeURIComponent(s.id)}`).catch(() => null)),
  );
  const series = details.filter(Boolean).map((s) => ({
    id: s.id,
    name: s.name,
    releaseDate: s.releaseDate || '',
    sets: (s.sets || []).map((set) => ({
      id: set.id,
      name: set.name,
      official: set.cardCount?.official ?? 0,
      total: set.cardCount?.total ?? 0,
      ...(set.logo ? { logo: set.logo } : {}),
    })),
  }));
  return { generated: new Date().toISOString(), series };
}

// One set with every card as a compact row: [localId, name, category, type, rarity, imageBase].
export async function fetchSet(setId) {
  const set = await getJSON(`${API}/${LANG}/sets/${encodeURIComponent(setId)}`);
  // Types and rarities are optional extras: without them tiles are simply grey.
  const details = await fetchCardDetails(setId).catch(() => new Map());
  const cards = (set.cards || [])
    .map((c) => {
      const d = details.get(c.id) || {};
      return [c.localId, c.name, CATEGORY[d.category] || '', cardType(d, c.name), d.rarity || '', c.image || ''];
    })
    .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));
  return {
    id: set.id,
    name: set.name,
    serie: set.serie ? { id: set.serie.id, name: set.serie.name } : null,
    releaseDate: set.releaseDate || '',
    official: set.cardCount?.official ?? 0,
    total: set.cardCount?.total ?? cards.length,
    fetchedAt: new Date().toISOString(),
    cards,
  };
}

// The id filter is a "contains" match, so "30th-" also returns 30th Classic Collection
// ("30th-c-009"). Results are keyed by full card id, and callers only look up their own set's ids.
// Page size isn't reliable, so keep paging until a page adds nothing new.
async function fetchCardDetails(setId) {
  const byId = new Map();
  for (let page = 1; page <= 40; page++) {
    const data = await graphql(
      `{ cards(filters:{id:${JSON.stringify(`${setId}-`)}}, pagination:{page:${page},count:100}) { id category types rarity } }`,
    );
    const rows = data?.cards || [];
    let added = 0;
    for (const row of rows) {
      if (row && !byId.has(row.id)) {
        byId.set(row.id, row);
        added++;
      }
    }
    if (!added) break;
  }
  return byId;
}

function cardType(details, name) {
  if (details.types?.length) return details.types[0];
  // Energy cards carry no type; "Nitro Fire Energy" is still a Fire card.
  if (details.category === 'Energy') return TYPES.find((t) => name.includes(t)) || '';
  return '';
}

// Name search across every set. Returns [{ id, localId, name, image }].
export async function searchCards(name, signal) {
  return getJSON(`${API}/${LANG}/cards?name=${encodeURIComponent(name)}`, signal);
}

// Set logo URLs to try in order. New sets often have a logo on the asset server before the API
// lists it, so fall back to the usual path. Some logos exist only as PNG.
export function setLogoUrls(set) {
  const base = set.logo || (set.serie?.id ? `${ASSETS}/${LANG}/${encodeURIComponent(set.serie.id)}/${encodeURIComponent(set.id)}/logo` : '');
  return base ? [`${base}.webp`, `${base}.png`] : [];
}

// "sv03.5-001" with localId "001" belongs to set "sv03.5".
export function setIdOf(cardId, localId) {
  return cardId.slice(0, cardId.length - localId.length - 1);
}
