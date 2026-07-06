const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const jwtAuth = require('../../../middleware/jwtAuth');
const createCrudRouter = require('./crud');
const registry = require('./registry');

const router = express.Router();

// Everything under here requires a valid admin JWT.
router.use(jwtAuth);

// ---- Shared image upload ----
const imagesDir = path.join(__dirname, '..', '..', '..', 'public', 'images');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
    cb(null, imagesDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    /^image\//.test(file.mimetype) ? cb(null, true) : cb(new Error('Only image files are allowed')),
});

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  res.json({ url: '/images/' + req.file.filename });
});

// ---- Media library upload (also records a Media document) ----
const Media = (() => {
  try {
    return require('../../../models/Media');
  } catch {
    return null;
  }
})();

router.post('/media/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const url = '/images/' + req.file.filename;
  try {
    if (Media) {
      const doc = await Media.create({
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url,
        uploadedBy: req.user?.id || undefined,
      });
      return res.status(201).json(doc);
    }
    res.json({ url });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// ---- List available resources (handy for debugging) ----
router.get('/resources', (req, res) => {
  res.json({ resources: Object.keys(registry) });
});

// ---- Mount every registered resource ----
Object.entries(registry).forEach(([name, { model, opts }]) => {
  router.use(`/resources/${name}`, createCrudRouter(model, opts));
});

module.exports = router;
