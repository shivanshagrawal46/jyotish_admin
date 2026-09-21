// Fixed advertisement placements. Every placement can hold at most ONE
// advertisement. The Kosh section is special: every Kosh sub category is its
// own placement, keyed as `kosh_sub:<subCategoryId>`.
const KoshSubCategory = require('../models/KoshSubCategory');

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

const KOSH_SUB_PREFIX = 'kosh_sub:';

const PLACEMENT_TYPES = [...FIXED_PLACEMENTS.map((p) => p.key), 'kosh_sub'];

function isKoshSubKey(key) {
  return typeof key === 'string' && key.startsWith(KOSH_SUB_PREFIX);
}

function koshSubKey(subCategoryId) {
  return `${KOSH_SUB_PREFIX}${subCategoryId}`;
}

// Returns every placement (fixed + one per Kosh sub category) as
// { key, label, group, placementType, placementRef }.
async function listAllPlacements() {
  const fixed = FIXED_PLACEMENTS.map((p) => ({ ...p, placementType: p.key, placementRef: null }));

  const subs = await KoshSubCategory.find()
    .populate('parentCategory', 'name position')
    .sort({ position: 1 })
    .lean();

  const kosh = subs
    .sort((a, b) => (a.parentCategory?.position ?? 0) - (b.parentCategory?.position ?? 0) || a.position - b.position)
    .map((s) => ({
      key: koshSubKey(s._id),
      label: `${s.parentCategory?.name ? s.parentCategory.name + ' › ' : ''}${s.name}`,
      group: 'Kosh',
      placementType: 'kosh_sub',
      placementRef: String(s._id),
      koshSubCategoryNumericId: s.id ?? null,
    }));

  return [...fixed, ...kosh];
}

// Validates a placement key and returns its normalized descriptor, or null.
async function resolvePlacement(key) {
  if (!key) return null;
  const fixed = FIXED_PLACEMENTS.find((p) => p.key === key);
  if (fixed) return { ...fixed, placementType: fixed.key, placementRef: null };

  if (isKoshSubKey(key)) {
    const id = key.slice(KOSH_SUB_PREFIX.length);
    if (!/^[a-f\d]{24}$/i.test(id)) return null;
    const sub = await KoshSubCategory.findById(id).populate('parentCategory', 'name').lean();
    if (!sub) return null;
    return {
      key,
      label: `${sub.parentCategory?.name ? sub.parentCategory.name + ' › ' : ''}${sub.name}`,
      group: 'Kosh',
      placementType: 'kosh_sub',
      placementRef: sub._id,
      koshSubCategoryNumericId: sub.id ?? null,
    };
  }
  return null;
}

module.exports = { FIXED_PLACEMENTS, PLACEMENT_TYPES, KOSH_SUB_PREFIX, isKoshSubKey, koshSubKey, listAllPlacements, resolvePlacement };
