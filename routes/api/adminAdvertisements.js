// React admin API for advertisements (JWT). One advertisement per placement;
// each advertisement holds an ordered list of sections (banners) that can deep
// link into any content section, exactly like notifications do.
const express = require('express');
const router = express.Router();
const Advertisement = require('../../models/Advertisement');
const jwtAuth = require('../../middleware/jwtAuth');
const { buildDeepLink } = require('../../services/notificationDeepLink');
const { listAllPlacements, resolvePlacement } = require('../../services/adPlacements');

router.use(jwtAuth);

function toBool(v) {
  if (typeof v === 'boolean') return v;
  if (v === undefined || v === null) return false;
  const s = String(v).trim().toLowerCase();
  return s === 'true' || s === 'on' || s === '1' || s === 'yes';
}

// Normalise the sections array from the request body. Each section may carry
// dl_* fields (same shape DeepLinkPicker emits for notifications).
async function buildSections(raw) {
  let list = raw;
  if (typeof list === 'string') {
    try { list = JSON.parse(list); } catch { list = []; }
  }
  if (!Array.isArray(list)) list = [];

  const out = [];
  for (let i = 0; i < list.length; i += 1) {
    const s = list[i] || {};
    const deepLink = await buildDeepLink(s);
    let linkType = s.linkType || (deepLink ? 'content' : s.actionUrl ? 'url' : 'none');
    if (linkType === 'content' && !deepLink) linkType = 'none';
    const section = {
      title: s.title || '',
      subtitle: s.subtitle || '',
      imageUrl: s.imageUrl || null,
      linkType,
      actionUrl: linkType === 'url' ? (s.actionUrl || null) : null,
      deepLink: linkType === 'content' ? deepLink : null,
      position: i,
    };
    if (s._id && /^[a-f\d]{24}$/i.test(String(s._id))) section._id = s._id;
    if (typeof s.clickCount === 'number') section.clickCount = s.clickCount;
    out.push(section);
  }
  return out;
}

async function buildDoc(body) {
  const placement = await resolvePlacement(body.placement);
  if (!placement) {
    const err = new Error('Invalid placement');
    err.status = 400;
    throw err;
  }
  return {
    placement: placement.key,
    placementType: placement.placementType,
    placementRef: placement.placementRef || null,
    placementLabel: placement.label,
    title: body.title,
    sections: await buildSections(body.sections),
    isActive: body.isActive === undefined ? true : toBool(body.isActive),
    startsAt: body.startsAt ? new Date(body.startsAt) : null,
    endsAt: body.endsAt ? new Date(body.endsAt) : null,
  };
}

function sendErr(res, err) {
  if (err && err.code === 11000) {
    return res.status(409).json({ message: 'An advertisement already exists for this placement' });
  }
  res.status(err.status || 400).json({ message: err.message });
}

// ---- Placements (fixed list + one per Kosh category, with "taken" info) ----
router.get('/placements', async (req, res) => {
  try {
    const [placements, ads] = await Promise.all([
      listAllPlacements(),
      Advertisement.find().select('placement title isActive').lean(),
    ]);
    const byKey = new Map(ads.map((a) => [a.placement, a]));
    res.json({
      placements: placements.map((p) => {
        const ad = byKey.get(p.key);
        return { ...p, taken: !!ad, adId: ad ? ad._id : null, adTitle: ad ? ad.title : null };
      }),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---- List ----
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.placementType) filter.placementType = req.query.placementType;
    if (req.query.placement) filter.placement = req.query.placement;
    if (req.query.search) {
      const rx = new RegExp(String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ title: rx }, { placementLabel: rx }, { 'sections.title': rx }];
    }

    const [items, total] = await Promise.all([
      Advertisement.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Advertisement.countDocuments(filter),
    ]);

    res.json({ items, total, currentPage: page, totalPages: Math.max(1, Math.ceil(total / limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const doc = await Advertisement.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---- Create ----
router.post('/', async (req, res) => {
  try {
    if (!req.body.title) return res.status(400).json({ message: 'Title is required' });
    if (!req.body.placement) return res.status(400).json({ message: 'Placement is required' });

    const fields = await buildDoc(req.body);
    const existing = await Advertisement.findOne({ placement: fields.placement }).select('_id title').lean();
    if (existing) {
      return res.status(409).json({
        message: `Placement "${fields.placementLabel}" already has the advertisement "${existing.title}". Edit that one instead.`,
        adId: existing._id,
      });
    }
    fields.createdBy = req.user?.id || null;
    const ad = await Advertisement.create(fields);
    res.status(201).json(ad);
  } catch (err) {
    sendErr(res, err);
  }
});

// ---- Update ----
router.put('/:id', async (req, res) => {
  try {
    if (!req.body.title) return res.status(400).json({ message: 'Title is required' });
    if (!req.body.placement) return res.status(400).json({ message: 'Placement is required' });

    const fields = await buildDoc(req.body);
    const clash = await Advertisement.findOne({ placement: fields.placement, _id: { $ne: req.params.id } })
      .select('_id title').lean();
    if (clash) {
      return res.status(409).json({
        message: `Placement "${fields.placementLabel}" already has the advertisement "${clash.title}".`,
        adId: clash._id,
      });
    }

    const ad = await Advertisement.findByIdAndUpdate(req.params.id, fields, { new: true, runValidators: true });
    if (!ad) return res.status(404).json({ message: 'Not found' });
    res.json(ad);
  } catch (err) {
    sendErr(res, err);
  }
});

// ---- Toggle active ----
router.post('/:id/toggle', async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id);
    if (!ad) return res.status(404).json({ message: 'Not found' });
    ad.isActive = !ad.isActive;
    await ad.save();
    res.json(ad);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ---- Delete ----
router.delete('/:id', async (req, res) => {
  try {
    const ad = await Advertisement.findByIdAndDelete(req.params.id);
    if (!ad) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
