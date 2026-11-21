// Shared UI building blocks. Every screen is assembled from these; nothing is copied between views.

import { typeStyle, rarityInfo, cardNumber } from './rarity.js';
import { setLogoUrls } from './tcgdex.js';

// Tiny DOM helper: h('button', { class: 'chip', onclick }, 'Label').
// Text is always set as text (never HTML) except `html`, which is only used for the static icons below.
export function h(tag, props, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (value == null || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key === 'style') {
      for (const [prop, v] of Object.entries(value)) {
        if (prop.startsWith('--')) el.style.setProperty(prop, v);
        else el.style[prop] = v;
      }
    } else if (key === 'html') el.innerHTML = value;
    else if (key === 'value') el.value = value;
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value);
    else el.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat(Infinity)) {
    if (child == null || child === false) continue;
    el.append(child instanceof Node ? child : String(child));
  }
  return el;
}

const svg = (body, size = 22) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

const ICONS = {
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  next: '<path d="M9 5l7 7-7 7"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  share: '<path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/>',
  plus: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/>',
  image: '<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M7 18l3-3 2 2 3-3 2 2"/>',
  phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
  binder: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M12 3v18M4 12h16"/>',
};

export function icon(name, size) {
  return h('span', { class: 'icon', html: svg(ICONS[name], size) });
}

export const DISCLAIMER = 'Card data from TCGdex. SetGaps isn’t affiliated with Nintendo, Creatures, GAME FREAK or The Pokémon Company.';

// The app icon file is the single source for the logo (and is cached for offline use).
export function appMark(size = 28) {
  return h('img', { class: 'app-mark', src: 'icons/icon.svg', width: String(size), height: String(size), alt: '' });
}

// Pinned top bar for inner screens: back, title, optional subtitle and right-hand action.
// `back` is ctx.backLink(): where the back button goes (the previous screen, else Home).
export function topBar({ title, subtitle, action, back }) {
  return h('header', { class: 'top set-top' },
    h('a', {
      class: 'icon-btn back',
      href: back?.href || '#/',
      'aria-label': back?.label || 'Back to sets',
      onclick: back?.go ? (e) => { e.preventDefault(); back.go(); } : null,
    }, icon('back')),
    h('div', { class: 'titles' }, h('h1', null, title), subtitle ? h('span', { class: 'muted small' }, subtitle) : null),
    action,
  );
}

// One wording for trades everywhere: totals, filter chips, the Home banner.
export function tradeLabels(name) {
  return { get: `${name} can give you`, give: `You can give ${name}` };
}

// Get / give totals (Trades screen, incoming share link).
export function tradeStats(get, give, name, { compact = false } = {}) {
  const label = tradeLabels(name);
  return h('div', { class: `trade-totals${compact ? ' compact' : ''}` },
    h('div', { class: 'stat get' }, h('b', null, String(get)), h('span', null, label.get)),
    h('div', { class: 'stat give' }, h('b', null, String(give)), h('span', null, label.give)),
  );
}

export function rarityPill(rarity) {
  const r = typeof rarity === 'string' ? rarityInfo(rarity) : rarity;
  if (!r) return null;
  return h('span', { class: `rarity ${r.cls.split(' ').map((c) => `r-${c}`).join(' ')}`, title: r.label, 'aria-hidden': 'true' }, r.sym);
}

export function stepper(localId, n, { big = false, name = '' } = {}) {
  // A missing card in the grid gets one wide "+ Add" target instead of a disabled − and a 0.
  if (!big && n === 0) {
    return h('div', { class: 'stepper' },
      h('button', { type: 'button', class: 'step add', 'data-action': 'inc', 'data-id': localId, 'aria-label': `Add one ${name}` }, '+ Add'));
  }
  return h('div', { class: big ? 'stepper big' : 'stepper' },
    h('button', { type: 'button', class: 'step', 'data-action': 'dec', 'data-id': localId, 'aria-label': `Remove one ${name}`, disabled: n === 0 }, '−'),
    h('span', { class: n > 1 ? 'count dupe' : 'count' }, n > 1 ? `×${n}` : String(n)),
    h('button', { type: 'button', class: 'step', 'data-action': 'inc', 'data-id': localId, 'aria-label': `Add one ${name}` }, '+'),
  );
}

// One card in a set grid. `friend` is null when not comparing.
export function cardTile({ set, card, mine, friend, friendName, trade }) {
  const [localId, name, cat, type, rarity] = card;
  const ts = typeStyle(type, cat);
  const r = rarityInfo(rarity);
  const number = cardNumber(localId, set.official);
  const [num, of] = number.includes('/') ? number.split('/') : [number, null];
  const label = `${name}, ${number}, ${ts.label}${r ? `, ${r.label}` : ''}. You have ${mine}${friendName ? `, ${friendName} has ${friend}` : ''}. Show details`;
  return h('div', {
    class: `tile ${mine > 0 ? 'owned' : 'missing'}${cat === 'T' ? ' trainer' : ''}`,
    'data-card': localId,
    style: { '--type': ts.bg, '--type-fg': ts.fg, '--type-border': ts.border },
  },
    h('button', { type: 'button', class: 'tile-main', 'data-action': 'open', 'data-id': localId, 'aria-label': label },
      // Type shows only as the tile colour; its name is in the card details sheet and the aria-label.
      // The number gets a full row so "141/103" always fits; the rarity pill sits beside the name,
      // which shortens with "…" when space is tight.
      h('span', { class: 'tile-num' }, h('b', null, num), of ? h('small', null, `/${of}`) : null),
      h('span', { class: 'tile-line' }, h('span', { class: 'tile-name' }, name), rarityPill(r)),
      // Separate spans so a long name truncates, never the count.
      friendName ? h('span', { class: `tile-friend${trade ? ` ${trade}` : ''}` },
        h('span', { class: 'tile-friend-name' }, friendName), h('span', null, friend > 1 ? `×${friend}` : String(friend))) : null,
    ),
    stepper(localId, mine, { name }),
  );
}

export function chips(items, { label } = {}) {
  return h('div', { class: 'chips', role: 'group', 'aria-label': label },
    items.map((item) => h('button', {
      type: 'button',
      class: `chip${item.active ? ' on' : ''}${item.trade ? ' trade' : ''}`,
      'aria-pressed': String(!!item.active),
      'data-filter': item.id,
    }, item.label)),
  );
}

// One-of-a-few picker. Option labels may be text or nodes.
export function segmented({ label, options, current, onChange, className }) {
  const group = h('div', { class: className ? `segmented ${className}` : 'segmented', role: 'group', 'aria-label': label },
    options.map((o) => h('button', { type: 'button', 'aria-pressed': String(o.id === current), 'aria-label': o.ariaLabel }, o.label)));
  group.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    for (const b of group.children) b.setAttribute('aria-pressed', String(b === btn));
    onChange(options[[...group.children].indexOf(btn)].id);
  });
  return group;
}

export function progressBar(have, total, label = 'Collected') {
  return h('div', { class: 'progress', role: 'progressbar', 'aria-label': label, 'aria-valuemin': '0', 'aria-valuemax': String(total), 'aria-valuenow': String(have) },
    h('span', { style: { width: `${percent(have, total)}%` } }));
}

export function percent(have, total) {
  return total ? Math.min(100, Math.round((have / total) * 100)) : 0;
}

export function setAbbr(id) {
  return id.toUpperCase().replace(/[^A-Z0-9.]/g, '').slice(0, 5);
}

// The set's code (e.g. "ME06") until its logo loads; it stays if there's no logo or it can't load.
// Complete sets get a check badge.
function setArt(set, complete) {
  const art = h('span', { class: 'set-art', 'aria-hidden': 'true' },
    h('span', { class: 'set-code' }, setAbbr(set.id)),
    complete ? h('span', { class: 'set-check' }, icon('check', 12)) : null);
  const urls = setLogoUrls(set);
  if (!urls.length) return art;
  let i = 0;
  const img = h('img', { alt: '', loading: 'lazy', decoding: 'async', crossorigin: 'anonymous' });
  img.addEventListener('load', () => art.classList.add('has-logo'), { once: true });
  img.addEventListener('error', () => {
    if (++i < urls.length) img.src = urls[i];
    else img.remove();
  });
  img.src = urls[0];
  art.prepend(img);
  return art;
}

// One set in a list (Home, Trades). `extra` replaces the bottom line: text, or a node such as
// the Get / Give pills. `href` overrides where it opens (Trades opens the set pre-filtered).
export function setRow(set, { have, spares }, extra, { href } = {}) {
  const total = set.total || 0;
  const complete = total > 0 && have >= total;
  return h('a', { class: `set-row${complete ? ' complete' : ''}`, href: href || `#/set/${encodeURIComponent(set.id)}` },
    setArt(set, complete),
    h('span', { class: 'set-body' },
      h('span', { class: 'set-line' }, h('span', { class: 'set-name' }, set.name), h('span', { class: 'muted small' }, total ? `${have} / ${total}` : `${have}`)),
      progressBar(have, total, `${set.name} collected`),
      extra instanceof Node
        ? extra
        : h('span', { class: 'muted small' }, extra
          || (complete ? `Complete · ${plural(spares, 'spare')}` : have ? `${percent(have, total)}% complete · ${plural(spares, 'spare')}` : 'Not started')),
    ),
  );
}

export function avatar(name, size = 32) {
  return h('span', { class: 'avatar', style: { width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size * 0.44)}px` }, 'aria-hidden': 'true' },
    (name || '?').trim().charAt(0).toUpperCase() || '?');
}

// ---- Bottom sheet (one at a time) ----

let closeCurrent = null;

// An open sheet owns one history entry so the phone's Back button closes it. Closing it any other
// way steps back over that entry; navigation waits for that (afterSheetHistory) so it isn't undone.
let sheetEntry = false;
let settle = null;
let settled = Promise.resolve();

export function afterSheetHistory(fn) {
  return settled.then(fn);
}

addEventListener('popstate', () => {
  if (settle) {
    settle();
    settle = null;
    return;
  }
  if (sheetEntry) {
    sheetEntry = false;
    closeCurrent?.({ fromHistory: true });
  }
});

function releaseSheetEntry() {
  if (!sheetEntry) return;
  sheetEntry = false;
  settled = new Promise((resolve) => {
    settle = resolve;
    // Some browsers skip popstate for a back() between same-URL entries; don't wait forever.
    setTimeout(() => { if (settle === resolve) { settle = null; resolve(); } }, 400);
  });
  history.back();
}

// While a sheet is open, the page behind it can't be focused or read by screen readers.
function setBackgroundInert(inert) {
  for (const id of ['app', 'banner-root']) document.getElementById(id).inert = inert;
}

// onClose: the person closed it (button, backdrop, Esc). onDispose: it went away for any reason,
// including another sheet replacing it.
export function openSheet(build, { label, onClose, onDispose } = {}) {
  // A sheet replacing another one reuses its history entry.
  closeCurrent?.({ silent: true, replacing: true });
  if (!sheetEntry) {
    history.pushState({ sheet: true }, '');
    sheetEntry = true;
  }
  const root = document.getElementById('sheet-root');
  const opener = document.activeElement;
  const backdrop = h('div', { class: 'sheet-backdrop' });
  const panel = h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': label });
  const onKey = (e) => e.key === 'Escape' && close();
  function close({ silent, replacing, fromHistory } = {}) {
    if (closeCurrent !== close) return;
    closeCurrent = null;
    if (!replacing && !fromHistory) releaseSheetEntry();
    document.removeEventListener('keydown', onKey);
    root.replaceChildren();
    document.body.classList.remove('sheet-open');
    setBackgroundInert(false);
    if (opener && opener.isConnected) opener.focus?.({ preventScroll: true });
    onDispose?.();
    if (!silent) onClose?.();
  }
  closeCurrent = close;
  backdrop.addEventListener('click', () => close());
  document.addEventListener('keydown', onKey);
  panel.append(h('span', { class: 'sheet-handle', 'aria-hidden': 'true' }), build(close));
  root.replaceChildren(backdrop, panel);
  document.body.classList.add('sheet-open');
  setBackgroundInert(true);
  (panel.querySelector('[autofocus]') || panel.querySelector('button, a, input, textarea, select'))?.focus({ preventScroll: true });
  return close;
}

export function sheetHeader(title, close, subtitle) {
  return h('div', { class: 'sheet-head' },
    h('div', null, h('h2', null, title), subtitle ? h('p', { class: 'muted small' }, subtitle) : null),
    h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Close', onclick: () => close() }, icon('close', 20)),
  );
}

// ---- Toast ----

let toastTimer = null;
export function toast(message, ms = 2800) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

export function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
}

export function plural(n, word, many = `${word}s`) {
  return `${n} ${n === 1 ? word : many}`;
}
