const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');

// Excel uploads are parsed in memory.
const excelUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// Fields that must never be written directly from the client.
const PROTECTED = new Set(['_id', '__v', 'createdAt', 'updatedAt', 'created_at', 'updated_at', 'slug']);

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---- Excel helpers (shared by every resource that declares an `excel` config) ----
function toBool(v) {
  if (typeof v === 'boolean') return v;
  if (v === undefined || v === null) return false;
  const s = String(v).trim().toLowerCase();
  return s === 'yes' || s === 'true' || s === '1' || s === 'y' || s === 'on';
}

function isArrayPath(Model, field) {
  const p = Model.schema.paths[field];
  return !!p && p.instance === 'Array';
}

// Excel cell value -> a value suitable for the model on import.
function excelCellIn(Model, field, raw, boolFields) {
  if (boolFields.includes(field)) return toBool(raw);
  if (isArrayPath(Model, field)) {
    if (Array.isArray(raw)) return raw;
    const s = raw == null ? '' : String(raw).trim();
    if (!s) return [];
    const parts = s.split(/[,\n]/).map((x) => x.trim()).filter(Boolean);
    const caster = Model.schema.paths[field].caster;
    if (caster && caster.instance === 'Number') return parts.map(Number).filter((n) => !Number.isNaN(n));
    return parts;
  }
  return raw;
}

// Model value -> a plain cell value for export.
function excelCellOut(Model, field, val, boolFields) {
  if (boolFields.includes(field)) return val ? 'yes' : 'no';
  // Populated ref (from .populate()) -> export its human-readable name/title.
  if (val && typeof val === 'object' && !Array.isArray(val) && (val.name || val.title)) {
    return val.name || val.title;
  }
  if (Array.isArray(val)) return val.join(', ');
  return val == null ? '' : val;
}

function sendWorkbook(res, rows, sheetName, fileName) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, String(sheetName).slice(0, 31));
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.send(buffer);
}

// Keep only body keys that are real (top-level) schema paths and not protected.
function pickWritable(Model, body, { allowIdWrite = false } = {}) {
  const paths = Model.schema.paths;
  const out = {};
  Object.keys(body || {}).forEach((key) => {
    if (PROTECTED.has(key)) return;
    if (key === 'id' && !allowIdWrite) return;
    if (Object.prototype.hasOwnProperty.call(paths, key) || key === 'id') {
      out[key] = body[key];
    }
  });
  return out;
}

function applyPopulate(query, populate) {
  (populate || []).forEach((p) => query.populate(p));
  return query;
}

/**
 * Build a REST CRUD router for a Mongoose model, driven by a small config.
 * Supports: pagination, text search, single-parent filtering (hierarchies),
 * populate, singleton documents, cascade deletes and custom row actions.
 */
module.exports = function createCrudRouter(Model, opts = {}) {
  const router = express.Router();
  const {
    searchFields = [],
    parentField = null,
    defaultSort = { createdAt: -1 },
    collation = null, // e.g. { locale: 'hi', strength: 1 } for Hindi alphabetical order
    populate = [],
    singleton = false,
    allowCreate = true,
    allowUpdate = true,
    allowDelete = true,
    allowIdWrite = false,
    cascades = [], // [{ model: MongooseModel, field: 'category' }]
    customActions = {}, // { send: async (doc, req) => ({...}) }
    transform = null, // async (writable, req, existingDoc|null) => writable
    select = null, // e.g. '-password' to hide fields from responses
    excel = null, // { columns: [...], bool: [...], sample: {...}|[...], label: 'Xxx' }
  } = opts;

  const withSelect = (query) => (select ? query.select(select) : query);

  // ---- Singleton (e.g. AboutUs, Prashan grids) ----
  if (singleton) {
    router.get('/', async (req, res) => {
      try {
        const doc = await applyPopulate(Model.findOne().sort({ updatedAt: -1 }), populate);
        res.json({ item: (await doc) || null });
      } catch (e) {
        res.status(500).json({ message: e.message });
      }
    });

    const upsert = async (req, res) => {
      try {
        let writable = pickWritable(Model, req.body, { allowIdWrite });
        if (transform) writable = await transform(writable, req, await Model.findOne());
        let doc = await Model.findOne();
        if (!doc) {
          doc = new Model(writable);
        } else {
          Object.assign(doc, writable);
        }
        await doc.save();
        res.json(doc);
      } catch (e) {
        res.status(400).json({ message: e.message });
      }
    };
    if (allowUpdate) {
      router.put('/', upsert);
      router.post('/', upsert);
    }
    return router;
  }

  // ---- List ----
  router.get('/', async (req, res) => {
    try {
      const all = req.query.all === '1' || req.query.all === 'true';
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 20, 500);
      const skip = (page - 1) * limit;
      const filter = {};

      if (parentField && req.query.parent) {
        filter[parentField] = req.query.parent;
      }

      const search = (req.query.search || '').trim();
      if (search && searchFields.length) {
        const rx = new RegExp(escapeRegex(search), 'i');
        filter.$or = searchFields.map((f) => ({ [f]: rx }));
      }

      const total = await Model.countDocuments(filter);
      const buildQuery = (useCollation) => {
        let q = Model.find(filter).sort(defaultSort);
        if (useCollation && collation) q = q.collation(collation);
        if (!all) q = q.skip(skip).limit(limit);
        else q = q.limit(2000);
        return withSelect(applyPopulate(q, populate));
      };

      let items;
      try {
        items = await buildQuery(true).lean();
      } catch (collationErr) {
        // Fallback if the DB rejects the collation locale
        items = await buildQuery(false).lean();
      }

      res.json({
        items,
        total,
        currentPage: page,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });

  // ---- Excel: template / export / import ----
  // Registered before "/:id" so the literal paths aren't captured as an id.
  if (excel && Array.isArray(excel.columns) && excel.columns.length) {
    const cols = excel.columns;
    const boolFields = excel.bool || [];
    const label = excel.label || Model.modelName;

    // Blank/sample template
    router.get('/template-excel', (req, res) => {
      try {
        let rows;
        if (excel.sample) {
          rows = Array.isArray(excel.sample) ? excel.sample : [excel.sample];
        } else {
          rows = [Object.fromEntries(cols.map((c) => [c, '']))];
        }
        sendWorkbook(res, rows, `${label} Template`, `${label.replace(/\s+/g, '_')}_template.xlsx`);
      } catch (e) {
        res.status(500).json({ message: e.message });
      }
    });

    // Export existing rows (respects parent filter + search + collation)
    router.get('/export-excel', async (req, res) => {
      try {
        const filter = {};
        if (parentField && req.query.parent) filter[parentField] = req.query.parent;
        const search = (req.query.search || '').trim();
        if (search && searchFields.length) {
          const rx = new RegExp(escapeRegex(search), 'i');
          filter.$or = searchFields.map((f) => ({ [f]: rx }));
        }
        let docs;
        try {
          let q = Model.find(filter).sort(defaultSort);
          if (collation) q = q.collation(collation);
          docs = await applyPopulate(q, populate).lean();
        } catch (collationErr) {
          docs = await applyPopulate(Model.find(filter).sort(defaultSort), populate).lean();
        }
        const rows = docs.map((d) => {
          const o = {};
          cols.forEach((c) => {
            o[c] = excelCellOut(Model, c, d[c], boolFields);
          });
          return o;
        });
        sendWorkbook(res, rows, label, `${label.replace(/\s+/g, '_')}.xlsx`);
      } catch (e) {
        res.status(500).json({ message: e.message });
      }
    });

    // Import rows from an uploaded .xlsx
    router.post('/import-excel', excelUpload.single('excel'), async (req, res) => {
      try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        if (parentField && !req.query.parent) {
          return res.status(400).json({ message: 'Missing parent context for import' });
        }
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);
        if (!rows.length) return res.status(400).json({ message: 'Excel file is empty' });

        const pick = (row, key) => row[key] ?? row[key.charAt(0).toUpperCase() + key.slice(1)] ?? '';

        let imported = 0;
        const errors = [];
        for (let i = 0; i < rows.length; i += 1) {
          const row = rows[i];
          const rowNo = i + 2;
          const doc = {};
          cols.forEach((c) => {
            const raw = pick(row, c);
            if (boolFields.includes(c) || (raw !== '' && raw !== null && raw !== undefined)) {
              doc[c] = excelCellIn(Model, c, raw, boolFields);
            }
          });
          if (parentField && req.query.parent) doc[parentField] = req.query.parent;
          try {
            let writable = doc;
            if (transform) writable = await transform(writable, req, null);
            // create() (not insertMany) so auto-increment id plugins/hooks run per row
            // eslint-disable-next-line no-await-in-loop
            await Model.create(writable);
            imported += 1;
          } catch (err) {
            errors.push(`Row ${rowNo}: ${err.message}`);
          }
        }
        res.json({ imported, skipped: errors.length, errors: errors.slice(0, 10), total: rows.length });
      } catch (e) {
        res.status(400).json({ message: e.message });
      }
    });
  }

  // ---- Get one ----
  router.get('/:id', async (req, res) => {
    try {
      const doc = await withSelect(applyPopulate(Model.findById(req.params.id), populate)).lean();
      if (!doc) return res.status(404).json({ message: 'Not found' });
      res.json(doc);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });

  // ---- Create ----
  if (allowCreate) {
    router.post('/', async (req, res) => {
      try {
        let writable = pickWritable(Model, req.body, { allowIdWrite });
        if (transform) writable = await transform(writable, req, null);
        const doc = new Model(writable);
        await doc.save();
        res.status(201).json(doc);
      } catch (e) {
        res.status(400).json({ message: e.message });
      }
    });
  }

  // ---- Custom actions (e.g. notification send) ----
  Object.keys(customActions).forEach((name) => {
    router.post(`/:id/actions/${name}`, async (req, res) => {
      try {
        const doc = await Model.findById(req.params.id);
        if (!doc) return res.status(404).json({ message: 'Not found' });
        const result = await customActions[name](doc, req);
        res.json(result || { message: 'ok' });
      } catch (e) {
        res.status(400).json({ message: e.message });
      }
    });
  });

  // ---- Update ----
  if (allowUpdate) {
    router.put('/:id', async (req, res) => {
      try {
        let writable = pickWritable(Model, req.body, { allowIdWrite });
        if (transform) writable = await transform(writable, req, await Model.findById(req.params.id));
        const doc = await Model.findByIdAndUpdate(req.params.id, writable, {
          new: true,
          runValidators: true,
        });
        if (!doc) return res.status(404).json({ message: 'Not found' });
        res.json(doc);
      } catch (e) {
        res.status(400).json({ message: e.message });
      }
    });
  }

  // ---- Delete (with optional cascades) ----
  if (allowDelete) {
    router.delete('/:id', async (req, res) => {
      try {
        const doc = await Model.findById(req.params.id);
        if (!doc) return res.status(404).json({ message: 'Not found' });
        for (const c of cascades) {
          await c.model.deleteMany({ [c.field]: doc._id });
        }
        await Model.findByIdAndDelete(doc._id);
        res.json({ message: 'Deleted' });
      } catch (e) {
        res.status(500).json({ message: e.message });
      }
    });
  }

  return router;
};
