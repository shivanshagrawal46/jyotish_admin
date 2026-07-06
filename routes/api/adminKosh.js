const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const KoshCategory = require('../../models/KoshCategory');
const KoshSubCategory = require('../../models/KoshSubCategory');
const KoshContent = require('../../models/KoshContent');
const jwtAuth = require('../../middleware/jwtAuth');

// Reuse the vishesh_suchi cache clearer exposed by the public content API
let clearVisheshSuchiCache = () => {};
try {
  const koshCategoryApi = require('./koshCategory');
  if (typeof koshCategoryApi.clearVisheshSuchiCache === 'function') {
    clearVisheshSuchiCache = koshCategoryApi.clearVisheshSuchiCache;
  }
} catch (e) {
  /* no-op */
}

// ---- Image upload (shared by categories cover / content image) ----
const imagesDir = path.join(__dirname, '..', '..', 'public', 'images');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
    cb(null, imagesDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype)) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  },
});

// Excel upload kept in memory so we can parse the buffer directly.
const XLSX = require('xlsx');
const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

// All admin routes require a valid JWT
router.use(jwtAuth);

function toBool(v) {
  if (typeof v === 'boolean') return v;
  if (v === undefined || v === null) return false;
  const s = String(v).trim().toLowerCase();
  return s === 'yes' || s === 'true' || s === '1' || s === 'y' || s === 'on';
}

// ============================================================
// Image upload -> returns a public URL
// ============================================================
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  res.json({ url: '/images/' + req.file.filename });
});

// ============================================================
// CATEGORIES
// ============================================================
router.get('/categories', async (req, res) => {
  try {
    const categories = await KoshCategory.find().sort({ position: 1 }).lean();
    const withCounts = await Promise.all(
      categories.map(async (c) => ({
        ...c,
        subCategoryCount: await KoshSubCategory.countDocuments({ parentCategory: c._id }),
      }))
    );
    res.json({ categories: withCounts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const { name, introduction } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    let position = req.body.position;
    if (position === undefined || position === null || position === '') {
      const last = await KoshCategory.findOne().sort({ position: -1 }).lean();
      position = last ? last.position + 1 : 1;
    }
    const category = await KoshCategory.create({ name, introduction, position });
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/categories/:id', async (req, res) => {
  try {
    const update = {};
    ['name', 'introduction', 'position'].forEach((k) => {
      if (req.body[k] !== undefined) update[k] = req.body[k];
    });
    const category = await KoshCategory.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    const category = await KoshCategory.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    const subs = await KoshSubCategory.find({ parentCategory: category._id }).select('_id').lean();
    const subIds = subs.map((s) => s._id);
    if (subIds.length) {
      await KoshContent.deleteMany({ subCategory: { $in: subIds } });
      await KoshSubCategory.deleteMany({ _id: { $in: subIds } });
    }
    await KoshCategory.findByIdAndDelete(category._id);
    clearVisheshSuchiCache();
    res.json({ message: 'Category and its sub-categories/content deleted', deletedSubCategories: subIds.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================================
// SUB-CATEGORIES
// ============================================================
router.get('/categories/:categoryId/subcategories', async (req, res) => {
  try {
    const category = await KoshCategory.findById(req.params.categoryId).lean();
    if (!category) return res.status(404).json({ message: 'Category not found' });
    const subcategories = await KoshSubCategory.find({ parentCategory: category._id })
      .sort({ position: 1 })
      .lean();
    const withCounts = await Promise.all(
      subcategories.map(async (s) => ({
        ...s,
        contentCount: await KoshContent.countDocuments({ subCategory: s._id }),
      }))
    );
    res.json({ category, subcategories: withCounts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/subcategories', async (req, res) => {
  try {
    const { parentCategory, name, introduction, cover_image } = req.body;
    if (!parentCategory || !name) {
      return res.status(400).json({ message: 'parentCategory and name are required' });
    }
    let position = req.body.position;
    if (position === undefined || position === null || position === '') {
      const last = await KoshSubCategory.findOne({ parentCategory }).sort({ position: -1 }).lean();
      position = last ? last.position + 1 : 1;
    }
    const sub = await KoshSubCategory.create({ parentCategory, name, introduction, cover_image, position });
    res.status(201).json(sub);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/subcategories/:id', async (req, res) => {
  try {
    const update = {};
    ['name', 'introduction', 'position', 'cover_image', 'parentCategory'].forEach((k) => {
      if (req.body[k] !== undefined) update[k] = req.body[k];
    });
    const sub = await KoshSubCategory.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!sub) return res.status(404).json({ message: 'Sub-category not found' });
    res.json(sub);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/subcategories/:id', async (req, res) => {
  try {
    const sub = await KoshSubCategory.findById(req.params.id);
    if (!sub) return res.status(404).json({ message: 'Sub-category not found' });
    await KoshContent.deleteMany({ subCategory: sub._id });
    await KoshSubCategory.findByIdAndDelete(sub._id);
    clearVisheshSuchiCache(sub._id.toString());
    res.json({ message: 'Sub-category and its content deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================================
// CONTENT
// ============================================================
router.get('/subcategories/:subId/contents', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const search = (req.query.search || '').trim();

    const sub = await KoshSubCategory.findById(req.params.subId).lean();
    if (!sub) return res.status(404).json({ message: 'Sub-category not found' });

    const query = { subCategory: sub._id };
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { hindiWord: rx },
        { englishWord: rx },
        { hinglishWord: rx },
        { meaning: rx },
        { search: rx },
      ];
    }

    const total = await KoshContent.countDocuments(query);
    // Display in Hindi alphabetical order (same ordering the mobile app uses).
    let contents;
    try {
      contents = await KoshContent.find(query)
        .collation({ locale: 'hi', strength: 1 })
        .sort({ hindiWord: 1 })
        .skip(skip)
        .limit(limit)
        .lean();
    } catch (collationErr) {
      contents = await KoshContent.find(query)
        .sort({ hindiWord: 1 })
        .skip(skip)
        .limit(limit)
        .lean();
    }

    res.json({
      subcategory: sub,
      contents,
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      totalContents: total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/contents/:id', async (req, res) => {
  try {
    const content = await KoshContent.findById(req.params.id).lean();
    if (!content) return res.status(404).json({ message: 'Content not found' });
    res.json(content);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/contents', async (req, res) => {
  try {
    const { subCategory } = req.body;
    if (!subCategory) return res.status(400).json({ message: 'subCategory is required' });

    let sequenceNo = req.body.sequenceNo;
    if (sequenceNo === undefined || sequenceNo === null || sequenceNo === '') {
      const last = await KoshContent.findOne({ subCategory }).sort({ sequenceNo: -1 }).lean();
      sequenceNo = last ? last.sequenceNo + 1 : 1;
    }

    const content = await KoshContent.create({
      subCategory,
      sequenceNo,
      hindiWord: req.body.hindiWord,
      englishWord: req.body.englishWord,
      hinglishWord: req.body.hinglishWord,
      meaning: req.body.meaning,
      extra: req.body.extra,
      structure: req.body.structure,
      search: req.body.search,
      youtubeLink: req.body.youtubeLink,
      image: req.body.image,
      payment: toBool(req.body.payment),
      amount: toBool(req.body.payment) ? Number(req.body.amount) || 0 : 0,
    });
    clearVisheshSuchiCache(String(subCategory));
    res.status(201).json(content);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/contents/:id', async (req, res) => {
  try {
    const update = {};
    ['sequenceNo', 'hindiWord', 'englishWord', 'hinglishWord', 'meaning', 'extra', 'structure', 'search', 'youtubeLink', 'image', 'subCategory'].forEach((k) => {
      if (req.body[k] !== undefined) update[k] = req.body[k];
    });
    if (req.body.payment !== undefined) update.payment = toBool(req.body.payment);
    // amount only applies when payment is on; force to 0 otherwise
    if (req.body.payment !== undefined || req.body.amount !== undefined) {
      const paid = req.body.payment !== undefined ? toBool(req.body.payment) : undefined;
      if (paid === false) {
        update.amount = 0;
      } else if (req.body.amount !== undefined) {
        update.amount = Number(req.body.amount) || 0;
      }
    }

    const content = await KoshContent.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!content) return res.status(404).json({ message: 'Content not found' });
    clearVisheshSuchiCache(String(content.subCategory));
    res.json(content);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/contents/:id', async (req, res) => {
  try {
    const content = await KoshContent.findById(req.params.id);
    if (!content) return res.status(404).json({ message: 'Content not found' });
    const subId = content.subCategory;
    await KoshContent.findByIdAndDelete(content._id);
    clearVisheshSuchiCache(String(subId));
    res.json({ message: 'Content deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================================
// Excel: template / export / import (Kosh content)
// ============================================================

const EXCEL_COLUMNS = [
  'sequenceNo', 'hindiWord', 'englishWord', 'hinglishWord', 'meaning',
  'extra', 'structure', 'search', 'youtubeLink', 'image', 'payment', 'amount',
];

function sendWorkbook(res, rows, sheetName, fileName) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.send(buffer);
}

function safeName(name) {
  const ascii = String(name || 'subcategory')
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]+/g, '')
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .trim()
    .replace(/\s+/g, '_');
  return ascii && ascii.length > 0 ? ascii : 'subcategory';
}

// Download a blank template with sample rows
router.get('/subcategories/:subId/template-excel', async (req, res) => {
  try {
    const sub = await KoshSubCategory.findById(req.params.subId).lean();
    if (!sub) return res.status(404).json({ message: 'Sub-category not found' });
    const sample = [
      { sequenceNo: 1, hindiWord: 'शब्द', englishWord: 'word', hinglishWord: 'shabd', meaning: 'Meaning of the word', extra: 'Optional', structure: 'Optional', search: 'keywords', youtubeLink: '', image: '', payment: 'no', amount: 0 },
      { sequenceNo: 2, hindiWord: 'अर्थ', englishWord: 'meaning', hinglishWord: 'arth', meaning: 'Meaning of the second word', extra: '', structure: '', search: '', youtubeLink: '', image: '', payment: 'yes', amount: 51 },
    ];
    sendWorkbook(res, sample, 'Kosh Content Template', `kosh_content_${safeName(sub.name)}_template.xlsx`);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Export existing content (in Hindi alphabetical order, matching the app)
router.get('/subcategories/:subId/export-excel', async (req, res) => {
  try {
    const sub = await KoshSubCategory.findById(req.params.subId).lean();
    if (!sub) return res.status(404).json({ message: 'Sub-category not found' });
    let contents;
    try {
      contents = await KoshContent.find({ subCategory: sub._id })
        .collation({ locale: 'hi', strength: 1 })
        .sort({ hindiWord: 1 })
        .lean();
    } catch (e) {
      contents = await KoshContent.find({ subCategory: sub._id }).sort({ hindiWord: 1 }).lean();
    }
    const rows = contents.map((c) => ({
      sequenceNo: c.sequenceNo,
      hindiWord: c.hindiWord || '',
      englishWord: c.englishWord || '',
      hinglishWord: c.hinglishWord || '',
      meaning: c.meaning || '',
      extra: c.extra || '',
      structure: c.structure || '',
      search: c.search || '',
      youtubeLink: c.youtubeLink || '',
      image: c.image || '',
      payment: c.payment ? 'yes' : 'no',
      amount: c.amount || 0,
    }));
    sendWorkbook(res, rows, 'Kosh Content', `kosh_${safeName(sub.name)}.xlsx`);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Import content from an uploaded .xlsx
router.post('/subcategories/:subId/import-excel', excelUpload.single('excel'), async (req, res) => {
  try {
    const sub = await KoshSubCategory.findById(req.params.subId).lean();
    if (!sub) return res.status(404).json({ message: 'Sub-category not found' });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);
    if (!rows.length) return res.status(400).json({ message: 'Excel file is empty' });

    const pick = (row, key) => row[key] ?? row[key.charAt(0).toUpperCase() + key.slice(1)] ?? '';

    const docs = [];
    const errors = [];
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const rowNo = i + 2;
      const seqRaw = pick(row, 'sequenceNo');
      if (seqRaw === '' || seqRaw === null || seqRaw === undefined) {
        errors.push(`Row ${rowNo}: missing sequenceNo`);
        continue;
      }
      if (isNaN(seqRaw)) {
        errors.push(`Row ${rowNo}: invalid sequenceNo "${seqRaw}"`);
        continue;
      }
      docs.push({
        subCategory: sub._id,
        sequenceNo: parseInt(seqRaw, 10),
        hindiWord: pick(row, 'hindiWord'),
        englishWord: pick(row, 'englishWord'),
        hinglishWord: pick(row, 'hinglishWord'),
        meaning: pick(row, 'meaning'),
        extra: pick(row, 'extra'),
        structure: pick(row, 'structure'),
        search: pick(row, 'search'),
        youtubeLink: pick(row, 'youtubeLink'),
        image: pick(row, 'image'),
        payment: toBool(pick(row, 'payment')),
        amount: toBool(pick(row, 'payment')) ? Number(pick(row, 'amount')) || 0 : 0,
      });
    }

    let imported = 0;
    for (const doc of docs) {
      // create() one-by-one so the auto-increment id plugin runs per document
      // eslint-disable-next-line no-await-in-loop
      await KoshContent.create(doc);
      imported += 1;
    }
    clearVisheshSuchiCache(String(sub._id));

    res.json({ imported, skipped: errors.length, errors: errors.slice(0, 10), total: rows.length });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
