const express = require('express');
const router = express.Router();
const KoshPurchase = require('../../models/KoshPurchase');

// Optional shared-secret guard. If PURCHASE_API_KEY is set in the environment,
// callers must send it as the `x-purchase-key` header. This stops random clients
// from marking content as paid. Recommended: have your payment backend send it.
function optionalKey(req, res, next) {
  const required = process.env.PURCHASE_API_KEY;
  if (!required) return next(); // not configured -> open (dev-friendly)
  if (req.header('x-purchase-key') === required) return next();
  return res.status(401).json({ success: false, message: 'Invalid purchase key' });
}

const norm = (v) => (v == null ? '' : String(v).trim());

// ---- Record a paid content ----
// POST /api/kosh-purchase
// body: { email?, phone?, contentId, amount?, reference? }  (email OR phone required)
router.post('/', optionalKey, async (req, res) => {
  try {
    const email = norm(req.body.email).toLowerCase();
    const phone = norm(req.body.phone);
    const contentId = parseInt(req.body.contentId, 10);

    if (!contentId || Number.isNaN(contentId) || (!email && !phone)) {
      return res.status(400).json({
        success: false,
        message: 'contentId and at least one of email or phone are required',
      });
    }

    // Dedupe on (identifier + content) so re-posting the same purchase is idempotent.
    const filter = { contentId };
    if (email) filter.email = email;
    else filter.phone = phone;

    const update = {
      contentId,
      email: email || null,
      phone: phone || null,
      amount: Number(req.body.amount) || 0,
      reference: norm(req.body.reference) || null,
      status: 'paid',
    };

    const purchase = await KoshPurchase.findOneAndUpdate(
      filter,
      { $set: update, $setOnInsert: { createdAt: new Date() } },
      { new: true, upsert: true }
    );

    res.status(201).json({ success: true, purchase });
  } catch (err) {
    console.error('[koshPurchase] record error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---- List a user's purchased content ids ----
// GET /api/kosh-purchase?email=...&phone=...
router.get('/', async (req, res) => {
  try {
    const email = norm(req.query.email).toLowerCase();
    const phone = norm(req.query.phone);
    if (!email && !phone) {
      return res.status(400).json({ success: false, message: 'email or phone is required' });
    }
    const or = [];
    if (email) or.push({ email });
    if (phone) or.push({ phone });
    const rows = await KoshPurchase.find({ status: 'paid', $or: or })
      .select('contentId -_id')
      .lean();
    res.json({ success: true, contentIds: [...new Set(rows.map((r) => r.contentId))] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
