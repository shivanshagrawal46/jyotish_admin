const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const RashifalDaily = require('../models/RashifalDaily');
const RashifalYearly = require('../models/RashifalYearly');
const RashifalMonthly = require('../models/RashifalMonthly');

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

// Rashifal main page
router.get('/', requireAuth, async (req, res) => {
    try {
        const dailyRashifals = await RashifalDaily.find().sort({ date: -1 });
        const yearlyRashifals = await RashifalYearly.find().sort({ date: -1 });
        // Fetch all monthly data for all months
        const monthlyRashifals = {};
        for (const month of MONTHS) {
            monthlyRashifals[month] = await RashifalMonthly.find({ month }).sort({ createdAt: -1 });
        }
        res.render('rashifal/index', {
            username: req.session.username,
            activePage: 'rashifal',
            dailyRashifals,
            yearlyRashifals,
            monthlyRashifals,
            months: MONTHS
        });
    } catch (error) {
        res.render('rashifal/index', {
            username: req.session.username,
            activePage: 'rashifal',
            dailyRashifals: [],
            yearlyRashifals: [],
            monthlyRashifals: {},
            months: MONTHS,
            error: 'Error loading rashifals'
        });
    }
});

// Excel upload page
router.get('/upload', requireAuth, (req, res) => {
    res.render('rashifal/uploadExcel', {
        username: req.session.username,
        activePage: 'rashifal'
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

        const rashifals = data.map(row => ({
            title_hn: row.title_hn || '',
            title_en: row.title_en || '',
            date: row.date || '',
            details_hn: row.details_hn || '',
            details_en: row.details_en || '',
            images: row.images ? row.images.split(',').map(img => img.trim()) : []
        }));

        // Remove all existing RashifalDaily entries before inserting new ones
        await RashifalDaily.deleteMany({});

        // Save to database
        await RashifalDaily.insertMany(rashifals);

        // Fetch updated data
        const dailyRashifals = await RashifalDaily.find().sort({ date: -1 });

        res.json({
            success: true,
            message: 'Excel data uploaded successfully',
            data: dailyRashifals
        });
    } catch (error) {
        console.error('Error uploading Excel:', error);
        res.status(500).json({
            success: false,
            error: 'Error processing Excel file'
        });
    }
});

// Rashifal yearly page
router.get('/yearly', requireAuth, async (req, res) => {
    try {
        const yearlyRashifals = await RashifalYearly.find().sort({ date: -1 });
        res.render('rashifal/yearly', {
            username: req.session.username,
            activePage: 'rashifal',
            yearlyRashifals
        });
    } catch (error) {
        res.render('rashifal/yearly', {
            username: req.session.username,
            activePage: 'rashifal',
            yearlyRashifals: [],
            error: 'Error loading yearly rashifals'
        });
    }
});

// Excel upload page for yearly
router.get('/upload-yearly', requireAuth, (req, res) => {
    res.render('rashifal/uploadExcelYearly', {
        username: req.session.username,
        activePage: 'rashifal'
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
        const rashifals = data.map(row => ({
            title_hn: row.title_hn || '',
            title_en: row.title_en || '',
            date: row.date || '',
            details_hn: row.details_hn || '',
            details_en: row.details_en || '',
            images: row.images ? row.images.split(',').map(img => img.trim()) : []
        }));
        await RashifalYearly.deleteMany({});
        await RashifalYearly.insertMany(rashifals);
        const yearlyRashifals = await RashifalYearly.find().sort({ date: -1 });
        res.json({
            success: true,
            message: 'Excel data uploaded successfully',
            data: yearlyRashifals
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error processing Excel file'
        });
    }
});

// Monthly Rashifal Excel upload
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
        await RashifalMonthly.deleteMany({ month });
        // Insert new entries
        const entries = data.map(row => ({
            month,
            title_hn: row.title_hn || '',
            title_en: row.title_en || '',
            details_hn: row.details_hn || '',
            details_en: row.details_en || '',
            images: row.images ? row.images.split(',').map(img => img.trim()) : []
        }));
        await RashifalMonthly.insertMany(entries);
        // Fetch updated data for this month
        const monthData = await RashifalMonthly.find({ month }).sort({ createdAt: -1 });
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