const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const RashifalYearly = require('../models/RashifalYearly');
const RashifalMonthly = require('../models/RashifalMonthly');
const RashifalDailyDate = require('../models/RashifalDailyDate');
const RashifalDailyContent = require('../models/RashifalDailyContent');

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
        const yearlyRashifals = await RashifalYearly.find().sort({ sequence: 1 });
        // Fetch all monthly data for all months
        const monthlyRashifals = {};
        for (const month of MONTHS) {
            monthlyRashifals[month] = await RashifalMonthly.find({ month }).sort({ sequence: 1 });
        }
        res.render('rashifal/index', {
            username: req.session.username,
            activePage: 'rashifal',
            dailyRashifals: [],
            yearlyRashifals,
            monthlyRashifals,
            months: MONTHS
        });
    } catch (error) {
        res.render('rashifal/index', {
            username: req.session.username,
            activePage: 'rashifal',
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
// Deprecated legacy daily upload (use /rashifal/upload-daily/:dateId instead)
router.post('/upload-daily', requireAuth, upload.single('excelFile'), async (req, res) => {
    return res.status(410).json({ success: false, error: 'Deprecated. Use /rashifal/upload-daily/:dateId' });
});
// Handle Excel upload for a specific rashifal daily date (replace contents for that date)
router.post('/upload-daily/:dateId', requireAuth, upload.single('excelFile'), async (req, res) => {
    try {
        const { dateId } = req.params;
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const dateDoc = await RashifalDailyDate.findById(dateId);
        if (!dateDoc) {
            return res.status(404).json({ error: 'Date not found' });
        }

        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        const entries = data.map((row, index) => ({
            dateRef: dateId,
            sequence: row.sequence ? Number(row.sequence) : index + 1,
            title_hn: row.title_hn || '',
            title_en: row.title_en || '',
            details_hn: row.details_hn || '',
            details_en: row.details_en || '',
            images: row.images ? String(row.images).split(',').map(img => String(img).trim()) : []
        }));

        await RashifalDailyContent.deleteMany({ dateRef: dateId });
        await RashifalDailyContent.insertMany(entries);

        const contents = await RashifalDailyContent.find({ dateRef: dateId }).sort({ sequence: 1 });
        res.json({
            success: true,
            message: 'Excel data uploaded successfully for the date',
            date: dateDoc,
            data: contents
        });
    } catch (error) {
        console.error('Error uploading Excel for date:', error);
        res.status(500).json({ success: false, error: 'Error processing Excel file for date' });
    }
});

// Rashifal yearly page
router.get('/yearly', requireAuth, async (req, res) => {
    try {
        const yearlyRashifals = await RashifalYearly.find().sort({ sequence: 1 });
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
        const rashifals = data.map((row, index) => ({
            sequence: index + 1, // Maintain Excel order
            title_hn: row.title_hn || '',
            title_en: row.title_en || '',
            date: row.date || '',
            details_hn: row.details_hn || '',
            details_en: row.details_en || '',
            images: row.images ? row.images.split(',').map(img => img.trim()) : []
        }));
        await RashifalYearly.deleteMany({});
        await RashifalYearly.insertMany(rashifals);
        const yearlyRashifals = await RashifalYearly.find().sort({ sequence: 1 });
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
        const entries = data.map((row, index) => ({
            sequence: index + 1, // Maintain Excel order
            month,
            title_hn: row.title_hn || '',
            title_en: row.title_en || '',
            details_hn: row.details_hn || '',
            details_en: row.details_en || '',
            images: row.images ? row.images.split(',').map(img => img.trim()) : []
        }));
        await RashifalMonthly.insertMany(entries);
        // Fetch updated data for this month in Excel order
        const monthData = await RashifalMonthly.find({ month }).sort({ sequence: 1 });
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