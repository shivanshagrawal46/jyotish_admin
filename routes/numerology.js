const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const NumerologyDaily = require('../models/NumerologyDaily');
const NumerologyYearly = require('../models/NumerologyYearly');
const NumerologyMonthly = require('../models/NumerologyMonthly');

// Middleware to require authentication
function requireAuth(req, res, next) {
    if (!req.session.userId) return res.redirect('/login');
    next();
}

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
            file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files are allowed!'), false);
        }
    }
});

// Helper: get all months
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

// Numerology main page
router.get('/', requireAuth, async (req, res) => {
    try {
        const dailyNumerology = await NumerologyDaily.find().sort({ sequence: 1 });
        const yearlyNumerology = await NumerologyYearly.find().sort({ sequence: 1 });
        // Fetch all monthly data for all months
        const monthlyNumerology = {};
        for (const month of MONTHS) {
            monthlyNumerology[month] = await NumerologyMonthly.find({ month }).sort({ sequence: 1 });
        }
        res.render('numerology/index', {
            username: req.session.username,
            activePage: 'numerology',
            dailyNumerology,
            yearlyNumerology,
            monthlyNumerology,
            months: MONTHS
        });
    } catch (error) {
        res.render('numerology/index', {
            username: req.session.username,
            activePage: 'numerology',
            dailyNumerology: [],
            yearlyNumerology: [],
            monthlyNumerology: {},
            months: MONTHS,
            error: 'Error loading numerology'
        });
    }
});

// Excel upload page
router.get('/upload', requireAuth, (req, res) => {
    res.render('numerology/uploadExcel', {
        username: req.session.username,
        activePage: 'numerology'
    });
});

// Handle Excel upload
router.post('/upload-daily', requireAuth, upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        const numerologyEntries = data.map((row, index) => ({
            sequence: index + 1, // Maintain Excel order
            title_hn: row.title_hn || '',
            title_en: row.title_en || '',
            date: row.date || '',
            details_hn: row.details_hn || '',
            details_en: row.details_en || '',
            images: row.images ? row.images.split(',').map(img => img.trim()) : []
        }));

        // Remove all existing NumerologyDaily entries before inserting new ones
        await NumerologyDaily.deleteMany({});

        // Save to database
        await NumerologyDaily.insertMany(numerologyEntries);

        // Fetch updated data in Excel order (by sequence)
        const dailyNumerology = await NumerologyDaily.find().sort({ sequence: 1 });

        res.json({
            success: true,
            message: 'Excel data uploaded successfully',
            data: dailyNumerology
        });
    } catch (error) {
        console.error('Error uploading Excel:', error);
        res.status(500).json({
            success: false,
            error: 'Error processing Excel file'
        });
    }
});

// Numerology yearly page
router.get('/yearly', requireAuth, async (req, res) => {
    try {
        const yearlyNumerology = await NumerologyYearly.find().sort({ date: -1 });
        res.render('numerology/yearly', {
            username: req.session.username,
            activePage: 'numerology',
            yearlyNumerology
        });
    } catch (error) {
        res.render('numerology/yearly', {
            username: req.session.username,
            activePage: 'numerology',
            yearlyNumerology: [],
            error: 'Error loading yearly numerology'
        });
    }
});

// Excel upload page for yearly
router.get('/upload-yearly', requireAuth, (req, res) => {
    res.render('numerology/uploadExcelYearly', {
        username: req.session.username,
        activePage: 'numerology'
    });
});

// Handle Excel upload for yearly
router.post('/upload-yearly', requireAuth, upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);
        const numerologyEntries = data.map((row, index) => ({
            sequence: index + 1, // Maintain Excel order
            title_hn: row.title_hn || '',
            title_en: row.title_en || '',
            date: row.date || '',
            details_hn: row.details_hn || '',
            details_en: row.details_en || '',
            images: row.images ? row.images.split(',').map(img => img.trim()) : []
        }));
        await NumerologyYearly.deleteMany({});
        await NumerologyYearly.insertMany(numerologyEntries);
        const yearlyNumerology = await NumerologyYearly.find().sort({ sequence: 1 });
        res.json({
            success: true,
            message: 'Excel data uploaded successfully',
            data: yearlyNumerology
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error processing Excel file'
        });
    }
});

// Monthly Numerology Excel upload
router.post('/upload-monthly/:month', requireAuth, upload.single('excelFile'), async (req, res) => {
    try {
        const month = req.params.month;
        if (!MONTHS.includes(month)) {
            return res.status(400).json({ error: 'Invalid month' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);
        // Remove all existing entries for this month
        await NumerologyMonthly.deleteMany({ month });
        // Insert new entries
        const entries = data.map((row, index) => ({
            sequence: index + 1, // Maintain Excel order
            month,
            title_hn: row.title_hn || '',
            title_en: row.title_en || '',
            details_hn: row.details_hn || '',
            details_en: row.details_en || '',
            images: row.images ? row.images.split(',').map(img => img.trim()) : []
        }));
        await NumerologyMonthly.insertMany(entries);
        // Fetch updated data for this month in Excel order
        const monthData = await NumerologyMonthly.find({ month }).sort({ sequence: 1 });
        res.json({
            success: true,
            message: 'Excel data uploaded successfully',
            data: monthData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error processing Excel file'
        });
    }
});

module.exports = router; 