# SetGaps

Track a Pokémon TCG collection: what you have, what's missing and your spares, one set at a time.
Share your collection with friends and see which spares you can swap.

- **Free to run:** static files only. No server, database, accounts or API keys.
- **Your data stays with you:** saved in the browser on your device. Back it up as a JSON file, and share it as a link.
- **Installable (PWA):** add it to your Home Screen. It works offline for any set you've opened.
- Card data comes from [TCGdex](https://tcgdex.dev). Not affiliated with Nintendo, Creatures, GAME FREAK or The Pokémon Company.

## Run it locally

Any static web server works. With Node installed:

```sh
npx serve .
```

Then open the address it prints (e.g. http://localhost:3000). Opening `index.html` directly from disk won't work, because browsers block modules and service workers on `file://`.

## Deploy for free

The site is the repository root. There's no build step.

### Cloudflare Pages (recommended)

1. Push this folder to a GitHub repository.
2. In Cloudflare: **Workers & Pages › Create › Pages › Connect to Git**, then pick the repo.
3. Set the build command to *(none)* and the output directory to `/`.
4. **Custom domains › Set up a domain** and enter your domain (e.g. `setgaps.com`). Cloudflare adds the DNS records and HTTPS.

`_headers` sets `sw.js` to never be cached and adds a few security headers.

### GitHub Pages

1. Push to GitHub. Then **Settings › Pages › Deploy from a branch**, branch `main`, folder `/ (root)`.
2. **Custom domain:** enter your domain, then add the DNS records GitHub shows you. Turn on **Enforce HTTPS**.

GitHub Pages ignores `_headers`. Everything still works.

### Before each deploy

1. Run `node scripts/check-sw.mjs`. It fails if a file in `js/` is missing from the service worker's offline list (`SHELL_FILES` in `sw.js`); add any it names.
2. Bump `VERSION` in `sw.js` (e.g. `v1` → `v2`). Installed copies pick up the new files the next time they're opened.

## Card data

Four sets are bundled so they load instantly and work offline from the first visit: **Delta Reign** (`me06`), **30th Celebration** (`30th`), **Pitch Black** (`me05`) and **Perfect Order** (`me03`). Any other set downloads from TCGdex the first time it's opened, then it's cached on the device.

Set logos load from TCGdex's image server and are cached after the first view. A set without a logo there yet (e.g. Delta Reign) shows its code instead.

Refresh the bundled data, or bundle more sets:

```sh
node scripts/snapshot.mjs           # refresh the bundled sets and the full set list
node scripts/snapshot.mjs sv03.5    # also bundle another set (add it to BUNDLED in the script to keep it)
```

Set ids are listed at https://api.tcgdex.net/v2/en/sets. Released sets rarely change. Re-run the script for promo sets, which keep growing, or to pick up TCGdex fixes.

## Backup file format

```json
{
  "app": "setgaps",
  "version": 1,
  "owner": "Mike",
  "updated": "2026-11-18T20:00:00.000Z",
  "sets": { "30th": { "009": 2, "012": 1 }, "me05": { "001": 1 } }
}
```

- Counts are stored per set id, then per card number.
- A card that isn't listed is missing, 1 means you have it, and 2 or more means you have spares.
- Share links (`#s=...`) hold the same JSON, deflate-compressed and base64url-encoded, in the URL fragment. A fragment is never sent to the server.

## Project layout

```
index.html, styles.css, manifest.webmanifest, sw.js, _headers
js/app.js         start-up, routing, banners
js/views/         home, set, trades, sheets (menu, card details, sharing, install)
js/ui.js          shared components: card tile, stepper, chips, progress bar, set row, sheet, toast
js/store.js       collection state, autosave, import validation, trades
js/share.js       backup files, share links, clipboard
js/api.js         bundled data → device cache → TCGdex
js/tcgdex.js      TCGdex client (shared with the snapshot script)
js/rarity.js      type colours, rarity symbols, "009/128" numbering
js/install.js     device detection and Add to Home Screen steps
js/theme.js       light / dark / auto, applied before the page paints (plain script, not a module)
data/             bundled set list and sets
scripts/          snapshot.mjs (refresh card data), check-sw.mjs (offline file list check)
icons/            app icons
fonts/            Russo One, for the "Set Gaps" wordmark (SIL Open Font License)
PRODUCT.md        who it's for and what must stay true
DESIGN.md         the visual system (tokens, components, rules)
```
