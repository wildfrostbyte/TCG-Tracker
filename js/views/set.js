// Set view: every card in one grid. − / + changes your count; filters narrow the grid.

import { state, count, subscribe, setCount, friendName, tradeStatus, updateMeta } from '../store.js';
import { getSet } from '../api.js';
import { rarityInfo, rarityRank, cardNumber } from '../rarity.js';
import { copyText } from '../share.js';
import { h, icon, cardTile, chips, progressBar, percent, toast, plural, topBar, tradeLabels } from '../ui.js';
import { openCardSheet, openViewSheet, BINDER_SIZES } from './sheets.js';

const FILTERS = ['all', 'have', 'missing', 'dupes', 'get', 'give'];

export function renderSet(ctx, route) {
  const info = ctx.setInfo(route.id);
  const view = h('div', { class: 'view set-view' });
  let alive = true;
  let unsubscribe = null;
  ctx.cleanup = () => {
    alive = false;
    unsubscribe?.();
  };

  const loading = h('div', { class: 'empty' }, h('p', { class: 'muted' }, 'Loading cards…'));
  view.append(topBar({ title: info?.name || route.id, back: ctx.backLink() }), loading);

  getSet(route.id)
    .then((set) => {
      if (!alive) return;
      unsubscribe = build(ctx, view, set, route);
    })
    .catch(() => {
      if (!alive) return;
      loading.replaceChildren(
        h('h2', null, 'Couldn’t load this set'),
        h('p', { class: 'muted' }, navigator.onLine
          ? 'TCGdex didn’t answer. Try again in a moment.'
          : 'You’re offline, and this set hasn’t been opened on this device before. Connect once and it’ll work offline after that.'),
        h('button', { type: 'button', class: 'btn', onclick: () => ctx.render() }, 'Try again'),
      );
    });
  return view;
}

function build(ctx, view, set, route) {
  const s = {
    filter: FILTERS.includes(route.params.get('f')) ? route.params.get('f') : 'all',
    q: '',
    rarity: '',
    binder: BINDER_SIZES.find((b) => b.pockets === state.meta.binders?.[set.id]) || null,
  };
  const target = route.params.get('card');
  if (target) s.filter = 'all';
  const byId = new Map(set.cards.map((c) => [c[0], c]));
  const fname = friendName();
  // Numbered cards run up to the printed count (e.g. 103). Extras are only "secret" when they're all
  // numbered past it; some sets add lettered cards. Milestones: every numbered card, then every card.
  const isNumbered = (c) => /^\d+$/.test(c[0]) && Number(c[0]) <= set.official;
  const numbered = set.official ? set.cards.filter(isNumbered) : [];
  const extras = set.official ? set.cards.filter((c) => !isNumbered(c)) : [];
  const secretOnly = extras.every((c) => /^\d+$/.test(c[0]));
  const extraWord = secretOnly ? 'secret rare' : 'extra card';
  const subtitle = extras.length ? `${set.official} cards + ${extras.length} ${secretOnly ? 'secret' : 'extra'}` : plural(set.cards.length, 'card');

  const copyBtn = h('button', { type: 'button', class: 'icon-btn', onclick: copyMissing, 'aria-label': 'Copy list of missing cards', title: 'Copy list of missing cards' }, icon('copy', 20));
  const viewBtn = h('button', { type: 'button', class: 'icon-btn', onclick: () => openViewSheet(set, s.binder?.pockets || 0, setBinder) }, icon('binder', 20));
  const statsText = h('span', { class: 'strong small' });
  const sparesText = h('span', { class: 'muted small' });
  const bar = h('div');
  const search = h('input', { type: 'search', placeholder: 'Find a card: number or name', 'aria-label': 'Find a card in this set', autocomplete: 'off', enterkeyhint: 'search' });
  const chipBox = h('div');
  const raritySelect = h('select', { class: 'chip select', 'aria-label': 'Rarity' },
    h('option', { value: '' }, 'All rarities'),
    [...new Map(set.cards.map((c) => rarityInfo(c[4])).filter(Boolean).map((r) => [r.key, r])).values()]
      .sort((a, b) => rarityRank(a.key) - rarityRank(b.key))
      .map((r) => h('option', { value: r.key }, `${r.sym}  ${r.label}`)),
  );
  const grid = h('div', { class: 'grid' });
  const empty = h('p', { class: 'empty-text', hidden: true }, 'No cards match.');
  const completeNote = h('div', { class: 'complete-note', hidden: true });
  const announce = h('p', { class: 'sr-only', 'aria-live': 'polite' });

  view.replaceChildren(
    topBar({ title: set.name, subtitle, action: [viewBtn, copyBtn], back: ctx.backLink() }),
    h('div', { class: 'set-tools' },
      h('div', { class: 'stats-line' }, statsText, sparesText),
      bar,
      h('div', { class: 'filter-row' }, chipBox, raritySelect.options.length > 2 ? raritySelect : null),
    ),
    completeNote,
    announce,
    grid,
    empty,
    h('div', { class: 'findbar' }, h('label', { class: 'search' }, icon('search', 18), search)),
  );

  function mine(localId) {
    return count(state.mine, set.id, localId);
  }
  function theirs(localId) {
    return count(state.friend, set.id, localId);
  }
  function tradeOf(localId) {
    return state.friend ? tradeStatus(mine(localId), theirs(localId)) : null;
  }

  function drawStats() {
    let have = 0;
    let spares = 0;
    for (const c of set.cards) {
      const n = mine(c[0]);
      if (n) have++;
      if (n > 1) spares += n - 1;
    }
    const total = set.cards.length;
    statsText.textContent = `You have ${have} of ${total} · ${percent(have, total)}%`;
    sparesText.textContent = plural(spares, 'spare');
    bar.replaceChildren(progressBar(have, total, `${set.name} collected`));
  }

  // 0 not done, 1 every numbered card, 2 every card.
  function milestone() {
    const owned = (c) => mine(c[0]) > 0;
    if (set.cards.length && set.cards.every(owned)) return 2;
    if (numbered.length && extras.length && numbered.every(owned)) return 1;
    return 0;
  }

  // `celebrate` is true only when the milestone was just reached.
  function drawMilestone(level, celebrate) {
    completeNote.hidden = level === 0;
    if (!level) return;
    const title = level === 2 ? `${set.name} complete!` : 'Numbered set complete!';
    const detail = level === 2
      ? `Every card, all ${set.cards.length}${extras.length ? `, ${extraWord}s included` : ''}.`
      : `All ${set.official} numbered cards. ${plural(extras.filter((c) => !mine(c[0])).length, extraWord)} to go.`;
    completeNote.replaceChildren(
      h('span', { class: 'complete-mark', 'aria-hidden': 'true' }, icon('check', 18)),
      h('span', { class: 'list-main' }, h('strong', null, title), h('span', { class: 'small' }, detail)),
    );
    if (!celebrate) return;
    announce.textContent = `${title} ${detail}`;
    grid.querySelectorAll('.tile.owned').forEach((el, i) => el.style.setProperty('--i', Math.min(i, 40)));
    grid.classList.remove('celebrate');
    void grid.offsetWidth; // restarts the animation if it's mid-run
    grid.classList.add('celebrate');
    setTimeout(() => grid.classList.remove('celebrate'), 1400);
  }

  function drawChips() {
    const items = [
      { id: 'all', label: 'All' },
      { id: 'have', label: 'Have' },
      { id: 'missing', label: 'Missing' },
      { id: 'dupes', label: 'Spares' },
    ];
    if (state.friend) {
      let get = 0;
      let give = 0;
      for (const c of set.cards) {
        const t = tradeOf(c[0]);
        if (t === 'get') get++;
        if (t === 'give') give++;
      }
      const label = tradeLabels(fname);
      items.push({ id: 'get', label: `${label.get} · ${get}`, trade: true }, { id: 'give', label: `${label.give} · ${give}`, trade: true });
    }
    for (const item of items) item.active = item.id === s.filter;
    chipBox.replaceChildren(chips(items, { label: 'Filter cards' }));
  }

  function visible(c) {
    const [localId, name, , , rarity] = c;
    const n = mine(localId);
    if (s.q) {
      const q = s.q.toLowerCase();
      const number = cardNumber(localId, set.official).toLowerCase();
      if (!name.toLowerCase().includes(q) && !number.startsWith(q) && localId.replace(/^0+/, '') !== q.replace(/^0+/, '')) return false;
    }
    if (s.rarity && rarityInfo(rarity)?.key !== s.rarity) return false;
    switch (s.filter) {
      case 'have': return n > 0;
      case 'missing': return n === 0;
      case 'dupes': return n > 1;
      case 'get':
      case 'give': return tradeOf(localId) === s.filter;
      default: return true;
    }
  }

  function tile(c, motion) {
    return cardTile({ set, card: c, mine: mine(c[0]), friend: theirs(c[0]), friendName: fname, trade: tradeOf(c[0]), motion });
  }

  function drawGrid() {
    const cards = set.cards.filter(visible);
    // classList, so a running celebrate wave survives.
    grid.classList.toggle('grid', !s.binder);
    grid.classList.toggle('binder', !!s.binder);
    if (s.binder) {
      // Rebuild pages only when the size changes; filters just re-dim.
      if (pagesFor !== s.binder) grid.replaceChildren(...binderPages());
      pagesFor = s.binder;
      const shown = new Set(cards.map((c) => c[0]));
      for (const el of grid.querySelectorAll('.tile')) el.classList.toggle('dim', !shown.has(el.dataset.card));
    } else {
      pagesFor = null;
      grid.replaceChildren(...cards.map(tile));
    }
    // Binder pages stay when nothing matches, so the note goes above them.
    if (s.binder) grid.before(empty);
    else grid.after(empty);
    empty.hidden = cards.length > 0;
    if (!cards.length) {
      if (s.filter === 'missing' && !s.q && !s.rarity) empty.textContent = 'You have every card in this set!';
      else if (s.q) empty.textContent = `No card matches “${s.q}”${s.filter !== 'all' || s.rarity ? ' with these filters' : ''}. Try the number printed on the card.`;
      else empty.textContent = 'No cards here with these filters. Tap All to see every card.';
    }
  }

  // Each card keeps its pocket (filters dim, never remove); the last page is padded.
  let pagesFor = null; // the size the current pages were built for
  function binderPages() {
    const { pockets, cols } = s.binder;
    const pages = [];
    for (let start = 0; start < set.cards.length; start += pockets) {
      const cards = set.cards.slice(start, start + pockets);
      const first = cardNumber(cards[0][0], set.official).split('/')[0];
      const last = cardNumber(cards[cards.length - 1][0], set.official).split('/')[0];
      const label = `Page ${pages.length + 1}`;
      pages.push(h('section', { class: 'binder-page', 'aria-label': label, 'data-cols': cols, style: { '--cols': cols } },
        h('h2', { class: 'page-label' }, label, h('span', { class: 'muted' }, cards.length > 1 ? `${first}–${last}` : first)),
        h('div', { class: 'pockets' },
          cards.map(tile),
          Array.from({ length: pockets - cards.length }, () => h('div', { class: 'pocket-empty', 'aria-hidden': 'true' }))),
      ));
    }
    return pages;
  }

  function setBinder(pockets) {
    s.binder = BINDER_SIZES.find((b) => b.pockets === pockets) || null;
    const binders = { ...state.meta.binders };
    if (pockets) binders[set.id] = pockets;
    else delete binders[set.id];
    updateMeta(pockets ? { binders, lastPockets: pockets } : { binders });
    drawViewBtn();
    drawGrid();
  }

  function drawViewBtn() {
    const label = s.binder ? `View: binder, ${s.binder.pockets} pockets per page` : 'View: grid';
    viewBtn.setAttribute('aria-label', label);
    viewBtn.title = label;
    viewBtn.classList.toggle('on', !!s.binder);
  }

  function copyMissing() {
    const missing = set.cards.filter((c) => !mine(c[0]));
    if (!missing.length) {
      toast('You have every card in this set!');
      return;
    }
    const lines = missing.map((c) => `${cardNumber(c[0], set.official)} ${c[1]}`);
    copyText(`${set.name}: missing ${missing.length}\n${lines.join('\n')}`).then((ok) =>
      toast(ok ? `Copied ${plural(missing.length, 'missing card')}` : 'Couldn’t copy on this browser'));
  }

  // Grid buttons: open details, add one, remove one.
  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const card = byId.get(btn.dataset.id);
    if (!card) return;
    const n = mine(card[0]);
    if (btn.dataset.action === 'inc') setCount(set.id, card[0], n + 1);
    else if (btn.dataset.action === 'dec') setCount(set.id, card[0], n - 1);
    else if (btn.dataset.action === 'open') {
      // Previous / next step through the cards on screen (undimmed in binder view).
      const onScreen = [...grid.querySelectorAll('.tile:not(.dim)')].map((el) => byId.get(el.dataset.card));
      openCardSheet(ctx, set, card, { cards: onScreen });
    }
  });

  chipBox.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-filter]');
    if (!chip) return;
    s.filter = chip.dataset.filter;
    drawChips();
    drawGrid();
  });
  raritySelect.addEventListener('change', () => {
    s.rarity = raritySelect.value;
    raritySelect.classList.toggle('on', !!s.rarity);
    drawGrid();
  });
  search.addEventListener('input', () => {
    s.q = search.value.trim();
    drawGrid();
    // Binder keeps every card: scroll to the first match.
    if (s.binder) {
      if (!s.q) return;
      const match = grid.querySelector('.tile:not(.dim)');
      if (match) return match.scrollIntoView({ block: 'center' });
    }
    // Otherwise scroll up if the results (or binder's no-match note) are above the screen.
    const top = (s.binder ? empty : grid).getBoundingClientRect().top + scrollY - view.querySelector('.top').offsetHeight;
    if (scrollY > top) scrollTo(0, top);
  });
  // Select the last search so the next number replaces it. Deferred: on touch the caret lands after focus.
  search.addEventListener('focus', () => setTimeout(() => search.select(), 0));

  // A count changed (here or in the details sheet): refresh that tile in place, keep focus on it.
  const unsubscribe = subscribe((event) => {
    if (event.type !== 'count' || event.setId !== set.id) return;
    const old = grid.querySelector(`[data-card="${CSS.escape(event.localId)}"]`);
    if (old) {
      const focused = old.contains(document.activeElement) ? document.activeElement.dataset.action : null;
      // A first copy seats the card; any other change to an owned card pops its count.
      const motion = event.n > 0 ? (old.classList.contains('owned') ? 'bump' : 'seat') : null;
      const fresh = tile(byId.get(event.localId), motion);
      fresh.classList.toggle('dim', old.classList.contains('dim'));
      old.replaceWith(fresh);
      if (focused) {
        const again = fresh.querySelector(`[data-action="${focused}"]:not(:disabled)`) || fresh.querySelector('[data-action="inc"]');
        again.focus({ preventScroll: true });
      }
    }
    drawStats();
    if (state.friend) drawChips();
    const level = milestone();
    drawMilestone(level, level > reached);
    reached = level;
  });

  let reached = milestone();
  drawViewBtn();
  drawStats();
  drawChips();
  drawGrid();
  drawMilestone(reached, false);

  if (target) {
    const el = grid.querySelector(`[data-card="${CSS.escape(target)}"]`);
    if (el) {
      requestAnimationFrame(() => el.scrollIntoView({ block: 'center' }));
      el.classList.add('flash');
    }
  }
  return unsubscribe;
}
