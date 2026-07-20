const express = require('express');
const router = express.Router();
const Purchase = require('../../models/Purchase');

const ALLOWED_MODULES = ['karmkand', 'book', 'emagazine'];

// Optional shared-secret guard (same as Kosh). If PURCHASE_API_KEY is set,
// callers must send it as the `x-purchase-key` header.
function optionalKey(req, res, next) {
  const required = process.env.PURCHASE_API_KEY;
  if (!required) return next();
  if (req.header('x-purchase-key') === required) return next();
  return res.status(401).json({ success: false, message: 'Invalid purchase key' });
}

const norm = (v) => (v == null ? '' : String(v).trim());

// ---- Record a paid content ----
// POST /api/purchase
// body: { module, email?, phone?, contentId, amount?, reference? }  (email OR phone required)
router.post('/', optionalKey, async (req, res) => {
  try {
    const module = norm(req.body.module).toLowerCase();
    const email = norm(req.body.email).toLowerCase();
    const phone = norm(req.body.phone);
    const contentId = norm(req.body.contentId);

    if (!ALLOWED_MODULES.includes(module)) {
      return res.status(400).json({ success: false, message: `module must be one of: ${ALLOWED_MODULES.join(', ')}` });
    }
    if (!contentId || (!email && !phone)) {
      return res.status(400).json({ success: false, message: 'contentId and at least one of email or phone are required' });
    }

    const filter = { module, contentId };
    if (email) filter.email = email;
    else filter.phone = phone;

    const update = {
      module,
      contentId,
      email: email || null,
      phone: phone || null,
      amount: Number(req.body.amount) || 0,
      reference: norm(req.body.reference) || null,
      status: 'paid',
    };

    const purchase = await Purchase.findOneAndUpdate(
      filter,
      { $set: update, $setOnInsert: { createdAt: new Date() } },
      { new: true, upsert: true }
    );

    res.status(201).json({ success: true, purchase });
  } catch (err) {
    console.error('[purchase] record error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---- List a user's purchased content ids for a module ----
// GET /api/purchase?module=...&email=...&phone=...
router.get('/', async (req, res) => {
  try {
    const module = norm(req.query.module).toLowerCase();
    const email = norm(req.query.email).toLowerCase();
    const phone = norm(req.query.phone);
    if (!ALLOWED_MODULES.includes(module)) {
      return res.status(400).json({ success: false, message: `module must be one of: ${ALLOWED_MODULES.join(', ')}` });
    }
    if (!email && !phone) {
      return res.status(400).json({ success: false, message: 'email or phone is required' });
    }
    const or = [];
    if (email) or.push({ email });
    if (phone) or.push({ phone });
    const rows = await Purchase.find({ module, status: 'paid', $or: or }).select('contentId -_id').lean();
    res.json({ success: true, contentIds: [...new Set(rows.map((r) => r.contentId))] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
