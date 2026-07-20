const Purchase = require('../models/Purchase');

// Returns the set of contentIds (as strings) a user has paid for in a module.
async function getPurchasedContentIds(module, email, phone) {
  const e = (email || '').trim().toLowerCase();
  const p = (phone || '').trim();
  if (!e && !p) return new Set();
  const or = [];
  if (e) or.push({ email: e });
  if (p) or.push({ phone: p });
  const rows = await Purchase.find({ module, status: 'paid', $or: or })
    .select('contentId -_id')
    .lean();
  return new Set(rows.map((r) => String(r.contentId)));
}

/**
 * Gate a list of plain (lean) content objects: paid entries the user hasn't
 * bought get their body fields stripped and locked:true. Free entries and
 * purchased entries are returned in full with locked:false.
 *
 * @param {Array<Object>} items       plain objects (use .lean()), each with a `payment` flag
 * @param {Object} opts
 * @param {string} opts.module        e.g. 'karmkand'
 * @param {string} opts.email
 * @param {string} opts.phone
 * @param {string} opts.idField       field on each item that identifies it (e.g. 'id' or '_id')
 * @param {string[]} opts.bodyFields  fields to hide when locked
 */
async function gateItems(items, { module, email, phone, idField = 'id', bodyFields = [] }) {
  const hasPaid = items.some((i) => i && i.payment);
  const purchased = hasPaid ? await getPurchasedContentIds(module, email, phone) : new Set();
  return items.map((it) => {
    if (!it || !it.payment) return { ...it, locked: false, purchased: true };
    if (purchased.has(String(it[idField]))) return { ...it, locked: false, purchased: true };
    const preview = { ...it };
    bodyFields.forEach((f) => {
      delete preview[f];
    });
    return { ...preview, locked: true, purchased: false };
  });
}

module.exports = { getPurchasedContentIds, gateItems };
