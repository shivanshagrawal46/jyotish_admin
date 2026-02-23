const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const Csu2 = require('../../models/Csu2');

const router = express.Router();

const excelMulter = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_, file, cb) => {
    const isExcel =
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      /\.xlsx?$/i.test(file.originalname || '');
    cb(isExcel ? null : new Error('Only Excel files are allowed (.xlsx, .xls)'), isExcel);
  }
});

function parsePageNo(value, fallback = 1) {
  const pageNo = Number.parseInt(value, 10);
  return Number.isFinite(pageNo) && pageNo > 0 ? pageNo : fallback;
}

function toText(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item, index) => ({
    date: toText(item && item.date),
    lagna: toText(item && item.lagna),
    sequence: Number.isFinite(Number(item && item.sequence)) ? Number(item.sequence) : index + 1
  }));
}

// Upload Excel and replace page data
// Expected columns: Heading | date | lagna
router.post('/upload-excel', excelMulter.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload an Excel file as excelFile' });
    }

    const pageNo = parsePageNo(req.body.pageNo || req.query.pageNo, 1);
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    // raw:false keeps display format for date-like cells
    const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });

    if (!rows || rows.length <= 1) {
      return res.status(400).json({ success: false, error: 'Excel file has no data rows' });
    }

    const groups = [];
    const groupMap = new Map();
    let currentHeading = '';

    for (let i = 1; i < rows.length; i += 1) {
      const row = rows[i] || [];
      const headingCell = toText(row[0]);
      const dateCell = toText(row[1]);
      const lagnaCell = toText(row[2]);

      if (headingCell) currentHeading = headingCell;

      // Skip fully empty rows
      if (!headingCell && !dateCell && !lagnaCell) continue;
      // If no current heading yet, skip loose data rows
      if (!currentHeading) continue;

      if (!groupMap.has(currentHeading)) {
        const nextGroup = {
          pageNo,
          sequence: groups.length + 1,
          heading: currentHeading,
          items: []
        };
        groups.push(nextGroup);
        groupMap.set(currentHeading, nextGroup);
      }

      // Add entry only when row carries date/lagna data
      if (dateCell || lagnaCell) {
        const target = groupMap.get(currentHeading);
        target.items.push({
          date: dateCell,
          lagna: lagnaCell,
          sequence: target.items.length + 1
        });
      }
    }

    await Csu2.deleteMany({ pageNo });
    const inserted = groups.length > 0 ? await Csu2.insertMany(groups) : [];

    return res.json({
      success: true,
      message: `Excel uploaded successfully for page ${pageNo}`,
      pageNo,
      count: inserted.length,
      data: inserted
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error uploading Excel', message: error.message });
  }
});

// Create heading block manually (optional fields)
router.post('/', async (req, res) => {
  try {
    const payload = { ...req.body };
    payload.pageNo = parsePageNo(payload.pageNo, 1);
    payload.items = normalizeItems(payload.items);
    const created = await Csu2.create(payload);
    return res.json({ success: true, data: created });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error creating CSU2 block', message: error.message });
  }
});

// Get list (optional filters pageNo, page, limit)
router.get('/', async (req, res) => {
  try {
    const pageNoFilter = req.query.pageNo ? parsePageNo(req.query.pageNo, NaN) : null;
    const page = parsePageNo(req.query.page, 1);
    const limit = parsePageNo(req.query.limit, 100);
    const skip = (page - 1) * limit;

    const filter = {};
    if (Number.isFinite(pageNoFilter)) filter.pageNo = pageNoFilter;

    const [data, total] = await Promise.all([
      Csu2.find(filter).sort({ pageNo: 1, sequence: 1, createdAt: 1 }).skip(skip).limit(limit),
      Csu2.countDocuments(filter)
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
    return res.status(500).json({ success: false, error: 'Error fetching CSU2 blocks', message: error.message });
  }
});

// Get all available pages with block counts
router.get('/pages', async (_req, res) => {
  try {
    const pages = await Csu2.aggregate([
      { $group: { _id: '$pageNo', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, pageNo: '$_id', count: 1 } }
    ]);
    return res.json({ success: true, data: pages });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error fetching pages', message: error.message });
  }
});

// Get page-wise grouped data
router.get('/page/:pageNo', async (req, res) => {
  try {
    const pageNo = parsePageNo(req.params.pageNo, NaN);
    if (!Number.isFinite(pageNo)) {
      return res.status(400).json({ success: false, error: 'Invalid page number' });
    }

    const data = await Csu2.find({ pageNo }).sort({ sequence: 1, createdAt: 1 });
    return res.json({
      success: true,
      pageNo,
      count: data.length,
      data
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error fetching page data', message: error.message });
  }
});

// Get single heading block
router.get('/:id', async (req, res) => {
  try {
    const row = await Csu2.findById(req.params.id);
    if (!row) return res.status(404).json({ success: false, error: 'CSU2 block not found' });
    return res.json({ success: true, data: row });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error fetching CSU2 block', message: error.message });
  }
});

// Edit heading block
router.put('/:id', async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.pageNo !== undefined) payload.pageNo = parsePageNo(payload.pageNo, 1);
    if (payload.items !== undefined) payload.items = normalizeItems(payload.items);

    const updated = await Csu2.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!updated) return res.status(404).json({ success: false, error: 'CSU2 block not found' });
    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error updating CSU2 block', message: error.message });
  }
});

// Delete single heading block
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Csu2.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: 'CSU2 block not found' });
    return res.json({ success: true, message: 'CSU2 block deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error deleting CSU2 block', message: error.message });
  }
});

// Delete all blocks for a page
router.delete('/page/:pageNo/all', async (req, res) => {
  try {
    const pageNo = parsePageNo(req.params.pageNo, NaN);
    if (!Number.isFinite(pageNo)) {
      return res.status(400).json({ success: false, error: 'Invalid page number' });
    }

    const result = await Csu2.deleteMany({ pageNo });
    return res.json({
      success: true,
      message: `Deleted ${result.deletedCount} block(s) from page ${pageNo}`,
      pageNo,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error deleting page data', message: error.message });
  }
});

module.exports = router;
