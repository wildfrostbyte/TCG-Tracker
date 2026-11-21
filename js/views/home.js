// Home: your sets (or every set), search across sets and cards, and the friend banner.

import { state, setStats, changeCount, count, friendName, tradeTotals } from '../store.js';
import { searchCards } from '../api.js';
import { setIdOf } from '../tcgdex.js';
import { cardNumber } from '../rarity.js';
import { h, icon, setRow, avatar, plural, tradeLabels, segmented, DISCLAIMER } from '../ui.js';
import { openMenu } from './sheets.js';

export function renderHome(ctx) {
  const s = ctx.home;
  const changes = changeCount();

  const header = h('header', { class: 'top' },
    h('h1', { class: 'brand' }, h('span', { class: 'wordmark' }, 'Set Gaps')),
    h('button', { type: 'button', class: 'icon-btn menu-btn', 'aria-label': changes ? 'Menu, changes not backed up' : 'Menu', onclick: () => openMenu(ctx) },
      icon('menu'), changes ? h('span', { class: 'dot', 'aria-hidden': 'true' }) : null),
  );

  const search = h('input', { type: 'search', placeholder: 'Search sets or cards', 'aria-label': 'Search sets or cards', value: s.q, autocomplete: 'off', enterkeyhint: 'search' });
  const tabs = segmented({
    label: 'Which sets to show',
    options: [{ id: 'mine', label: 'My sets' }, { id: 'all', label: 'All sets' }],
    current: s.tab,
    onChange: (tab) => {
      s.tab = tab;
      drawSets();
    },
  });
  const controls = h('div', { class: 'controls' }, h('label', { class: 'search' }, icon('search', 18), search), tabs);

  const cardsEl = h('section', { class: 'card-results', 'aria-live': 'polite' });
  const listEl = h('div', { class: 'home-list' });

  let searchTimer = null;
  let searchAbort = null; // the in-flight card search, cancelled when a newer one starts
  search.addEventListener('input', () => {
    s.q = search.value;
    drawSets();
    clearTimeout(searchTimer);
    searchTimer = setTimeout(drawCards, 400);
  });

  function drawSets() {
    listEl.replaceChildren(...setGroups(ctx, s));
  }

  const cardsNote = (text) => cardsEl.replaceChildren(h('h2', { class: 'group-title' }, 'Cards'), h('p', { class: 'muted small pad' }, text));

  async function drawCards() {
    const q = s.q.trim();
    searchAbort?.abort();
    searchAbort = null;
    if (q.length < 3) {
      cardsEl.replaceChildren();
      return;
    }
    if (!navigator.onLine) {
      cardsNote('Card search needs an internet connection.');
      return;
    }
    cardsNote('Searching cards…');
    const abort = (searchAbort = new AbortController());
    let results;
    try {
      results = await searchCards(q, abort.signal);
    } catch {
      if (!abort.signal.aborted) cardsNote('Card search isn’t available right now.');
      return;
    }
    if (abort.signal.aborted) return;
    const rows = results
      .map((card) => ({ card, setId: setIdOf(card.id, card.localId) }))
      .map((r) => ({ ...r, info: ctx.setInfo(r.setId) }))
      .sort((a, b) => (b.info?.rank ?? -1) - (a.info?.rank ?? -1))
      .slice(0, 40);
    cardsEl.replaceChildren(
      h('h2', { class: 'group-title' }, `Cards${results.length > 40 ? ' (newest 40)' : ''}`),
      rows.length
        ? h('div', { class: 'list' }, rows.map(({ card, setId, info }) => {
          const n = count(state.mine, setId, card.localId);
          return h('a', { class: 'list-row', href: `#/set/${encodeURIComponent(setId)}?card=${encodeURIComponent(card.localId)}` },
            h('span', { class: 'list-main' },
              h('span', { class: 'strong' }, card.name),
              h('span', { class: 'muted small' }, `${info?.name || setId} · ${cardNumber(card.localId, info?.official)}`)),
            n ? h('span', { class: 'pill' }, n > 1 ? `×${n}` : 'Have') : null,
            icon('next', 18));
        }))
        : h('p', { class: 'muted small pad' }, `No cards named “${q}”.`),
    );
  }

  drawSets();
  if (s.q.trim().length >= 3) drawCards();
  ctx.cleanup = () => {
    clearTimeout(searchTimer);
    searchAbort?.abort();
  };

  return h('div', { class: 'view home' }, header, controls, friendBanner(), cardsEl, listEl,
    h('footer', { class: 'footer muted small' }, DISCLAIMER));
}

// "Ash can give you 30 cards · You can give Ash 4 cards", skipping a side with nothing to swap.
function swapSummary(name, { get, give }) {
  if (!get && !give) return 'No swaps yet';
  const label = tradeLabels(name);
  return [
    get ? `${label.get} ${plural(get, 'card')}` : null,
    give ? `${label.give} ${plural(give, 'card')}` : null,
  ].filter(Boolean).join(' · ');
}

function friendBanner() {
  if (!state.friend) return null;
  const name = friendName();
  const t = tradeTotals(state.mine, state.friend);
  return h('a', { class: 'friend-banner', href: '#/trades' },
    avatar(name),
    h('span', { class: 'list-main' },
      h('span', { class: 'strong' }, `Comparing with ${name}`),
      h('span', { class: 'small' }, swapSummary(name, t))),
    h('span', { class: 'link-text' }, 'Trades ›'),
  );
}

function setGroups(ctx, s) {
  const q = s.q.trim().toLowerCase();
  const mine = new Set([...(ctx.index.bundled || []), ...Object.keys(state.mine.sets)]);
  const show = (set) => (q ? set.name.toLowerCase().includes(q) || set.id.toLowerCase() === q : s.tab === 'all' || mine.has(set.id));
  const groups = [...ctx.index.series]
    .sort((a, b) => (b.releaseDate || '').localeCompare(a.releaseDate || ''))
    .map((serie) => ({ name: serie.name, sets: [...serie.sets].reverse().filter(show).map((set) => ctx.setInfo(set.id) || set) }))
    .filter((g) => g.sets.length);

  // Cards you own in a set the list doesn't know about (e.g. imported from a newer app version).
  const unknown = Object.keys(state.mine.sets).filter((id) => !ctx.index.byId.has(id));
  if (unknown.length && !q) groups.push({ name: 'Other', sets: unknown.map((id) => ({ id, name: id, total: 0 })) });

  if (!groups.length) {
    return [h('p', { class: 'empty-text' }, q ? `No sets match “${s.q.trim()}”.` : 'No sets yet. Switch to All sets to pick one.')];
  }
  return [
    q ? h('h2', { class: 'group-title' }, 'Sets') : null,
    ...groups.map((g) => h('section', { class: 'group' },
      h('h2', { class: 'group-title' }, g.name),
      h('div', { class: 'list' }, g.sets.map((set) => setRow(set, setStats(state.mine, set.id))))),
    ),
  ].filter(Boolean);
}
