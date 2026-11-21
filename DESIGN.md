---
name: SetGaps
description: A binder page for your Pokémon TCG sets. See what you have, what you're missing and what you can swap.
colors:
  trainer-blue: "#3B5BDB"
  trainer-blue-deep: "#2F4AC0"
  trainer-blue-night: "#5C7CFA"
  page-grey: "#F4F5F7"
  card-white: "#FFFFFF"
  slot-grey: "#ECEEF1"
  ink: "#16181D"
  pencil-grey: "#5C6370"
  hairline: "#E1E4E8"
  edge-grey: "#C9CED6"
  night-page: "#0F1115"
  night-card: "#181B21"
  night-slot: "#232731"
  night-ink: "#ECEEF1"
  night-pencil: "#A3AAB5"
  night-hairline: "#2A2F38"
  get-wash: "#E7ECFF"
  get-ink: "#1E3A8A"
  give-wash: "#FFF4E6"
  give-ink: "#8A3B00"
  ember-dot: "#E8590C"
  banner-dot: "#FF922B"
  banner-line: "#6B7280"
  spare-yellow: "#FFE066"
  danger-red: "#C92A2A"
  type-grass: "#237A35"
  type-fire: "#C92A2A"
  type-water: "#1971C2"
  type-lightning: "#FAB005"
  type-psychic: "#9C36B5"
  type-fighting: "#A0522D"
  type-darkness: "#343A40"
  type-metal: "#ADB5BD"
  type-dragon: "#C99A06"
  type-fairy: "#C2255C"
  type-colorless: "#DEE2E6"
  rarity-silver: "#7A828C"
  rarity-gold: "#B08900"
  rarity-pink: "#D6336C"
typography:
  wordmark:
    fontFamily: "Russo One, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.01em"
  number:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "22px"
    fontWeight: 800
    lineHeight: 1.1
    fontFeature: "tnum"
  stat:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "28px"
    fontWeight: 800
    lineHeight: 1.1
  headline:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.4
  input:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.4
  control:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.4
  body-small:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.4
  label:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.06em"
  micro:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.4
  tag:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "10px"
    fontWeight: 700
    lineHeight: 1.4
  tag-tight:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "9px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.04em"
rounded:
  sm: "8px"
  md: "10px"
  lg: "12px"
  xl: "16px"
  sheet: "20px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  gutter: "16px"
  gutter-wide: "24px"
  lg: "32px"
components:
  button-primary:
    backgroundColor: "{colors.trainer-blue}"
    textColor: "{colors.card-white}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "44px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.trainer-blue-deep}"
  button-secondary:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "44px"
  button-dark:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.card-white}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "44px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.pencil-grey}"
    rounded: "{rounded.lg}"
    height: "44px"
  chip:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 12px"
    height: "34px"
    typography: "{typography.body-small}"
  chip-on:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.card-white}"
    rounded: "{rounded.pill}"
  pill-get:
    backgroundColor: "{colors.get-wash}"
    textColor: "{colors.get-ink}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
  pill-give:
    backgroundColor: "{colors.give-wash}"
    textColor: "{colors.give-ink}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
  rarity-pill:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 6px"
    typography: "{typography.micro}"
  input-search:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "0 12px"
    height: "44px"
  card-tile:
    rounded: "{rounded.lg}"
    padding: "8px"
  set-row:
    backgroundColor: "{colors.card-white}"
    rounded: "{rounded.lg}"
    padding: "12px"
    height: "56px"
---

# Design System: SetGaps

## Overview

**Creative North Star: "The Binder Page"**

SetGaps looks and works like a page in a collector's binder: an orderly grid of slots. Filled slots wear their card's type colour. Empty slots are dashed outlines waiting for a card. The interface around them is neutral: page grey, card white, ink text and fine hairlines. That way the eye goes to the slots, to what's in and what's missing.

The mood is clean, sorted and quietly playful. One confident accent, Trainer Blue, marks action and progress. Everything else is neutral, and the playfulness comes from the hobby itself: eleven type colours, rarity stars in black, silver and gold, a yellow spare count. The interface doesn't add its own decoration. Get blue and give orange are a separate pair that appears only when friends compare collections.

It's built for a phone in one hand while the other holds cards. Light and dark themes are equal citizens, and every role token has a matching night value.

**Key Characteristics:**
- A neutral page with colour that lives in the slots (type colours) and in actions (Trainer Blue).
- Filled vs missing reads at a glance: solid type fill vs a dashed outline on card white.
- Printed card numbers (e.g. "009/128") are the biggest, heaviest type on the screen.
- The system font everywhere except the wordmark, so it feels native and fast on every phone.
- One 12px corner radius family. Pills for anything that's a tag or a filter.
- Flat surfaces with hairline borders. Shadows go only on owned card tiles (a soft lift) and on things that float above the page.

## Colors

A neutral binder page carrying one strong blue, a get/give pair for trading, and the hobby's own type and rarity colours.

### Primary
- **Trainer Blue** (#3B5BDB; night #5C7CFA): primary buttons, the progress fill, links, focus rings, the "+" on the large stepper, the avatar and the app icon background. It means "act here" or "how far along you are".
- **Trainer Blue Deep** (#2F4AC0): hover/pressed state of primary buttons in light mode. Night mode brightens to #748FFC instead.

### Secondary
- **Get Wash / Get Ink** (#E7ECFF / #1E3A8A): cards a friend has that you need. Used on pills, stat blocks, the friend banner and the friend line on the card sheet.
- **Give Wash / Give Ink** (#FFF4E6 / #8A3B00): your spares a friend needs.

### Tertiary
- **Ember Dot** (#E8590C): the small "unsaved changes" dot on the menu button. That's its only job. The backup banner's dot uses the lighter **Banner Dot** (#FF922B) to read on dark, and the banner's ghost button border is **Banner Line** (#6B7280).
- **Spare Yellow** (#FFE066): the count badge on a tile once you own 2 or more. It's the only yellow in the chrome, so spares pop.
- **Danger Red** (#C92A2A; night #FF8787): destructive buttons and error text only.

### Type colours (slot fills, from `js/rarity.js`)
Grass #237A35, Fire #C92A2A, Water #1971C2, Lightning #FAB005, Psychic #9C36B5, Fighting #A0522D, Darkness #343A40, Metal #ADB5BD, Dragon #C99A06, Fairy #C2255C, Colorless #DEE2E6. Text on Lightning, Metal, Dragon and Colorless is Ink. All the others take white. Trainers are card white with an Edge Grey border.

### Rarity symbols
These sit on an always-white pill so they read the same in both themes: black (●, ◆, ★, ★★), **Rarity Silver** #7A828C (Ultra Rare), **Rarity Gold** #B08900 (illustration/hyper/secret), gold plus an amber glow ring (Mega Hyper Rare), **Rarity Pink** #D6336C (ACE SPEC), and an inverted ink pill for PROMO.

### Neutral
- **Page Grey** (#F4F5F7; night #0F1115): the app background behind everything.
- **Card White** (#FFFFFF; night #181B21): top bar, controls, rows, sheets, empty slots.
- **Slot Grey** (#ECEEF1; night #232731): recessed fills, including icon buttons, the segmented-control track, progress tracks and the set abbreviation block.
- **Ink** (#16181D; night #ECEEF1): body text, and the "dark" chip/button fill (which flips to light in night mode).
- **Pencil Grey** (#5C6370; night #A3AAB5): secondary text, group titles, missing-slot text.
- **Hairline** (#E1E4E8; night #2A2F38): dividers and row borders.
- **Edge Grey** (#C9CED6; night #3E4550): interactive borders (buttons, inputs, chips) and the sheet handle.

### Named Rules
**The Slots Carry the Colour Rule.** Chrome stays neutral. Strong colour belongs to card-type fills, rarity symbols and Trainer Blue actions. Never add a decorative colour to a container.

**The Paired Theme Rule.** Every role colour ships with a night value. Never put a raw hex in a component when a role token exists. The rarity pill and the dark-banner buttons are the only deliberate exceptions.

## Typography

**Wordmark Font:** Russo One (self-hosted at `fonts/russo-one.woff2`, precached by the service worker), slanted with `skewX(-10deg)`
**Display Font:** system-ui (with -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial)
**Body Font:** the same system stack

**Character:** Russo One echoes the hand-drawn logo's heavy, squared-off rounded letters and is used for the "Set Gaps" wordmark only. Everything else is a single native family, so it reads like the phone's own apps. Hierarchy comes from weight (400 → 800) and size, not from a second typeface. Card numbers are the loudest thing on the page.

### Hierarchy
- **Wordmark** (Russo One 400, 24px, 1, 0.01em, slanted -10°): "Set Gaps" in the Home top bar. Nowhere else.
- **Number** (800, 22px, 1.1, tabular figures): the printed card number on tiles and in the card sheet. On tiles the "/128" part drops to 12px/600 so the card's own number leads. The big stepper count goes up to 28px/800, and trade stat figures are also 28px/800.
- **Headline** (700, 20px, 1.2): screen titles in the top bar. They truncate with an ellipsis instead of wrapping.
- **Title** (700, 18px): sheet titles; 22px for the card name in the card sheet.
- **Body** (400, 15px, 1.4): default text. Buttons use body size at weight 600. Inputs use 16px to stop iOS from zooming.
- **Body Small** (600, 13px): chips, pills, field labels, banner detail and hints.
- **Label** (700, 12px, 0.06em, uppercase): group titles such as section headers above lists.
- **Stat** (800, 28px): the big stepper count and trade totals.
- **Input** (400, 16px): every text field. 16px stops iOS from zooming on focus.
- **Control** (600, 14px): the "+ Add" button, tile counts, toasts and the friend line.
- **Micro** (600–700, 11px): tile names, rarity pills and the footer disclaimer.
- **Tag** (700, 10px) and **Tag tight** (700, 9px, 0.04em): set abbreviation blocks; PROMO and text-rarity pills. Never smaller than 9px for text. The only 8px value is the common-rarity ● glyph, which is a symbol rather than text.

### Named Rules
**The Number Leads Rule.** On any card surface, the printed number outweighs the name. Collectors match on the number in their hand first.

## Layout

The app is a single column, up to 960px wide and centred, on Page Grey. Side gutters are 16px, or 24px at 700px and wider. A sticky Card White top bar (with the safe-area inset) sits above a Card White controls band. Each has a hairline bottom border. Content flows below on the grey page.

- **Binder grid:** `repeat(auto-fill, minmax(104px, 1fr))` with 8px gaps, so about 3 slots across a phone. The minimum goes to 120px at 700px and wider.
- **Lists:** set rows and card results stack with 8px gaps. Rows are at least 56px tall. At 700px and wider, lists flow into columns (`minmax(340px, 1fr)`, reading left to right, then down) so progress bars stay short enough to compare, and the Home controls and trade totals cap at 560px.
- **Rhythm:** 4 / 6 / 8 / 12 / 16 / 32px. 8px between siblings, 12px inside rows and bands, 16px gutters, 32–48px for empty states and the footer.
- **Bottom space:** views end with 32px plus the safe area. The set view reserves 80px to clear the find bar. On Home, while the backup banner shows, the footer pads by 180px so the banner never covers the last row.
- **Sheets:** bottom sheets up to 560px wide and 92dvh tall, with 20px side padding. Their content stacks in a column with 16px gaps.

## Elevation & Depth

Depth comes mainly from tone: Page Grey under Card White under Slot Grey, separated by 1px hairlines. Shadows are reserved for owned card tiles and for things that float above the page.

### Shadow Vocabulary
- **Tile lift** (`--tile-lift`; light `0 1px 2px rgba(22,24,29,0.12), 0 3px 8px rgba(22,24,29,0.1)`, night `0 1px 2px rgba(0,0,0,0.5), 0 3px 10px rgba(0,0,0,0.35)`): owned card tiles only.
- **Float** (`box-shadow: 0 8px 24px rgba(0,0,0,0.25)`): the backup banner, which floats over content.
- **Segment lift** (`box-shadow: 0 1px 2px rgba(0,0,0,0.12)`): the selected option in a segmented control.
- **Flash ring** (`box-shadow: 0 0 0 4px var(--accent)`): a pulsing ring that highlights a tile you jumped to.
- **Sheets** use the backdrop dim (ink at 50%, or black at 60% at night) rather than a shadow.

### Named Rules
**The Lifted Card Rule.** Owned card tiles carry Tile lift so they feel like physical cards sitting in their slots. Missing slots stay flat and dashed, so the lift itself signals "owned". The flash pulse animates only its peak, so it starts and ends on the tile's own shadow. Rows, chips and bands stay flat.

## Shapes

One gently rounded family. Corners are 12px on buttons, tiles, rows, inputs, banners and cards. They tighten to 8–10px on small nested things (segment buttons, fields, the set abbreviation block) and open up to 16px (the floating banner) and 20px (the sheet's top corners). Anything that's a tag, filter, count or rarity is a full pill (999px). Borders are 1px, except card tiles, which have a 2px border in the type colour. Missing tiles switch that border to **dashed**; that's the system's signature shape cue. Card art keeps the real card proportion (63:88) with 12px corners.

## Components

**Direction (user-confirmed): refined and compact.** Today's components are chunky and thumb-sized. Future refinement should tighten the visual weight and density: lighter padding, less bulk and more slots per screen. Hit areas stay at least 44px (PRODUCT.md: one-handed use, younger collectors). Compact is about how things look, never about smaller tap targets.

### Buttons
- **Shape:** gently rounded (12px), 44px minimum height (52px "big", 36px "small").
- **Primary:** Trainer Blue fill with white text, weight 600, 16px horizontal padding. Hover moves to Trainer Blue Deep.
- **Secondary:** Card White with an Edge Grey border and Ink text.
- **Dark:** an Ink fill that inverts in night mode, for the strongest non-brand action.
- **Ghost:** transparent with Pencil Grey text, for "Later" or dismiss.
- **Danger / Danger outline:** a red fill, or red text on secondary.
- **On-dark pair (banner):** a white solid (weight 2) beside a grey-outlined ghost (weight 1).
- **Focus:** a 3px Trainer Blue outline with a 2px offset, everywhere. Inside tiles, which clip their edges, the offset is -3px so the ring draws inward.

### Chips
- **Style:** 34px pill, Card White with an Edge Grey border, 13px/600.
- **State:** selected chips invert to an Ink fill. The "trade" chip uses Trainer Blue for its border and text. Select chips draw a CSS chevron.
- **Filter row (set view):** chips and the rarity select stay on one line and scroll sideways on narrow screens. The row bleeds to the screen edges, with no visible scrollbar, so a chip cut off at the edge shows there's more.

### Card Tile (signature)
- **Owned:** a solid type-colour fill with a 2px border in the same colour, raised with Tile lift. Number at 22/800 with "/128" at 12/600. The name is 11px and truncates, next to a rarity pill.
- **Missing:** Card White with a **dashed** 2px border in the type colour and Pencil Grey text.
- **Stepper footer:** − / count / + on Card White under a hairline. The count becomes a Spare Yellow pill at 2 or more. Missing tiles show a single full-width "+ Add" button (14px/600, the whole footer is the target) instead of a disabled − and a 0.
- **Friend badge:** a small pill, with the name shortening before the count. Get has a blue wash and Trainer Blue outline; give has an orange wash and Give Ink outline. Ember stays reserved for "unsaved changes".
- Skips rendering when off screen (`content-visibility: auto`) so big sets stay fast.

### Set Complete (signature moment)
Two milestones, matching how collectors count: **numbered set complete** (every card up to the printed count, e.g. 84/84) and **set complete** (every card, secret rares included).
- **Note:** above the grid while the milestone holds. Trainer Blue 1px border, a 10% Trainer Blue tint on Card White, a 32px Trainer Blue circle with a check, a bold title ("Pitch Black complete!" / "Numbered set complete!") and a muted detail line ("36 secret rares to go."). It rises in (0.3s) and disappears if a card drops back to 0.
- **The moment:** only when a milestone is newly reached, owned tiles rise 5px and settle in a wave from the top left (0.6s expo-out, 18ms stagger, capped at 40 tiles). It's announced to screen readers through a hidden live region. Ordinary taps never celebrate, and reduced motion turns the wave off.
- **Home row:** a complete set gets a 20px Trainer Blue check badge on the corner of its logo, and its line reads "Complete · N spares".

### Rarity Pill
Always white with a hairline border, whatever the theme. The symbol's colour carries the tier (see Colors). It never shrinks below its content.

### Set Row
A Card White row with a hairline border and 12px corners, at least 56px tall. On the left, an 84×48 slot with the set's official logo from TCGdex, which is the row's one burst of colour. Until the logo loads, or if there isn't one, the slot shows the set code ("ME06") on Slot Grey. Then the set name (600, ellipsis) above a 6px Trainer Blue progress bar on a Slot Grey track. It's one shared component on Home and Trades. Trades swaps the bottom line for Get / Give pills and opens the set pre-filtered.

### Inputs / Fields
- **Search:** a 44px Card White box with an Edge Grey border, 12px corners, a muted icon and 16px text.
- **Find bar (set view):** the set's search lives in a bar pinned to the bottom of the screen, in thumb reach, on Card White with a hairline top border and the safe-area inset (max 960px wide, field max 560px). Tapping it selects the previous search so the next number replaces it. Searching from deep in the set scrolls the matches into view. Toasts sit above it.
- **Field:** a 13px/600 Pencil Grey label above the input. 10px corners. Errors show as Danger Red 13px text below.

### Navigation
A sticky top bar. On Home it shows the "Set Gaps" wordmark in Russo One (no logo image, no owner line). Inner screens show a back button, the screen title and a one-line subtitle (both truncate, never wrap), with any action as a 44px icon button (e.g. copy the missing list) so the bar stays one line at 320px. Icon buttons are 44px, on Slot Grey. An Ember dot on the menu button means "unsaved changes". Below it, a segmented control (a Slot Grey track, with the active option raised on Card White) switches views.

### Bottom Sheet & Banner
- **Sheet:** Card White with 20px top corners and a 40×5 handle. It slides up over a dimmed backdrop (rise, 0.25s ease-out).
- **Backup banner:** an ink card floating 12–16px from the edges, with 16px corners and the Float shadow, holding a dot, text, and the on-dark button pair.
- **Toast:** an Ink pill-card that slides and fades up from the bottom (0.2s).

## Do's and Don'ts

### Do:
- **Do** show every card number as printed ("009/128"), as the heaviest type on its surface.
- **Do** mark a missing card with a dashed outline in its type colour on Card White, never a greyed-out fill.
- **Do** use role tokens (`--accent`, `--surface`, `--muted`…) so both themes stay paired.
- **Do** keep tap targets at least 44px even as components get visually more compact.
- **Do** keep the rarity pill white in both themes so symbol colours stay true.
- **Do** respect `prefers-reduced-motion`. All animation and transitions turn off.

### Don't:
- **Don't** use Russo One outside the wordmark, or add any other typeface. Hierarchy comes from weight and size in the system stack.
- **Don't** add decorative colour to chrome. Colour belongs to type fills, rarity symbols, Trainer Blue actions and get/give.
- **Don't** use get blue or give orange for anything except trading.
- **Don't** shadow flat surfaces (rows, chips, bands). Shadows are for floating layers and owned card tiles.
- **Don't** go below 9px text, or put Ink text on a type colour that takes white (or the reverse). Follow the table in `js/rarity.js`.
