// Tile colour per type and the rarity symbol per TCGdex rarity name. One table each; edit here.

const TYPE_STYLES = {
  Grass: { bg: '#237A35', fg: '#FFFFFF' },
  Fire: { bg: '#C92A2A', fg: '#FFFFFF' },
  Water: { bg: '#1971C2', fg: '#FFFFFF' },
  Lightning: { bg: '#FAB005', fg: '#16181D' },
  Psychic: { bg: '#9C36B5', fg: '#FFFFFF' },
  Fighting: { bg: '#A0522D', fg: '#FFFFFF' },
  Darkness: { bg: '#343A40', fg: '#FFFFFF' },
  Metal: { bg: '#ADB5BD', fg: '#16181D' },
  Dragon: { bg: '#C99A06', fg: '#16181D' },
  Fairy: { bg: '#C2255C', fg: '#FFFFFF' },
  Colorless: { bg: '#DEE2E6', fg: '#16181D' },
};
const TRAINER = { bg: '#FFFFFF', fg: '#16181D', border: '#C9CED6' };

// cat: 'P' Pokémon, 'T' Trainer, 'E' Energy (from the bundled set rows).
export function typeStyle(type, cat) {
  if (cat === 'T') return { ...TRAINER, label: 'Trainer' };
  const style = TYPE_STYLES[type] || TYPE_STYLES.Colorless;
  const label = cat === 'E' ? (type ? `${type} Energy` : 'Energy') : type || 'Pokémon';
  return { ...style, border: style.bg, label };
}

// cls picks the symbol colour in styles.css (.r-black, .r-silver, .r-gold, .r-pink, .r-promo, .r-text).
const RARITIES = {
  common: ['●', 'black dot', 'Common'],
  uncommon: ['◆', 'black', 'Uncommon'],
  rare: ['★', 'black', 'Rare'],
  'holo rare': ['★', 'black', 'Holo Rare'],
  'rare holo': ['★', 'black', 'Holo Rare'],
  'double rare': ['★★', 'black', 'Double rare'],
  'holo rare v': ['★★', 'black', 'Holo Rare V'],
  'holo rare vmax': ['★★', 'black', 'Holo Rare VMAX'],
  'holo rare vstar': ['★★', 'black', 'Holo Rare VSTAR'],
  'ultra rare': ['★★', 'silver', 'Ultra Rare'],
  'illustration rare': ['★', 'gold', 'Illustration rare'],
  'special illustration rare': ['★★', 'gold', 'Special illustration rare'],
  'hyper rare': ['★★★', 'gold', 'Hyper rare'],
  'secret rare': ['★★★', 'gold', 'Secret Rare'],
  'mega hyper rare': ['★★★', 'gold glow', 'Mega Hyper Rare'],
  'ace spec rare': ['★', 'pink', 'ACE SPEC Rare'],
  'radiant rare': ['✦', 'black', 'Radiant Rare'],
  promo: ['PROMO', 'promo', 'Promo'],
  // New in 30th Celebration. Text until we pick symbols.
  'pikachu rare': ['PIKA', 'text', 'Pikachu Rare'],
  'rgb rare': ['RGB', 'text', 'RGB Rare'],
  'futuristic rare': ['FUT', 'text', 'Futuristic Rare'],
};

// Rough order, low to high, for the rarity filter.
const ORDER = ['common', 'uncommon', 'rare', 'holo rare', 'rare holo', 'radiant rare', 'ace spec rare', 'double rare',
  'holo rare v', 'holo rare vmax', 'holo rare vstar', 'ultra rare', 'illustration rare', 'pikachu rare',
  'special illustration rare', 'futuristic rare', 'rgb rare', 'hyper rare', 'secret rare', 'mega hyper rare', 'promo'];

export function rarityInfo(rarity) {
  const key = (rarity || '').trim().toLowerCase();
  if (!key || key === 'none') return null;
  const known = RARITIES[key];
  if (known) return { sym: known[0], cls: known[1], label: known[2], key };
  // Unknown (often older sets): short text, e.g. "Rare Holo LV.X" -> "LV.X".
  const words = rarity.trim().split(/\s+/);
  const last = words[words.length - 1];
  const sym = last.length <= 5 ? last.toUpperCase() : words.map((w) => w[0]).join('').toUpperCase().slice(0, 4);
  return { sym, cls: 'text', label: rarity.trim(), key };
}

export function rarityRank(key) {
  const i = ORDER.indexOf(key);
  return i < 0 ? ORDER.length : i;
}

// Printed number: "009/128". Secret rares go above the count ("140/128"); letters print alone ("R").
export function cardNumber(localId, official) {
  return official && /^\d+$/.test(localId) ? `${localId}/${official}` : localId;
}
