const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const NumerologyYearly = require('../models/NumerologyYearly');
const NumerologyYearlyYear = require('../models/NumerologyYearlyYear');
const NumerologyMonthly = require('../models/NumerologyMonthly');
const NumerologyMonthlyYear = require('../models/NumerologyMonthlyYear');
const NumerologyDailyDate = require('../models/NumerologyDailyDate');
const NumerologyDailyContent = require('../models/NumerologyDailyContent');

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
        // Fetch all monthly years
        const monthlyYears = await NumerologyMonthlyYear.find().sort({ year: -1 });
        // Fetch all yearly years
        const yearlyYears = await NumerologyYearlyYear.find().sort({ year: -1 });
        
        res.render('numerology/index', {
            username: req.session.username,
            activePage: 'numerology',
            dailyNumerology: [],
            yearlyYears,
            monthlyYears,
            months: MONTHS
        });
    } catch (error) {
        res.render('numerology/index', {
            username: req.session.username,
            activePage: 'numerology',
            yearlyYears: [],
            monthlyYears: [],
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
// Deprecated legacy daily upload (use /numerology/upload-daily/:dateId instead)
router.post('/upload-daily', requireAuth, upload.single('excelFile'), async (req, res) => {
    return res.status(410).json({ success: false, error: 'Deprecated. Use /numerology/upload-daily/:dateId' });
});

// Handle Excel upload for a specific daily date (replace contents for that date)
router.post('/upload-daily/:dateId', requireAuth, upload.single('excelFile'), async (req, res) => {
    try {
        const { dateId } = req.params;
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const dateDoc = await NumerologyDailyDate.findById(dateId);
        if (!dateDoc) {
            return res.status(404).json({ error: 'Date not found' });
        }

        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        // Prepare entries mapped from Excel
        const entries = data.map((row, index) => ({
            dateRef: dateId,
            sequence: row.sequence ? Number(row.sequence) : index + 1,
            title_hn: row.title_hn || '',
            title_en: row.title_en || '',
            details_hn: row.details_hn || '',
            details_en: row.details_en || '',
            images: row.images ? String(row.images).split(',').map(img => String(img).trim()) : []
        }));

        // Replace existing contents for this date
        await NumerologyDailyContent.deleteMany({ dateRef: dateId });
        await NumerologyDailyContent.insertMany(entries);

        const contents = await NumerologyDailyContent.find({ dateRef: dateId }).sort({ sequence: 1 });
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

// Create a new yearly year
router.post('/yearly-year/create', requireAuth, async (req, res) => {
    try {
        const { year, description } = req.body;
        if (!year) {
            return res.status(400).json({ error: 'Year is required' });
        }
        
        // Check if year already exists
        const existing = await NumerologyYearlyYear.findOne({ year });
        if (existing) {
            return res.status(400).json({ error: 'Year already exists' });
        }
        
        const yearDoc = new NumerologyYearlyYear({ year, description });
        await yearDoc.save();
        
        res.json({
            success: true,
            message: 'Year created successfully',
            data: yearDoc
        });
    } catch (error) {
        console.error('Error creating year:', error);
        res.status(500).json({
            success: false,
            error: 'Error creating year'
        });
    }
});

// Delete a yearly year and all its content
router.post('/yearly-year/delete/:yearId', requireAuth, async (req, res) => {
    try {
        const { yearId } = req.params;
        const yearDoc = await NumerologyYearlyYear.findById(yearId);
        if (!yearDoc) {
            return res.status(404).json({ error: 'Year not found' });
        }
        
        // Delete all yearly content for this year
        await NumerologyYearly.deleteMany({ yearRef: yearId });
        
        // Delete the year
        await NumerologyYearlyYear.findByIdAndDelete(yearId);
        
        res.json({
            success: true,
            message: 'Year and all its content deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting year:', error);
        res.status(500).json({
            success: false,
            error: 'Error deleting year'
    });
    }
});

// Handle Excel upload for yearly content for a specific year
router.post('/upload-yearly/:yearId', requireAuth, upload.single('excelFile'), async (req, res) => {
    try {
        const { yearId } = req.params;
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        // Find the year document
        const yearDoc = await NumerologyYearlyYear.findById(yearId);
        if (!yearDoc) {
            return res.status(404).json({ error: 'Year not found' });
        }
        
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);
        
        // Remove all existing entries for this year
        await NumerologyYearly.deleteMany({ yearRef: yearId });
        
        // Insert new entries
        const entries = data.map((row, index) => ({
            yearRef: yearId,
            sequence: index + 1, // Maintain Excel order
            title_hn: row.title_hn || '',
            title_en: row.title_en || '',
            date: row.date || '',
            details_hn: row.details_hn || '',
            details_en: row.details_en || '',
            images: row.images ? row.images.split(',').map(img => img.trim()) : []
        }));
        await NumerologyYearly.insertMany(entries);
        
        // Fetch updated data for this year
        const yearlyContent = await NumerologyYearly.find({ yearRef: yearId }).sort({ sequence: 1 });
        res.json({
            success: true,
            message: 'Excel data uploaded successfully for the year',
            data: yearlyContent
        });
    } catch (error) {
        console.error('Error uploading Excel for year:', error);
        res.status(500).json({
            success: false,
            error: 'Error processing Excel file for year'
        });
    }
});

// Update a yearly content entry
router.put('/yearly-content/:contentId', requireAuth, async (req, res) => {
    try {
        const { contentId } = req.params;
        const { title_hn, title_en, date, details_hn, details_en, images } = req.body;
        
        const content = await NumerologyYearly.findByIdAndUpdate(
            contentId,
            {
                title_hn,
                title_en,
                date,
                details_hn,
                details_en,
                images: Array.isArray(images) ? images : (images ? String(images).split(',').map(s => s.trim()) : [])
            },
            { new: true }
        );
        
        if (!content) {
            return res.status(404).json({ error: 'Content not found' });
        }
        
        res.json({
            success: true,
            message: 'Content updated successfully',
            data: content
        });
    } catch (error) {
        console.error('Error updating content:', error);
        res.status(500).json({
            success: false,
            error: 'Error updating content'
        });
    }
});

// Delete a yearly content entry
router.delete('/yearly-content/:contentId', requireAuth, async (req, res) => {
    try {
        const { contentId } = req.params;
        const deleted = await NumerologyYearly.findByIdAndDelete(contentId);
        
        if (!deleted) {
            return res.status(404).json({ error: 'Content not found' });
        }
        
        res.json({
            success: true,
            message: 'Content deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting content:', error);
        res.status(500).json({
            success: false,
            error: 'Error deleting content'
        });
    }
});

// Monthly Numerology Excel upload (updated for year-based system)
router.post('/upload-monthly/:yearId/:month', requireAuth, upload.single('excelFile'), async (req, res) => {
    try {
        const { yearId, month } = req.params;
        if (!MONTHS.includes(month)) {
            return res.status(400).json({ error: 'Invalid month' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        // Find the year document
        const yearDoc = await NumerologyMonthlyYear.findById(yearId);
        if (!yearDoc) {
            return res.status(404).json({ error: 'Year not found' });
        }

        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);
        
        // Remove all existing entries for this month and year
        await NumerologyMonthly.deleteMany({ yearRef: yearId, month });
        
        // Insert new entries
        const entries = data.map((row, index) => ({
            yearRef: yearId,
            sequence: index + 1, // Maintain Excel order
            month,
            title_hn: row.title_hn || '',
            title_en: row.title_en || '',
            details_hn: row.details_hn || '',
            details_en: row.details_en || '',
            images: row.images ? row.images.split(',').map(img => img.trim()) : []
        }));
        await NumerologyMonthly.insertMany(entries);
        
        // Fetch updated data for this month and year in Excel order
        const monthData = await NumerologyMonthly.find({ yearRef: yearId, month }).sort({ sequence: 1 });
        res.json({
            success: true,
            message: 'Excel data uploaded successfully',
            data: monthData
        });
    } catch (error) {
        console.error('Error uploading monthly Excel:', error);
        res.status(500).json({
            success: false,
            error: 'Error processing Excel file'
        });
    }
});

// Create a new monthly year
router.post('/monthly-year/create', requireAuth, async (req, res) => {
    try {
        const { year, description } = req.body;
        if (!year) {
            return res.status(400).json({ error: 'Year is required' });
        }
        
        // Check if year already exists
        const existing = await NumerologyMonthlyYear.findOne({ year });
        if (existing) {
            return res.status(400).json({ error: 'Year already exists' });
        }
        
        const yearDoc = new NumerologyMonthlyYear({ year, description });
        await yearDoc.save();
        
        res.json({
            success: true,
            message: 'Year created successfully',
            data: yearDoc
        });
    } catch (error) {
        console.error('Error creating year:', error);
        res.status(500).json({
            success: false,
            error: 'Error creating year'
        });
    }
});

// Delete a monthly year and all its content
router.post('/monthly-year/delete/:yearId', requireAuth, async (req, res) => {
    try {
        const { yearId } = req.params;
        const yearDoc = await NumerologyMonthlyYear.findById(yearId);
        if (!yearDoc) {
            return res.status(404).json({ error: 'Year not found' });
        }
        
        // Delete all monthly content for this year
        await NumerologyMonthly.deleteMany({ yearRef: yearId });
        
        // Delete the year
        await NumerologyMonthlyYear.findByIdAndDelete(yearId);
        
        res.json({
            success: true,
            message: 'Year and all its content deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting year:', error);
        res.status(500).json({
            success: false,
            error: 'Error deleting year'
        });
    }
});

// Update a monthly content entry
router.put('/monthly-content/:contentId', requireAuth, async (req, res) => {
    try {
        const { contentId } = req.params;
        const { title_hn, title_en, details_hn, details_en, images } = req.body;
        
        const content = await NumerologyMonthly.findByIdAndUpdate(
            contentId,
            {
                title_hn,
                title_en,
                details_hn,
                details_en,
                images: Array.isArray(images) ? images : (images ? String(images).split(',').map(s => s.trim()) : [])
            },
            { new: true }
        );
        
        if (!content) {
            return res.status(404).json({ error: 'Content not found' });
        }
        
        res.json({
            success: true,
            message: 'Content updated successfully',
            data: content
        });
    } catch (error) {
        console.error('Error updating content:', error);
        res.status(500).json({
            success: false,
            error: 'Error updating content'
        });
    }
});

// Delete a monthly content entry
router.delete('/monthly-content/:contentId', requireAuth, async (req, res) => {
    try {
        const { contentId } = req.params;
        const content = await NumerologyMonthly.findByIdAndDelete(contentId);
        
        if (!content) {
            return res.status(404).json({ error: 'Content not found' });
        }
        
        res.json({
            success: true,
            message: 'Content deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting content:', error);
        res.status(500).json({
            success: false,
            error: 'Error deleting content'
        });
    }
});

// Get all months for a specific year
router.get('/monthly-year/:yearId/months', requireAuth, async (req, res) => {
    try {
        const { yearId } = req.params;
        const yearDoc = await NumerologyMonthlyYear.findById(yearId);
        if (!yearDoc) {
            return res.status(404).json({ error: 'Year not found' });
        }
        
        // Get content for each month
        const monthsData = {};
        for (const month of MONTHS) {
            monthsData[month] = await NumerologyMonthly.find({ 
                yearRef: yearId, 
                month 
            }).sort({ sequence: 1 });
        }
        
        res.json({
            success: true,
            year: yearDoc,
            months: monthsData
        });
    } catch (error) {
        console.error('Error fetching months:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching months'
        });
    }
});

// Upload daily dates via Excel
router.post('/upload-daily-dates', requireAuth, upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);
        
        // Create dates from Excel - maintain Excel order with sequence
        const dates = data.map((row, index) => ({
            dateLabel: row.dateLabel || row.date_label || row.date || '',
            sequence: index + 1 // Maintain Excel row order
        })).filter(d => d.dateLabel);
        
        const created = await NumerologyDailyDate.insertMany(dates);
        
        res.json({
            success: true,
            message: 'Dates uploaded successfully',
            count: created.length
        });
    } catch (error) {
        console.error('Error uploading daily dates:', error);
        res.status(500).json({
            success: false,
            error: 'Error processing Excel file'
        });
    }
});

module.exports = router; 