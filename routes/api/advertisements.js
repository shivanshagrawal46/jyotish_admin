// Public advertisement API for the Flutter app.
//
//   GET  /api/advertisements/placements                     → all placement keys
//   GET  /api/advertisements/active                         → every live ad, keyed by placement
//   GET  /api/advertisements/active?placement=kundli        → the one live ad for a placement
//   GET  /api/advertisements/active?koshSubCategoryId=<id>  → live ad for a Kosh sub category
//   POST /api/advertisements/:id/impression                 → count a view
//   POST /api/advertisements/:id/click/:sectionId           → count a tap on one section
//
// When a section has deepLink, the app opens it exactly like a notification
// deep link (GET /api/deep-link/resolve?section=...&contentId=...).
const express = require('express');
const router = express.Router();
const Advertisement = require('../../models/Advertisement');
const { listAllPlacements, koshSubKey } = require('../../services/adPlacements');

const PUBLIC_FIELDS = 'placement placementType placementRef placementLabel title sections startsAt endsAt updatedAt';

function liveFilter() {
  const now = new Date();
  return {
    isActive: true,
    $and: [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: null }, { endsAt: { $gt: now } }] },
    ],
  };
}

function shape(ad) {
  return {
    _id: ad._id,
    placement: ad.placement,
    placementType: ad.placementType,
    placementRef: ad.placementRef,
    placementLabel: ad.placementLabel,
    title: ad.title,
    startsAt: ad.startsAt,
    endsAt: ad.endsAt,
    updatedAt: ad.updatedAt,
    sections: (ad.sections || [])
      .slice()
      .sort((a, b) => (a.position || 0) - (b.position || 0))
      .map((s) => ({
        _id: s._id,
        title: s.title,
        subtitle: s.subtitle,
        imageUrl: s.imageUrl,
        linkType: s.linkType,
        actionUrl: s.actionUrl,
        deepLink: s.deepLink,
        position: s.position,
      })),
  };
}

router.get('/placements', async (req, res) => {
  try {
    const placements = await listAllPlacements();
    res.json({ success: true, placements });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/active', async (req, res) => {
  try {
    const { placement, koshSubCategoryId } = req.query;
    const key = placement || (koshSubCategoryId ? koshSubKey(koshSubCategoryId) : null);

    if (key) {
      const ad = await Advertisement.findOne({ ...liveFilter(), placement: key }).select(PUBLIC_FIELDS).lean();
      return res.json({ success: true, placement: key, data: ad ? shape(ad) : null });
    }

    const ads = await Advertisement.find(liveFilter()).select(PUBLIC_FIELDS).lean();
    const byPlacement = {};
    ads.forEach((ad) => { byPlacement[ad.placement] = shape(ad); });
    res.json({ success: true, count: ads.length, data: byPlacement });
  } catch (err) {
    console.error('[advertisements active]', err);
    res.status(500).json({ success: false, error: 'Error fetching advertisements' });
  }
});

router.post('/:id/impression', async (req, res) => {
  try {
    await Advertisement.findByIdAndUpdate(req.params.id, { $inc: { impressionCount: 1 } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error tracking impression' });
  }
});

router.post('/:id/click/:sectionId', async (req, res) => {
  try {
    const r = await Advertisement.updateOne(
      { _id: req.params.id, 'sections._id': req.params.sectionId },
      { $inc: { 'sections.$.clickCount': 1 } },
    );
    if (!r.matchedCount) return res.status(404).json({ success: false, error: 'Advertisement or section not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error tracking click' });
  }
});

module.exports = router;
