// Fixed advertisement placements. Every placement can hold at most ONE
// advertisement. The Kosh section is special: every Kosh category is its
// own placement, keyed as `kosh_cat:<categoryId>`.
const KoshCategory = require('../models/KoshCategory');

const FIXED_PLACEMENTS = [
  { key: 'kundli',        label: 'Kundli',        group: 'App' },
  { key: 'kundli_match',  label: 'Kundli Match',  group: 'App' },
  { key: 'panchang',      label: 'Panchang',      group: 'App' },
  { key: 'karmkand',      label: 'Karmkand',      group: 'Content' },
  { key: 'book',          label: 'Book',          group: 'Content' },
  { key: 'rashifal',      label: 'Rashifal',      group: 'Horoscope' },
  { key: 'numerology',    label: 'Numerology',    group: 'Horoscope' },
  { key: 'emagazine',     label: 'E-Magazine',    group: 'Content' },
];

const KOSH_CAT_PREFIX = 'kosh_cat:';

const PLACEMENT_TYPES = [...FIXED_PLACEMENTS.map((p) => p.key), 'kosh_cat'];

function isKoshCatKey(key) {
  return typeof key === 'string' && key.startsWith(KOSH_CAT_PREFIX);
}

function koshCatKey(categoryId) {
  return `${KOSH_CAT_PREFIX}${categoryId}`;
}

// Returns every placement (fixed + one per Kosh category) as
// { key, label, group, placementType, placementRef }.
async function listAllPlacements() {
  const fixed = FIXED_PLACEMENTS.map((p) => ({ ...p, placementType: p.key, placementRef: null }));

  const cats = await KoshCategory.find().sort({ position: 1 }).lean();
  const kosh = cats.map((c) => ({
    key: koshCatKey(c._id),
    label: `Kosh › ${c.name}`,
    group: 'Kosh',
    placementType: 'kosh_cat',
    placementRef: String(c._id),
    koshCategoryNumericId: c.id ?? null,
  }));

  return [...fixed, ...kosh];
}

// Validates a placement key and returns its normalized descriptor, or null.
async function resolvePlacement(key) {
  if (!key) return null;
  const fixed = FIXED_PLACEMENTS.find((p) => p.key === key);
  if (fixed) return { ...fixed, placementType: fixed.key, placementRef: null };

  if (isKoshCatKey(key)) {
    const id = key.slice(KOSH_CAT_PREFIX.length);
    if (!/^[a-f\d]{24}$/i.test(id)) return null;
    const cat = await KoshCategory.findById(id).lean();
    if (!cat) return null;
    return {
      key,
      label: `Kosh › ${cat.name}`,
      group: 'Kosh',
      placementType: 'kosh_cat',
      placementRef: cat._id,
      koshCategoryNumericId: cat.id ?? null,
    };
  }
  return null;
}

module.exports = { FIXED_PLACEMENTS, PLACEMENT_TYPES, KOSH_CAT_PREFIX, isKoshCatKey, koshCatKey, listAllPlacements, resolvePlacement };
