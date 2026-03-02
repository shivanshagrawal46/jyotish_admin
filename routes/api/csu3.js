const express = require('express');
const Csu3 = require('../../models/Csu3');

const router = express.Router();

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

// Create row (all fields optional)
router.post('/', async (req, res) => {
  try {
    const payload = { ...req.body };
    payload.pageNo = parsePositiveInt(payload.pageNo, 1);
    if (payload.sequence !== undefined) payload.sequence = parsePositiveInt(payload.sequence, 0);

    const created = await Csu3.create(payload);
    return res.json({ success: true, data: created });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error creating CSU3 row', message: error.message });
  }
});

// Get list (optional filters: pageNo, heading, page, limit)
router.get('/', async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 100);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.pageNo !== undefined) {
      const pageNo = parsePositiveInt(req.query.pageNo, NaN);
      if (!Number.isFinite(pageNo)) {
        return res.status(400).json({ success: false, error: 'Invalid pageNo' });
      }
      filter.pageNo = pageNo;
    }
    if (req.query.heading) {
      filter.heading = req.query.heading;
    }

    const [data, total] = await Promise.all([
      Csu3.find(filter).sort({ pageNo: 1, sequence: 1, createdAt: 1 }).skip(skip).limit(limit),
      Csu3.countDocuments(filter)
    ]);

    return res.json({
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error fetching CSU3 rows', message: error.message });
  }
});

// List pages with item counts
router.get('/pages', async (_req, res) => {
  try {
    const pages = await Csu3.aggregate([
      { $group: { _id: '$pageNo', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, pageNo: '$_id', count: 1 } }
    ]);

    return res.json({ success: true, data: pages });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error fetching page list', message: error.message });
  }
});

// Get data by page number
router.get('/page/:pageNo', async (req, res) => {
  try {
    const pageNo = parsePositiveInt(req.params.pageNo, NaN);
    if (!Number.isFinite(pageNo)) {
      return res.status(400).json({ success: false, error: 'Invalid page number' });
    }

    const data = await Csu3.find({ pageNo }).sort({ sequence: 1, createdAt: 1 });
    return res.json({ success: true, pageNo, count: data.length, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error fetching page data', message: error.message });
  }
});

// Get all page fragments for a heading (multi-page support)
router.get('/heading/:heading', async (req, res) => {
  try {
    const heading = req.params.heading;
    const data = await Csu3.find({ heading }).sort({ pageNo: 1, sequence: 1, createdAt: 1 });
    return res.json({ success: true, heading, count: data.length, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error fetching heading data', message: error.message });
  }
});

// Get single row by id
router.get('/:id', async (req, res) => {
  try {
    const row = await Csu3.findById(req.params.id);
    if (!row) return res.status(404).json({ success: false, error: 'CSU3 row not found' });
    return res.json({ success: true, data: row });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error fetching CSU3 row', message: error.message });
  }
});

// Update row by id
router.put('/:id', async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.pageNo !== undefined) payload.pageNo = parsePositiveInt(payload.pageNo, 1);
    if (payload.sequence !== undefined) payload.sequence = parsePositiveInt(payload.sequence, 0);

    const updated = await Csu3.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!updated) return res.status(404).json({ success: false, error: 'CSU3 row not found' });
    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error updating CSU3 row', message: error.message });
  }
});

// Delete row by id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Csu3.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: 'CSU3 row not found' });
    return res.json({ success: true, message: 'CSU3 row deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error deleting CSU3 row', message: error.message });
  }
});

// Delete all rows for a page
router.delete('/page/:pageNo/all', async (req, res) => {
  try {
    const pageNo = parsePositiveInt(req.params.pageNo, NaN);
    if (!Number.isFinite(pageNo)) {
      return res.status(400).json({ success: false, error: 'Invalid page number' });
    }

    const result = await Csu3.deleteMany({ pageNo });
    return res.json({
      success: true,
      message: `Deleted ${result.deletedCount} row(s) from page ${pageNo}`,
      pageNo,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error deleting page data', message: error.message });
  }
});

module.exports = router;
