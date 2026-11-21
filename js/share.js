// Moving collections around without a server: backup files and share links.
// A share link carries the whole collection, compressed, in the URL fragment (#s=...).
// Fragments never reach the web server, so nothing is uploaded anywhere.

import { normalize } from './store.js';

const LINK_WARN_LENGTH = 8000;
// A very large real collection is ~100 KB of JSON. Compression is so effective on repetitive text
// that a small crafted link could otherwise expand to hundreds of MB and freeze the tab.
const MAX_JSON_BYTES = 2 * 1024 * 1024;

function toBase64Url(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text) {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

// Runs bytes through a (de)compression stream, stopping once the output passes `limit`.
async function pipe(bytes, stream, limit = MAX_JSON_BYTES) {
  const reader = new Blob([bytes]).stream().pipeThrough(stream).getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) {
      reader.cancel().catch(() => {});
      throw new Error('That link is too large to be a SetGaps collection.');
    }
    chunks.push(value);
  }
  return new Uint8Array(await new Blob(chunks).arrayBuffer());
}

const canCompress = typeof CompressionStream === 'function' && typeof DecompressionStream === 'function';

// "z" + deflate-raw + base64url, or "j" + plain base64url where compression isn't available.
export async function encodeCollection(col) {
  const bytes = new TextEncoder().encode(JSON.stringify(col));
  if (canCompress) {
    try {
      return `z${toBase64Url(await pipe(bytes, new CompressionStream('deflate-raw')))}`;
    } catch {
      // fall through to uncompressed
    }
  }
  return `j${toBase64Url(bytes)}`;
}

export async function decodeCollection(payload) {
  const kind = payload[0];
  let bytes = fromBase64Url(payload.slice(1));
  if (kind === 'z') {
    if (!canCompress) throw new Error('This browser is too old to open share links. Ask for the backup file instead.');
    bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
  } else if (kind !== 'j') {
    throw new Error("That link isn't a SetGaps share link.");
  }
  return normalize(JSON.parse(new TextDecoder().decode(bytes)));
}

export function shareUrl(payload) {
  return `${location.origin}${location.pathname}#s=${payload}`;
}

// Accepts a backup file's text, a full share link, or just the #s= payload.
export async function parseCollectionText(text) {
  const trimmed = (text || '').trim();
  if (!trimmed) throw new Error('Nothing to load. Paste a link or choose a file.');
  if (trimmed.startsWith('{')) {
    try {
      return normalize(JSON.parse(trimmed));
    } catch (err) {
      throw new Error(err instanceof SyntaxError ? "That file is damaged or isn't a SetGaps backup." : err.message);
    }
  }
  const match = trimmed.match(/[#&?]s=([A-Za-z0-9_-]+)/) || trimmed.match(/^([zj][A-Za-z0-9_-]+)$/);
  if (!match) throw new Error("That doesn't look like a SetGaps link or backup.");
  try {
    return await decodeCollection(match[1]);
  } catch (err) {
    throw new Error(err.message.startsWith('This browser') ? err.message : 'That link is incomplete or damaged. Ask for it again, or for the backup file.');
  }
}

export async function readCollectionFile(file) {
  if (file.size > 5 * 1024 * 1024) throw new Error('That file is too big to be a SetGaps backup.');
  let text;
  try {
    text = await file.text();
  } catch {
    // e.g. a cloud file that isn't downloaded to the phone yet
    throw new Error('Couldn’t open that file. If it’s in iCloud or Drive, download it first and try again.');
  }
  return parseCollectionText(text);
}

function backupFileName(owner) {
  const who = (owner || 'collection').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'collection';
  return `setgaps-${who}-${new Date().toISOString().slice(0, 10)}.json`;
}

// Phones: the share sheet (Files, Mail, AirDrop, Messages). Elsewhere: a normal download.
// Returns 'shared', 'downloaded' or 'cancelled'.
export async function exportBackup(col) {
  const json = JSON.stringify(col, null, 1);
  const name = backupFileName(col.owner);
  const file = new File([json], name, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'SetGaps backup' });
      return 'shared';
    } catch (err) {
      if (err.name === 'AbortError') return 'cancelled';
      // Share sheet failed for another reason: fall back to downloading.
    }
  }
  const url = URL.createObjectURL(file);
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'downloaded';
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers / insecure contexts.
    const area = Object.assign(document.createElement('textarea'), { value: text });
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }
}

// Share sheet with a link or text on phones, clipboard elsewhere. Returns 'shared', 'copied', 'cancelled' or 'failed'.
export async function shareOrCopy({ title, text, url }) {
  if (navigator.share && matchMedia('(pointer: coarse)').matches) {
    try {
      await navigator.share({ title, text, url });
      return 'shared';
    } catch (err) {
      if (err.name === 'AbortError') return 'cancelled';
    }
  }
  return (await copyText(url ? (text ? `${text}\n${url}` : url) : text)) ? 'copied' : 'failed';
}

export async function shareCollectionLink(col) {
  const url = shareUrl(await encodeCollection(col));
  const who = col.owner ? `${col.owner}'s` : 'My';
  const result = await shareOrCopy({ title: 'SetGaps collection', text: `${who} Pokémon card collection on SetGaps`, url });
  return { result, long: url.length > LINK_WARN_LENGTH };
}
