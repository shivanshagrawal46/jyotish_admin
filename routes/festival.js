const express = require('express');
const router = express.Router();
const Festival = require('../models/Festival');
const multer = require('multer');
const xlsx = require('xlsx');

// Configure multer for file upload
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
            file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files are allowed!'), false);
        }
    }
});

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.redirect('/login');
  next();
}

// List all festivals
router.get('/festivals', requireAuth, async (req, res) => {
  const festivals = await Festival.find().sort({ date: -1 });
  res.render('festivals', {
    festivals,
    username: req.session.username,
    error: null,
    success: null,
    koshCategories: [],
    activeCategory: null,
    mcqCategories: [],
    karmkandCategories: []
  });
});

// Show add festival form
router.get('/festivals/add', requireAuth, (req, res) => {
  res.render('addFestival', {
    username: req.session.username,
    error: null,
    koshCategories: [],
    activeCategory: null,
    mcqCategories: [],
    karmkandCategories: []
  });
});

// Handle add festival
router.post('/festivals/add', requireAuth, async (req, res) => {
  try {
    const { date, vrat, festival_name, jyanti, vishesh } = req.body;
    await Festival.create({ date, vrat, festival_name, jyanti, vishesh });
    res.redirect('/festivals');
  } catch (err) {
    res.render('addFestival', {
      username: req.session.username,
      error: 'All required fields must be filled.',
      koshCategories: [],
      activeCategory: null,
      mcqCategories: [],
      karmkandCategories: []
    });
  }
});

// Show edit festival form
router.get('/festivals/:id/edit', requireAuth, async (req, res) => {
  const festival = await Festival.findById(req.params.id);
  if (!festival) return res.redirect('/festivals');
  res.render('editFestival', {
    festival,
    username: req.session.username,
    error: null,
    koshCategories: [],
    activeCategory: null,
    mcqCategories: [],
    karmkandCategories: []
  });
});

// Handle edit festival
router.post('/festivals/:id/edit', requireAuth, async (req, res) => {
  try {
    const { date, vrat, festival_name, jyanti, vishesh } = req.body;
    await Festival.findByIdAndUpdate(req.params.id, { date, vrat, festival_name, jyanti, vishesh });
    res.redirect('/festivals');
  } catch (err) {
    const festival = await Festival.findById(req.params.id);
    res.render('editFestival', {
      festival,
      username: req.session.username,
      error: 'All required fields must be filled.',
      koshCategories: [],
      activeCategory: null,
      mcqCategories: [],
      karmkandCategories: []
    });
  }
});

// Handle delete festival
router.post('/festivals/:id/delete', requireAuth, async (req, res) => {
  await Festival.findByIdAndDelete(req.params.id);
  res.redirect('/festivals');
});

// Handle Excel upload
router.post('/festivals/upload-excel', requireAuth, upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.render('festivals', {
                festivals: await Festival.find().sort({ date: -1 }),
                username: req.session.username,
                error: 'Please upload an Excel file.',
                success: null,
                koshCategories: [],
                activeCategory: null,
                mcqCategories: [],
                karmkandCategories: []
            });
        }

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(worksheet);

        const festivals = [];
        for (const row of data) {
            if (!row.Date || !row.Vrat || !row['Festival Name']) {
                continue; // Skip rows with missing required fields
            }

            // Validate date format
            const date = new Date(row.Date);
            if (isNaN(date.getTime())) {
                continue; // Skip invalid dates
            }

            festivals.push({
                date: date,
                vrat: row.Vrat,
                festival_name: row['Festival Name'],
                jyanti: row.Jyanti || '',
                vishesh: row.Vishesh || ''
            });
        }

        if (festivals.length > 0) {
            await Festival.insertMany(festivals);
            res.redirect('/festivals');
        } else {
            res.render('festivals', {
                festivals: await Festival.find().sort({ date: -1 }),
                username: req.session.username,
                error: 'No valid festival data found in the Excel file.',
                success: null,
                koshCategories: [],
                activeCategory: null,
                mcqCategories: [],
                karmkandCategories: []
            });
        }
    } catch (err) {
        console.error('Error processing Excel file:', err);
        res.render('festivals', {
            festivals: await Festival.find().sort({ date: -1 }),
            username: req.session.username,
            error: 'Error processing Excel file. Please check the file format.',
            success: null,
            koshCategories: [],
            activeCategory: null,
            mcqCategories: [],
            karmkandCategories: []
        });
    }
});

module.exports = router; 