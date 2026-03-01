const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const Csu = require('../../models/Csu');

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

function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return value.map((v) => toText(v)).filter(Boolean);
  }
  if (value === undefined || value === null) return [];

  return String(value)
    .split(/[\n|,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const COLUMN_FIELD_ALIASES = {
  heading_hn: ['heading_hn', 'headings', 'heading'],
  di_hn: ['di_hn', 'दि', 'दि.', 'date'],
  var_hn: ['var_hn', 'वार', 'var'],
  tithi_hn: ['tithi_hn', 'तिथि', 'tithi'],
  tithi_time_hn: ['tithi_time_hn', 'tithi_time', 'तिथि_घ.मि.', 'तिथि घ.मि.'],
  nakshatra_hn: ['nakshatra_hn', 'नक्षत्र', 'nakshatra'],
  nakshatra_time_hn: ['nakshatra_time_hn', 'nakshatra_time', 'नक्षत्र_घ.मि.', 'नक्षत्र घ.मि.'],
  chara_rashi_pravesh_hn: ['chara_rashi_pravesh_hn', 'च.रा.प्र.', 'चरा राशि प्रवेश'],
  chara_rashi_time_hn: ['chara_rashi_time_hn', 'chara_rashi_time', 'चरा_घ.मि.', 'चरा घ.मि.'],
  vrat_parvadi_vivaran_hn: ['vrat_parvadi_vivaran_hn', 'व्रत-पर्वादि विवरण', 'विवरण']
};

const UPDATABLE_COLUMN_FIELDS = new Set(Object.keys(COLUMN_FIELD_ALIASES));

function normalizeKey(value) {
  return toText(value)
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[._-]/g, '');
}

function resolveColumnField(value) {
  const direct = toText(value);
  if (UPDATABLE_COLUMN_FIELDS.has(direct)) return direct;

  const normalizedInput = normalizeKey(value);
  for (const [field, aliases] of Object.entries(COLUMN_FIELD_ALIASES)) {
    const matched = aliases.some((alias) => normalizeKey(alias) === normalizedInput);
    if (matched) return field;
  }
  return null;
}

function normalizeFieldValue(fieldName, rawValue) {
  if (fieldName === 'tithi_hn' || fieldName === 'tithi_time_hn') {
    return normalizeStringArray(rawValue);
  }
  return toText(rawValue);
}

function buildRowFromExcelColumns(row, rowIndex, pageNo) {
  // Column order expected from screenshot:
  // 0 Headings, 1 दि., 2 वार, 3 तिथि, 4 घ.मि., 5 नक्षत्र, 6 घ.मि., 7 च.रा.प्र., 8 घ.मि., 9 व्रत-पर्वादि विवरण
  const heading_hn = toText(row[0]);
  const di_hn = toText(row[1]);
  const var_hn = toText(row[2]);
  const tithi_hn = toText(row[3]);
  const tithi_time_hn = toText(row[4]);
  const nakshatra_hn = toText(row[5]);
  const nakshatra_time_hn = toText(row[6]);
  const chara_rashi_pravesh_hn = toText(row[7]);
  const chara_rashi_time_hn = toText(row[8]);
  const vrat_parvadi_vivaran_hn = toText(row[9]);

  // Skip fully empty rows
  const hasAnyValue = [
    heading_hn,
    di_hn,
    var_hn,
    tithi_hn,
    tithi_time_hn,
    nakshatra_hn,
    nakshatra_time_hn,
    chara_rashi_pravesh_hn,
    chara_rashi_time_hn,
    vrat_parvadi_vivaran_hn
  ].some(Boolean);

  if (!hasAnyValue) return null;

  const tithi_hn_values = normalizeStringArray(tithi_hn);
  const tithi_time_hn_values = normalizeStringArray(tithi_time_hn);

  return {
    pageNo,
    sequence: rowIndex + 1,
    heading_hn,
    di_hn,
    var_hn,
    tithi_hn: tithi_hn_values,
    tithi_time_hn: tithi_time_hn_values,
    nakshatra_hn,
    nakshatra_time_hn,
    chara_rashi_pravesh_hn,
    chara_rashi_time_hn,
    vrat_parvadi_vivaran_hn
  };
}

// Upload Excel for a page number (easy mode: replaces existing data for that page)
router.post('/upload-excel', excelMulter.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload an Excel file as excelFile' });
    }

    const pageNo = parsePageNo(req.body.pageNo || req.query.pageNo, 1);
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    // raw:false keeps Excel display formatting (e.g. 6:53 instead of 0.2868...)
    const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });

    if (!rows || rows.length <= 1) {
      return res.status(400).json({ success: false, error: 'Excel file has no data rows' });
    }

    const parsedDocs = [];
    for (let i = 1; i < rows.length; i += 1) {
      const parsed = buildRowFromExcelColumns(rows[i], i - 1, pageNo);
      if (!parsed) continue;

      const hasOnlyTithiData =
        !parsed.heading_hn &&
        !parsed.di_hn &&
        !parsed.var_hn &&
        !parsed.nakshatra_hn &&
        !parsed.nakshatra_time_hn &&
        !parsed.chara_rashi_pravesh_hn &&
        !parsed.chara_rashi_time_hn &&
        !parsed.vrat_parvadi_vivaran_hn &&
        (parsed.tithi_hn.length > 0 || parsed.tithi_time_hn.length > 0);

      // Easy handling for "same day has multiple tithi" rows:
      // if a row only has tithi/time, append it to the previous day row.
      if (hasOnlyTithiData && parsedDocs.length > 0) {
        const prev = parsedDocs[parsedDocs.length - 1];
        prev.tithi_hn = [...(prev.tithi_hn || []), ...parsed.tithi_hn];
        prev.tithi_time_hn = [...(prev.tithi_time_hn || []), ...parsed.tithi_time_hn];
      } else {
        parsedDocs.push(parsed);
      }
    }

    await Csu.deleteMany({ pageNo });
    const inserted = parsedDocs.length > 0 ? await Csu.insertMany(parsedDocs) : [];

    return res.json({
      success: true,
      message: `Excel uploaded successfully for page ${pageNo}`,
      pageNo,
      count: inserted.length
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error uploading Excel', message: error.message });
  }
});

// Upload one-column Excel and replace only that column for an existing page
router.post('/upload-column-excel', excelMulter.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload an Excel file as excelFile' });
    }

    const pageNo = parsePageNo(req.body.pageNo || req.query.pageNo, NaN);
    if (!Number.isFinite(pageNo)) {
      return res.status(400).json({ success: false, error: 'Valid pageNo is required' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });

    if (!rows || rows.length <= 1) {
      return res.status(400).json({ success: false, error: 'Excel file has no data rows' });
    }

    const requestedField = req.body.columnField || req.query.columnField;
    const requestedHeading = req.body.columnHeading || req.query.columnHeading;
    let targetField = resolveColumnField(requestedField) || resolveColumnField(requestedHeading);

    const headerRow = Array.isArray(rows[0]) ? rows[0] : [];
    let targetColumnIndex = -1;

    if (targetField) {
      const aliases = COLUMN_FIELD_ALIASES[targetField] || [targetField];
      targetColumnIndex = headerRow.findIndex((cell) =>
        aliases.some((alias) => normalizeKey(alias) === normalizeKey(cell))
      );
    }

    // If field not explicitly provided, try infer from header first cell
    if (!targetField) {
      targetField = resolveColumnField(headerRow[0]);
      targetColumnIndex = targetColumnIndex === -1 ? 0 : targetColumnIndex;
    }

    if (!targetField) {
      return res.status(400).json({
        success: false,
        error:
          'Could not detect target column. Provide columnField (recommended), e.g. tithi_hn, tithi_time_hn, nakshatra_hn'
      });
    }

    if (targetColumnIndex === -1) {
      // Fallback: treat first column as target in single-column uploads
      targetColumnIndex = 0;
    }

    const pageRows = await Csu.find({ pageNo }).sort({ sequence: 1, createdAt: 1 });
    if (pageRows.length === 0) {
      return res.status(404).json({ success: false, error: `No CSU data found for page ${pageNo}` });
    }

    const values = rows.slice(1).map((r) => (Array.isArray(r) ? r[targetColumnIndex] : ''));
    const updateCount = Math.min(values.length, pageRows.length);
    const ops = [];

    for (let i = 0; i < updateCount; i += 1) {
      const rowDoc = pageRows[i];
      const normalizedValue = normalizeFieldValue(targetField, values[i]);
      ops.push({
        updateOne: {
          filter: { _id: rowDoc._id },
          update: { $set: { [targetField]: normalizedValue } }
        }
      });
    }

    if (ops.length > 0) {
      await Csu.bulkWrite(ops);
    }

    return res.json({
      success: true,
      message: `Updated column ${targetField} for page ${pageNo}`,
      pageNo,
      columnField: targetField,
      updatedRows: ops.length,
      pageRows: pageRows.length,
      excelRows: values.length
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error updating column from Excel', message: error.message });
  }
});

// Create a CSU row manually (all fields optional)
router.post('/', async (req, res) => {
  try {
    const payload = { ...req.body };
    payload.pageNo = parsePageNo(payload.pageNo, 1);
    payload.tithi_hn = normalizeStringArray(payload.tithi_hn);
    payload.tithi_time_hn = normalizeStringArray(payload.tithi_time_hn);

    const created = await Csu.create(payload);
    return res.json({ success: true, data: created });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error creating CSU row', message: error.message });
  }
});

// List rows (optional filters: pageNo, page, limit)
router.get('/', async (req, res) => {
  try {
    const pageNoFilter = req.query.pageNo ? parsePageNo(req.query.pageNo, NaN) : null;
    const page = parsePageNo(req.query.page, 1);
    const limit = parsePageNo(req.query.limit, 100);
    const skip = (page - 1) * limit;

    const filter = {};
    if (Number.isFinite(pageNoFilter)) filter.pageNo = pageNoFilter;

    const [data, total] = await Promise.all([
      Csu.find(filter).sort({ pageNo: 1, sequence: 1, createdAt: 1 }).skip(skip).limit(limit),
      Csu.countDocuments(filter)
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
    return res.status(500).json({ success: false, error: 'Error fetching CSU rows', message: error.message });
  }
});

// List all pages with item count
router.get('/pages', async (_req, res) => {
  try {
    const pages = await Csu.aggregate([
      { $group: { _id: '$pageNo', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, pageNo: '$_id', count: 1 } }
    ]);

    return res.json({ success: true, data: pages });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error fetching pages', message: error.message });
  }
});

// Get all rows for a page
router.get('/page/:pageNo', async (req, res) => {
  try {
    const pageNo = parsePageNo(req.params.pageNo, NaN);
    if (!Number.isFinite(pageNo)) {
      return res.status(400).json({ success: false, error: 'Invalid page number' });
    }

    const data = await Csu.find({ pageNo }).sort({ sequence: 1, createdAt: 1 });
    return res.json({ success: true, pageNo, count: data.length, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error fetching page data', message: error.message });
  }
});

// Get single row
router.get('/:id', async (req, res) => {
  try {
    const row = await Csu.findById(req.params.id);
    if (!row) return res.status(404).json({ success: false, error: 'CSU row not found' });
    return res.json({ success: true, data: row });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error fetching CSU row', message: error.message });
  }
});

// Edit/update row
router.put('/:id', async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.pageNo !== undefined) payload.pageNo = parsePageNo(payload.pageNo, 1);
    if (payload.tithi_hn !== undefined) payload.tithi_hn = normalizeStringArray(payload.tithi_hn);
    if (payload.tithi_time_hn !== undefined) payload.tithi_time_hn = normalizeStringArray(payload.tithi_time_hn);

    const updated = await Csu.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!updated) return res.status(404).json({ success: false, error: 'CSU row not found' });
    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error updating CSU row', message: error.message });
  }
});

// Delete one row
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Csu.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: 'CSU row not found' });
    return res.json({ success: true, message: 'CSU row deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error deleting CSU row', message: error.message });
  }
});

// Delete all rows for a page
router.delete('/page/:pageNo/all', async (req, res) => {
  try {
    const pageNo = parsePageNo(req.params.pageNo, NaN);
    if (!Number.isFinite(pageNo)) {
      return res.status(400).json({ success: false, error: 'Invalid page number' });
    }

    const result = await Csu.deleteMany({ pageNo });
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
