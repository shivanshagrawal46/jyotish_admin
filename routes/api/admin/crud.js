const express = require('express');

// Fields that must never be written directly from the client.
const PROTECTED = new Set(['_id', '__v', 'createdAt', 'updatedAt', 'created_at', 'updated_at', 'slug']);

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
