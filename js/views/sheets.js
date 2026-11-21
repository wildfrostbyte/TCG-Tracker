// Bottom sheets: menu, card details, incoming share links, restore, load a friend, install steps.

import {
  state, count, setCount, subscribe, setOwner, markBackedUp, replaceMine, mergeIntoMine, setFriend,
  friendName, collectionSize, tradeTotals, tradeStatus, changeCount, updateMeta,
} from '../store.js';
import { exportBackup, shareCollectionLink, readCollectionFile, parseCollectionText } from '../share.js';
import { typeStyle, rarityInfo, cardNumber } from '../rarity.js';
import { isInstalled, detectPlatform, installGuide, canPromptInstall, promptInstall } from '../install.js';
import {
  h, icon, appMark, openSheet, sheetHeader, stepper, rarityPill, avatar, setAbbr, toast, formatDate, plural, tradeStats, DISCLAIMER,
} from '../ui.js';

// ---- Comparing with a friend (used by the menu, share links, file loads and the Trades screen) ----

export function startComparing(ctx, col, close) {
  setFriend(col);
  close?.();
  toast(`Comparing with ${col.owner || 'your friend'}`);
  ctx.go('#/trades');
}

export function stopComparing() {
  const name = friendName();
  setFriend(null);
  toast(`Stopped comparing with ${name}`);
}

// ---- Backup (used by the banner and the menu) ----

export async function saveBackup() {
  const result = await exportBackup(state.mine);
  if (result === 'cancelled') return false;
  markBackedUp();
  toast(result === 'shared' ? 'Backup saved' : 'Backup downloaded. Keep the file somewhere safe');
  return true;
}

function since(ms) {
  if (!ms) return 'Never backed up';
  const mins = Math.round((Date.now() - ms) / 60000);
  if (mins < 2) return 'Backed up just now';
  if (mins < 60) return `Backed up ${mins} minutes ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `Backed up ${plural(hours, 'hour')} ago`;
  return `Last backup ${formatDate(ms)}`;
}

function pickFile(onFile) {
  const input = h('input', { type: 'file', hidden: true });
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    input.remove();
    if (file) onFile(file);
  });
  document.body.append(input);
  input.click();
}

function menuRow({ title, detail, onclick, dot, trailing }) {
  return h('button', { type: 'button', class: 'menu-row', onclick },
    dot ? h('span', { class: 'dot', 'aria-hidden': 'true' }) : h('span', { class: 'dot-space', 'aria-hidden': 'true' }),
    h('span', { class: 'list-main' }, h('span', { class: 'strong' }, title), detail ? h('span', { class: 'muted small' }, detail) : null),
    trailing || null,
  );
}

// ---- Menu ----

// Auto / Light / Dark. Applied by js/theme.js (loaded in <head> so there's no flash on start-up).
function themePicker() {
  const current = window.SetGapsTheme?.get() || 'auto';
  const group = h('div', { class: 'segmented', role: 'group', 'aria-label': 'Appearance' },
    [['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']].map(([id, label]) =>
      h('button', { type: 'button', 'data-theme-choice': id, 'aria-pressed': String(current === id) }, label)));
  group.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-theme-choice]');
    if (!btn) return;
    window.SetGapsTheme?.set(btn.dataset.themeChoice);
    for (const b of group.children) b.setAttribute('aria-pressed', String(b === btn));
  });
  return h('div', { class: 'field' }, h('span', null, 'Appearance (Auto follows your device)'), group);
}

export function openMenu(ctx) {
  let nudgedForName = false;
  openSheet((close) => {
    const nameInput = h('input', { type: 'text', value: state.mine.owner, maxlength: '40', autocomplete: 'nickname', placeholder: 'e.g. Mike' });
    nameInput.addEventListener('input', () => setOwner(nameInput.value));
    const changes = changeCount();
    const showInstall = !isInstalled() && installGuide(detectPlatform());

    async function share() {
      if (!state.mine.owner && !nudgedForName) {
        nudgedForName = true;
        nameInput.focus();
        toast('Add your name first so friends know whose collection it is');
        return;
      }
      const { result, long } = await shareCollectionLink(state.mine);
      if (result === 'copied') toast(long ? 'Link copied. It’s long, so if it breaks, send the backup file instead' : 'Link copied. Send it to a friend', 4500);
      if (result === 'failed') toast('Couldn’t copy on this browser. Send the backup file instead');
    }

    return h('div', { class: 'menu' },
      sheetHeader('Menu', close),
      h('label', { class: 'field' }, h('span', null, 'Your name (shown to friends)'), nameInput),
      themePicker(),
      h('h3', { class: 'group-title' }, 'Back up'),
      h('div', { class: 'menu-group' },
        menuRow({
          title: 'Save backup file',
          detail: `${since(state.meta.lastBackupAt)}${changes && state.meta.lastBackupAt ? ` · ${plural(changes, 'change')} since` : ''}. Opens Files, Mail, AirDrop on phones`,
          dot: changes > 0,
          onclick: async () => { if (await saveBackup()) close(); },
        }),
        menuRow({
          title: 'Restore from a file',
          detail: 'Replace or merge with what’s on this device',
          onclick: () => pickFile(async (file) => {
            try {
              openRestore(ctx, await readCollectionFile(file));
            } catch (err) {
              toast(err.message, 5000);
            }
          }),
        }),
      ),
      h('h3', { class: 'group-title' }, 'Share & trade'),
      h('div', { class: 'menu-group' },
        menuRow({ title: 'Share my collection', detail: 'Sends a link. Nothing is uploaded anywhere', onclick: share }),
        menuRow({ title: 'Load a friend’s collection', detail: 'From their file or a link they sent', onclick: () => openLoadFriend(ctx) }),
        state.friend
          ? h('div', { class: 'menu-row static' }, avatar(friendName(), 28), h('span', { class: 'list-main strong' }, `Comparing with ${friendName()}`),
            h('button', { type: 'button', class: 'btn small-btn', onclick: () => { close(); stopComparing(); } }, 'Stop'))
          : null,
      ),
      showInstall
        ? h('div', { class: 'menu-group install-row' },
          menuRow({ title: 'Install app', detail: 'Keep SetGaps on your Home Screen', onclick: () => openInstallSheet(ctx), trailing: icon('phone', 20) }))
        : null,
      h('p', { class: 'muted small about' }, `Your collection is stored only on this device. ${DISCLAIMER}`),
    );
  }, { label: 'Menu', onClose: () => ctx.render() });
}

// ---- Card details ----

export function openCardSheet(ctx, set, card) {
  const [localId, name, cat, type, rarity, image] = card;
  const ts = typeStyle(type, cat);
  const r = rarityInfo(rarity);
  const number = cardNumber(localId, set.official);
  let unsubscribe = null;

  openSheet((close) => {
    const counter = h('div', { class: 'card-counter' });
    const friendLine = h('div');

    function draw() {
      const n = count(state.mine, set.id, localId);
      counter.replaceChildren(
        stepper(localId, n, { big: true, name }),
        h('span', { class: 'muted small' }, n === 0 ? 'Missing' : n === 1 ? 'You have it' : `${plural(n - 1, 'spare')}`),
      );
      if (state.friend) {
        const f = count(state.friend, set.id, localId);
        const who = friendName();
        let text = f ? `${who} has ${f}` : `${who} doesn’t have this card`;
        const trade = tradeStatus(n, f);
        if (trade === 'get') text += ` · ${plural(f - 1, 'spare')} they can give you`;
        if (trade === 'give') text += ' · you can give them a spare';
        friendLine.replaceChildren(h('div', { class: 'friend-line' }, avatar(who, 28), h('span', null, text)));
      }
    }

    counter.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const n = count(state.mine, set.id, localId);
      setCount(set.id, localId, btn.dataset.action === 'inc' ? n + 1 : n - 1);
    });
    unsubscribe = subscribe((ev) => ev.type === 'count' && ev.setId === set.id && ev.localId === localId && draw());
    draw();

    const placeholder = (text) => h('div', { class: 'card-image placeholder' }, icon('image', 28), h('span', null, text));
    let picture = placeholder('No image available');
    if (image) {
      picture = h('img', { class: 'card-image', src: `${image}/high.webp`, alt: `${name} card`, crossorigin: 'anonymous', decoding: 'async' });
      picture.addEventListener('error', () => picture.replaceWith(placeholder(navigator.onLine ? 'Image unavailable' : 'Image needs a connection')));
    }

    return h('div', { class: 'card-sheet' },
      h('div', { class: 'sheet-head' },
        h('span', { class: 'set-chip' }, h('b', null, setAbbr(set.id)), set.name),
        h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Close', onclick: () => close() }, icon('close', 20))),
      picture,
      h('div', { class: 'card-title' }, h('h2', null, name), h('span', { class: 'card-number' }, number)),
      h('div', { class: 'card-tags' },
        h('span', { class: 'type-chip', style: { '--type': ts.bg, '--type-fg': ts.fg, '--type-border': ts.border } }, ts.label),
        r ? h('span', { class: 'rarity-tag' }, rarityPill(r), r.label) : null),
      counter,
      friendLine,
    );
  }, { label: `${name}, ${number}, ${set.name}`, onDispose: () => unsubscribe?.() });
}

// ---- Someone opened a share link ----

export function openIncoming(ctx, col) {
  const size = collectionSize(col);
  const who = col.owner || 'Someone';
  const ownLink = !!col.owner && col.owner === state.mine.owner;
  const t = tradeTotals(state.mine, col);

  openSheet((close) => h('div', { class: 'incoming' },
    h('div', { class: 'incoming-head' },
      avatar(who, 52),
      h('div', null,
        h('h2', null, ownLink ? 'This looks like your own collection' : `${who} shared their collection`),
        h('p', { class: 'muted small' }, `${plural(size.cards, 'card')} · ${plural(size.sets, 'set')}${col.updated ? ` · updated ${formatDate(col.updated)}` : ''}`))),
    ownLink
      ? h('p', { class: 'muted small' }, 'Restore it to put this collection on this device, or compare to see the differences.')
      : tradeStats(t.get, t.give, who, { compact: true }),
    h('div', { class: 'actions stack' },
      h('button', { type: 'button', class: 'btn primary', onclick: () => startComparing(ctx, col, close) }, 'Compare with my collection'),
      h('button', { type: 'button', class: 'btn danger-outline', onclick: () => confirmReplace(ctx, col, { fromBackup: ownLink }) },
        ownLink ? 'Restore it on this device' : `Replace my collection with ${col.owner ? `${col.owner}’s` : 'this one'}`),
      h('button', { type: 'button', class: 'btn ghost', onclick: () => close() }, 'Not now')),
  ), { label: `${who} shared their collection` });
}

function confirmReplace(ctx, col, { fromBackup = false } = {}) {
  const mine = collectionSize(state.mine);
  const theirs = collectionSize(col);
  openSheet((close) => h('div', null,
    sheetHeader('Replace your collection?', close),
    h('p', null, `The ${plural(mine.cards, 'card')} on this device will be replaced by ${plural(theirs.cards, 'card')}${col.owner ? ` from ${col.owner}` : ''}. This can’t be undone without a backup.`),
    h('div', { class: 'actions stack' },
      mine.cards ? h('button', { type: 'button', class: 'btn', onclick: () => saveBackup() }, 'Save a backup of mine first') : null,
      h('button', {
        type: 'button', class: 'btn danger',
        onclick: () => {
          const owner = state.mine.owner;
          replaceMine(col, { fromBackup });
          if (owner) setOwner(owner);
          close();
          toast(`Collection replaced: ${plural(theirs.cards, 'card')}`);
          ctx.go('#/');
        },
      }, 'Replace'),
      h('button', { type: 'button', class: 'btn ghost', onclick: () => close() }, 'Cancel')),
  ), { label: 'Replace your collection?' });
}

// ---- Restore a backup file (from the menu) ----

export function openRestore(ctx, col) {
  const size = collectionSize(col);
  const here = collectionSize(state.mine);
  openSheet((close) => h('div', null,
    sheetHeader('Restore backup', close, `${col.owner || 'Unnamed'} · ${plural(size.cards, 'card')} in ${plural(size.sets, 'set')}${col.updated ? ` · ${formatDate(col.updated)}` : ''}`),
    h('p', { class: 'muted small' }, here.cards ? `This device has ${plural(here.cards, 'card')} right now.` : 'This device has no cards yet.'),
    // Cards on the device: merge leads and replace asks first. Empty device: nothing to lose.
    h('div', { class: 'actions stack' },
      here.cards
        ? [
          h('button', {
            type: 'button', class: 'btn primary',
            onclick: () => { const n = mergeIntoMine(col); close(); toast(n ? `Merged: ${plural(n, 'card')} updated` : 'Nothing new to merge'); },
          }, 'Merge (keeps the higher count of each card)'),
          h('button', { type: 'button', class: 'btn danger-outline', onclick: () => confirmReplace(ctx, col, { fromBackup: true }) },
            'Replace what’s on this device'),
        ]
        : h('button', {
          type: 'button', class: 'btn primary',
          onclick: () => { replaceMine(col, { fromBackup: true }); close(); toast(`Restored ${plural(size.cards, 'card')}`); ctx.go('#/'); },
        }, 'Restore'),
      h('button', { type: 'button', class: 'btn ghost', onclick: () => startComparing(ctx, col, close) }, 'Compare as a friend instead')),
  ), { label: 'Restore backup' });
}

// ---- Load a friend's collection: file or pasted link ----

export function openLoadFriend(ctx) {
  openSheet((close) => {
    const error = h('p', { class: 'error', role: 'alert' });
    const paste = h('textarea', { rows: '3', placeholder: 'Paste the link they sent you', 'aria-label': 'Friend’s share link' });
    const use = (col) => startComparing(ctx, col, close);
    return h('div', null,
      sheetHeader('Load a friend’s collection', close, 'Use the backup file or share link they sent you.'),
      h('button', {
        type: 'button', class: 'btn', onclick: () => pickFile(async (file) => {
          try {
            use(await readCollectionFile(file));
          } catch (err) {
            error.textContent = err.message;
          }
        }),
      }, 'Choose their backup file'),
      h('p', { class: 'muted small center' }, 'or'),
      paste,
      error,
      h('button', {
        type: 'button', class: 'btn primary', onclick: async () => {
          try {
            use(await parseCollectionText(paste.value));
          } catch (err) {
            error.textContent = err.message;
          }
        },
      }, 'Compare with my collection'),
    );
  }, { label: 'Load a friend’s collection' });
}

// ---- Install steps ----

const SNOOZE = 7 * 24 * 60 * 60 * 1000;

export function openInstallSheet(ctx, { auto = false } = {}) {
  const guide = installGuide(detectPlatform());
  if (!guide) return;
  let handled = false;
  const snooze = (dismissed) => {
    handled = true;
    updateMeta({
      installSnoozeUntil: Date.now() + SNOOZE,
      installDismissals: (state.meta.installDismissals || 0) + (dismissed ? 1 : 0),
    });
  };
  const oneTap = guide.oneTap && canPromptInstall();

  openSheet((close) => h('div', { class: 'install' },
    h('span', { class: 'pill muted-pill' }, `Steps for ${guide.label}`),
    h('div', { class: 'install-head' },
      appMark(56),
      h('div', null, h('h2', null, guide.title), h('p', { class: 'muted small' }, guide.why))),
    h('div', { class: 'pills' },
      h('span', { class: 'pill get' }, 'Full screen'),
      h('span', { class: 'pill get' }, 'Collection kept safe'),
      h('span', { class: 'pill get' }, 'Own app icon')),
    oneTap
      ? h('button', {
        type: 'button', class: 'btn primary big',
        onclick: async () => {
          handled = true;
          const accepted = await promptInstall();
          close();
          toast(accepted ? 'Installing SetGaps…' : 'No problem. Install any time from the menu');
        },
      }, 'Install app')
      : null,
    h('ol', { class: 'steps' },
      oneTap ? h('li', { class: 'muted small steps-caption' }, 'If the button doesn’t work:') : null,
      guide.steps.map(([text, glyph], i) => h('li', null,
        h('span', { class: 'step-num' }, String(i + 1)),
        h('span', { class: 'step-text' }, text),
        glyph ? h('span', { class: 'step-icon' }, glyph === 'share' || glyph === 'plus' ? icon(glyph, 20) : glyph) : null))),
    guide.hint ? h('p', { class: 'hint' }, guide.hint) : null,
    h('div', { class: 'actions row' },
      h('button', { type: 'button', class: 'btn', onclick: () => { snooze(true); close(); } }, 'Not now'),
      oneTap ? null : h('button', { type: 'button', class: 'btn dark', onclick: () => { snooze(false); close(); } }, 'Got it')),
  ), {
    label: guide.title,
    onClose: () => {
      if (auto && !handled) snooze(true);
    },
  });
}
