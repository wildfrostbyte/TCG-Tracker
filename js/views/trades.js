// Trades: every set where you and your friend can swap spares. Worked out from the two
// collections alone, so it needs no card data.

import { state, friendName, tradeTotals, setStats } from '../store.js';
import { cardNumber } from '../rarity.js';
import { shareOrCopy } from '../share.js';
import { h, avatar, setRow, toast, topBar, tradeStats } from '../ui.js';
import { openLoadFriend, stopComparing } from './sheets.js';

export function renderTrades(ctx) {
  if (!state.friend) {
    return h('div', { class: 'view' }, topBar({ title: 'Trades', back: ctx.backLink() }),
      h('div', { class: 'empty' },
        h('h2', null, 'Compare with a friend'),
        h('p', { class: 'muted' }, 'Load a friend’s backup file or share link to see which spares you can swap. To get a link, they open the menu and tap Share my collection.'),
        h('button', { type: 'button', class: 'btn primary', onclick: () => openLoadFriend(ctx) }, 'Load a friend’s collection')));
  }

  const name = friendName();
  const totals = tradeTotals(state.mine, state.friend);
  // Most swaps first; ties go to the newest set.
  const swaps = (r) => r.get.length + r.give.length;
  const newness = (r) => r.info?.rank ?? 0;
  const rows = totals.perSet
    .map((t) => ({ ...t, info: ctx.setInfo(t.setId) }))
    .sort((a, b) => swaps(b) - swaps(a) || newness(b) - newness(a));

  async function shareList() {
    const lines = [`SetGaps trades: ${state.mine.owner || 'me'} and ${name}`];
    for (const r of rows) {
      const num = (id) => cardNumber(id, r.info?.official);
      lines.push('', r.info?.name || r.setId);
      if (r.get.length) lines.push(`  ${name} → ${state.mine.owner || 'me'}: ${r.get.map(num).join(', ')}`);
      if (r.give.length) lines.push(`  ${state.mine.owner || 'me'} → ${name}: ${r.give.map(num).join(', ')}`);
    }
    const result = await shareOrCopy({ title: 'SetGaps trades', text: lines.join('\n') });
    if (result === 'copied') toast('Trade list copied. Paste it in your chat');
    if (result === 'failed') toast('Couldn’t copy on this browser');
  }

  return h('div', { class: 'view trades' }, topBar({ title: `Trades with ${name}`, action: avatar(name, 34), back: ctx.backLink() }),
    tradeStats(totals.get, totals.give, name),
    rows.length
      ? h('section', { class: 'group' },
        h('h2', { class: 'group-title' }, 'By set'),
        h('div', { class: 'list' }, rows.map((r) =>
          setRow(r.info || { id: r.setId, name: r.setId, total: 0 }, setStats(state.mine, r.setId),
            h('span', { class: 'pills' },
              h('span', { class: 'pill get' }, `Get ${r.get.length}`),
              h('span', { class: 'pill give' }, `Give ${r.give.length}`)),
            { href: `#/set/${encodeURIComponent(r.setId)}?f=${r.get.length ? 'get' : 'give'}` }))))
      : h('p', { class: 'empty-text' }, 'No swaps yet: neither of you has spares the other is missing.'),
    rows.length ? h('p', { class: 'muted small pad' }, 'A swap is a card one of you is missing and the other has a spare of. Tap a set to see the cards.') : null,
    h('div', { class: 'actions pad' },
      rows.length ? h('button', { type: 'button', class: 'btn primary', onclick: shareList }, 'Share trade list') : null,
      h('button', { type: 'button', class: 'btn', onclick: () => { stopComparing(); ctx.go('#/'); } }, 'Stop comparing')),
  );
}
