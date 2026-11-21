# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The owner and a small circle of friends who collect the Pokémon TCG together. They use it mid-session: opening packs, sorting binders, and meeting up to swap spares. The circle may include their children.

## Product Purpose

SetGaps tracks a Pokémon TCG collection one set at a time: what you have, what you're missing and your spares. It also lets friends compare collections to see who can swap what. Success means checking cards off is quick enough to keep up with ripping packs, and a trade night ends with everyone knowing which spares to hand over.

## Positioning

- **No account; your data stays local.** There's no sign-up and no cloud. The collection lives on your device and moves as a JSON backup file or a share link. That link is compressed into the URL fragment, which is never sent to a server.
- **Trading spares with friends.** Load a friend's share link to see straight away which of your spares they need, and which of theirs you need.
- **Fast offline entry.** Tap-to-count tiles keep up while you open packs. Bundled sets and any set you've opened before work with no signal.

## Operating Context

- Most use is on a phone, installed to the Home Screen as a PWA. The install prompt suggests installing but never blocks the browser.
- Entry happens with cards in hand. Each card number is shown exactly as printed (e.g. "009/128") so cards aren't added to the wrong set.
- Trades happen face to face. Collections are swapped as share links (`#s=...`) or backup files.
- After changes, a backup banner (Later / Save backup) reminds people to save a backup file, because the browser's storage is the only copy.

## Capabilities and Constraints

- Static PWA: vanilla JS modules with no build step. Free static hosting (Cloudflare Pages or GitHub Pages). No server, database, accounts or API keys.
- Card data comes from TCGdex. Delta Reign (`me06`), 30th Celebration (`30th`), Pitch Black (`me05`) and Perfect Order (`me03`) are bundled. Other sets are fetched from TCGdex the first time they're opened and then cached on the device.
- Storage: localStorage autosave, JSON backup files (format in README.md), and deflate-compressed share links.
- Card tiles are coloured by Pokémon type and carry a rarity-symbol pill instead of a card image. The image appears only in the card details sheet.
- One count per card number. There's no variant (reverse holo, etc.) tracking yet.
- Light, dark and auto themes.
- **Open:** whether prices will ever appear, and whether the app stays backend-free forever. Neither is ruled out yet; both are left undecided on purpose.
- **Open:** symbols for Pikachu Rare, RGB Rare and Futuristic Rare (currently shown as the text PIKA / RGB / FUT), and whether to bundle the 30th Classic Collection (`30th-c`).
- **Known gaps:** count changes aren't announced to screen readers.

## Brand Commitments

- Name: **SetGaps**. setgaps.com and setgaps.app were available on 2026-11-18; registration isn't confirmed.
- Logo: bold, slanted, rounded-block letters, with an outlined "G" behind a solid "S" (the S has hooks at both ends so it doesn't read as "5"). White on #3B5BDB. Source: `icons/icon.svg`.
- Content must be kid-friendly: readable and appropriate for younger collectors.
- A disclaimer is required: not affiliated with Nintendo, Creatures, GAME FREAK or The Pokémon Company. Card data is credited to TCGdex.

## Evidence on Hand

- Real card data for the bundled sets in `data/`, and the full set list from TCGdex.
- App icons in `icons/`.
- There are no users, testimonials, usage numbers or press. Don't invent any.

## Product Principles

1. **The collector's hands are full.** Entry has to work one-handed, fast and offline, mid-pack.
2. **The data belongs to the collector.** No accounts and no silent cloud. Saving a backup and sharing stay explicit, visible actions.
3. **Gaps and spares are the point.** Every screen should answer "what am I missing?" or "what can I swap?".
4. **Match the card in your hand.** Use the printed numbers, set names and rarity symbols collectors already know.
5. **Safe for the whole table.** Language and content suit younger collectors too.

## Accessibility & Inclusion

- Younger collectors may use it, so copy stays plain and short and tap targets stay generous.
- Screen-reader announcements for count changes are an open gap (see Known gaps).
