// SetGaps: start-up, routing (#/, #/set/<id>, #/trades), share links (#s=...) and the bottom banners.

import { loadIndex, refreshIndex } from './api.js';
import { state, subscribe, changeCount, changedSetIds } from './store.js';
import { parseCollectionText } from './share.js';
import { h, toast, plural, afterSheetHistory } from './ui.js';
import { isInstalled, detectPlatform, installGuide } from './install.js';
import { renderHome } from './views/home.js';
import { renderSet } from './views/set.js';
import { renderTrades } from './views/trades.js';
import { openIncoming, openInstallSheet, saveBackup } from './views/sheets.js';

const app = document.getElementById('app');
const bannerRoot = document.getElementById('banner-root');

export const ctx = {
  index: null,
  route: { name: 'home', params: new URLSearchParams() },
  home: { tab: 'mine', q: '', scroll: 0 },
  cleanup: null,
  backupDismissedAt: -1, // change count when "Later" was tapped, this session only
  installShown: false,
  // Waits for a closing sheet's history step so it can't undo this navigation.
  go(hash) {
    afterSheetHistory(() => {
      if (location.hash === hash) render();
      else location.hash = hash;
    });
  },
  // Top bar back button: the previous screen, else Home (e.g. opened from a link).
  backLink() {
    const previous = trail.length > 1 ? trail[trail.length - 2] : null;
    const toTrades = previous?.startsWith('#/trades');
    return {
      href: previous || '#/',
      label: toTrades ? 'Back to trades' : 'Back to sets',
      go: () => {
        if (previous) return history.back();
        trail.length = 0; // replace() swaps this entry for Home rather than adding one
        location.replace('#/');
      },
    };
  },
  render,
  setInfo(id) {
    return ctx.index?.byId.get(id) || null;
  },
  setName(id) {
    return ctx.setInfo(id)?.name || id;
  },
};

// Screens visited this session, newest last. Arriving at the previous one counts as going back.
const trail = [];
function recordVisit() {
  const hash = location.hash || '#/';
  if (trail.length > 1 && trail[trail.length - 2] === hash) trail.pop();
  else if (trail[trail.length - 1] !== hash) trail.push(hash);
}

function parseRoute() {
  const [path, query] = (location.hash.slice(1) || '/').split('?');
  const params = new URLSearchParams(query || '');
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'set' && parts[1]) return { name: 'set', id: decodeURIComponent(parts[1]), params };
  if (parts[0] === 'trades') return { name: 'trades', params };
  return { name: 'home', params };
}

function render() {
  const previous = ctx.route;
  if (previous.name === 'home') ctx.home.scroll = scrollY;
  ctx.cleanup?.();
  ctx.cleanup = null;
  ctx.route = parseRoute();
  let view;
  try {
    if (ctx.route.name === 'set') view = renderSet(ctx, ctx.route);
    else if (ctx.route.name === 'trades') view = renderTrades(ctx);
    else view = renderHome(ctx);
  } catch (err) {
    // A blank screen makes people think their collection is gone. It isn't: say so.
    console.error(err);
    view = h('div', { class: 'view' },
      h('div', { class: 'empty' },
        h('h2', null, 'Something went wrong'),
        h('p', { class: 'muted' }, 'Your collection is safe on this device.'),
        h('a', { class: 'btn', href: '#/' }, 'Back to sets')));
  }
  app.replaceChildren(view);
  const sameView = previous.name === ctx.route.name && previous.id === ctx.route.id;
  if (!sameView) scrollTo(0, ctx.route.name === 'home' ? ctx.home.scroll : 0);
  updateBanners();
}

// ---- Banners: backup reminder first; the install prompt only when there's nothing to back up ----

function updateBanners() {
  bannerRoot.replaceChildren();
  document.body.classList.remove('has-banner');
  if (ctx.route.name !== 'home' || !ctx.index) return;
  const changes = changeCount();
  if (changes > 0 && changes !== ctx.backupDismissedAt) {
    bannerRoot.append(backupBanner(changes));
    document.body.classList.add('has-banner');
    return;
  }
  maybePromptInstall();
}

function backupBanner(changes) {
  const sets = changedSetIds();
  const where = sets.length === 1 ? ` in ${ctx.setName(sets[0])}` : '';
  const detail = state.meta.lastBackupAt
    ? 'Save a backup so they’re safe if this device’s data is cleared.'
    : 'You haven’t saved a backup yet. One file keeps your whole collection safe.';
  return h('div', { class: 'banner', role: 'region', 'aria-label': 'Backup reminder' },
    h('div', { class: 'banner-text' },
      h('span', { class: 'dot', 'aria-hidden': 'true' }),
      h('div', null, h('strong', null, `You changed ${plural(changes, 'card')}${where}`), h('span', null, detail)),
    ),
    h('div', { class: 'banner-actions' },
      h('button', { type: 'button', class: 'btn on-dark-ghost', onclick: () => { ctx.backupDismissedAt = changeCount(); updateBanners(); } }, 'Later'),
      h('button', { type: 'button', class: 'btn on-dark', onclick: () => saveBackup() }, 'Save backup'),
    ),
  );
}

function maybePromptInstall() {
  const meta = state.meta;
  if (ctx.installShown || isInstalled() || !meta.firstChangeAt) return;
  if (Date.now() < (meta.installSnoozeUntil || 0) || (meta.installDismissals || 0) >= 3) return;
  if (!installGuide(detectPlatform())) return;
  ctx.installShown = true;
  setTimeout(() => {
    const busy = document.getElementById('sheet-root').childElementCount > 0;
    if (!busy && ctx.route.name === 'home') openInstallSheet(ctx, { auto: true });
  }, 700);
}

// ---- Share links: #s=<payload> opens the "X shared their collection" sheet ----

async function onHashChange() {
  const match = location.hash.match(/^#s=([A-Za-z0-9_-]+)/);
  if (!match) {
    recordVisit();
    render();
    return;
  }
  history.replaceState(null, '', `${location.pathname}${location.search}#/`);
  recordVisit();
  render();
  try {
    openIncoming(ctx, await parseCollectionText(`#s=${match[1]}`));
  } catch (err) {
    toast(err.message, 6000);
  }
}

subscribe((event) => {
  if (['backup', 'replace', 'friend'].includes(event.type)) render();
  if (event.type === 'count' && changeCount() === 1) navigator.storage?.persist?.().catch(() => {});
  if (event.type === 'saveError') toast('Couldn’t save on this device (storage full or blocked). Save a backup now.', 6000);
});

async function start() {
  try {
    ctx.index = await loadIndex();
  } catch {
    app.replaceChildren(h('div', { class: 'empty' }, h('h1', null, 'SetGaps couldn’t start'), h('p', null, 'The set list didn’t load. Check your connection and reload.')));
    return;
  }
  addEventListener('hashchange', onHashChange);
  await onHashChange();
  refreshIndex().then((fresh) => {
    if (!fresh) return;
    ctx.index = fresh;
    if (ctx.route.name === 'home' && !document.activeElement?.matches('input')) render();
  });
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

start();
