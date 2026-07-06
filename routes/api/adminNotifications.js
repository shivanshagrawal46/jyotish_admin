const express = require('express');
const router = express.Router();
const Notification = require('../../models/Notification');
const jwtAuth = require('../../middleware/jwtAuth');
const { buildDeepLink } = require('../../services/notificationDeepLink');

let FCMService = null;
try {
  FCMService = require('../../services/fcmService');
} catch (e) {
  console.warn('[adminNotifications] FCM service unavailable:', e.message);
}

router.use(jwtAuth);

function toBool(v) {
  if (typeof v === 'boolean') return v;
  if (v === undefined || v === null) return false;
  const s = String(v).trim().toLowerCase();
  return s === 'true' || s === 'on' || s === '1' || s === 'yes';
}

async function push(notification) {
  if (!FCMService || !FCMService.sendToAll) return { sent: false, reason: 'FCM unavailable' };
  try {
    const result = await FCMService.sendToAll(notification);
    return { sent: true, result };
  } catch (err) {
    console.error('[adminNotifications] push failed:', err);
    return { sent: false, reason: err.message };
  }
}

// Build the persisted fields from a request body (shared by create/update).
async function buildDoc(body) {
  const deepLink = await buildDeepLink(body);
  return {
    fields: {
      title: body.title,
      message: body.message,
      type: body.type || (deepLink ? 'content' : 'info'),
      priority: body.priority || 'medium',
      targetAudience: body.targetAudience || 'all',
      isActive: body.isActive === undefined ? true : toBool(body.isActive),
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : new Date(),
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      actionUrl: !deepLink && body.actionUrl ? body.actionUrl : null,
      actionText: !deepLink && body.actionText ? body.actionText : null,
      imageUrl: body.imageUrl || null,
      deepLink,
    },
    deepLink,
  };
}

// ---- List ----
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.section) filter['deepLink.contentType'] = req.query.section;
    if (req.query.search) {
      const rx = new RegExp(String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ title: rx }, { message: rx }];
    }

    const [items, total] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments(filter),
    ]);

    res.json({ items, total, currentPage: page, totalPages: Math.max(1, Math.ceil(total / limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const doc = await Notification.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---- Create (+ send push) ----
router.post('/', async (req, res) => {
  try {
    if (!req.body.title || !req.body.message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }
    const { fields } = await buildDoc(req.body);
    fields.createdBy = req.user?.id || null;
    const notification = await Notification.create(fields);
    const pushResult = await push(notification);
    res.status(201).json({ notification, push: pushResult });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ---- Update (+ resend) ----
router.put('/:id', async (req, res) => {
  try {
    if (!req.body.title || !req.body.message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }
    const { fields } = await buildDoc(req.body);
    const notification = await Notification.findByIdAndUpdate(req.params.id, fields, { new: true });
    if (!notification) return res.status(404).json({ message: 'Not found' });
    const pushResult = req.body.resend === false ? { sent: false, reason: 'skipped' } : await push(notification);
    res.json({ notification, push: pushResult });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ---- Resend ----
router.post('/:id/resend', async (req, res) => {
  try {
    const n = await Notification.findById(req.params.id);
    if (!n) return res.status(404).json({ message: 'Not found' });
    const pushResult = await push(n);
    res.json({ message: 'Resent', push: pushResult });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ---- Toggle active ----
router.post('/:id/toggle', async (req, res) => {
  try {
    const n = await Notification.findById(req.params.id);
    if (!n) return res.status(404).json({ message: 'Not found' });
    n.isActive = !n.isActive;
    await n.save();
    res.json(n);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ---- Delete ----
router.delete('/:id', async (req, res) => {
  try {
    const n = await Notification.findByIdAndDelete(req.params.id);
    if (!n) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
