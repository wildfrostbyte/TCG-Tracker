// SetGaps service worker: works offline and loads instantly.
// Bump VERSION on each deploy so phones pick up the new files on their next visit.

const VERSION = 'v19';
const SHELL = `setgaps-shell-${VERSION}`;
const IMAGES = 'setgaps-images';
const API = 'setgaps-api';
const MAX_IMAGES = 400;

const SHELL_FILES = [
  './',
  'index.html',
  'styles.css',
  'fonts/russo-one.woff2',
  'manifest.webmanifest',
  'js/theme.js',
  'js/app.js',
  'js/api.js',
  'js/tcgdex.js',
  'js/store.js',
  'js/share.js',
  'js/rarity.js',
  'js/install.js',
  'js/ui.js',
  'js/views/home.js',
  'js/views/set.js',
  'js/views/trades.js',
  'js/views/sheets.js',
  'data/index.json',
  'icons/icon.svg',
  'icons/card-back.svg',
  'icons/icon-192.png',
  'icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    await cache.addAll(SHELL_FILES.map((url) => new Request(url, { cache: 'reload' })));
    // The bundled sets are listed in data/index.json, so adding a set needs no change here.
    const index = await (await cache.match('data/index.json')).json();
    await cache.addAll((index.bundled || []).map((id) => new Request(`data/sets/${encodeURIComponent(id)}.json`, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('setgaps-shell-') && key !== SHELL) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    // Page loads always get the app shell, even offline.
    const key = request.mode === 'navigate' ? './' : request;
    event.respondWith(staleWhileRevalidate(event, SHELL, key));
  } else if (url.hostname === 'assets.tcgdex.net') {
    event.respondWith(cacheFirst(IMAGES, request));
  } else if (url.hostname === 'api.tcgdex.net') {
    event.respondWith(networkFirst(API, request));
  }
});

// Serve the cached copy now and refresh it in the background.
async function staleWhileRevalidate(event, cacheName, key) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(key, { ignoreSearch: true });
  const network = fetch(event.request)
    .then(async (res) => {
      if (res.ok) await cache.put(key, res.clone());
      return res;
    })
    .catch(() => null);
  // Keep the worker alive until the refreshed file is saved; browsers (iOS especially)
  // may otherwise stop it as soon as the cached copy has been returned.
  event.waitUntil(network);
  return cached || (await network) || new Response('Offline', { status: 503 });
}

async function cacheFirst(cacheName, request) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  // Only CORS responses: opaque ones count as ~7 MB each against storage.
  if (res.ok && res.type !== 'opaque') {
    await cache.put(request, res.clone());
    trim(cache, MAX_IMAGES);
  }
  return res;
}

async function networkFirst(cacheName, request) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(request);
    if (res.ok) await cache.put(request, res.clone());
    return res;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}

async function trim(cache, max) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}
