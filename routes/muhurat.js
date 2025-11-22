const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const MuhuratCategory = require('../models/MuhuratCategory');
const MuhuratContent = require('../models/MuhuratContent');

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

// Main muhurat page
router.get('/', requireAuth, async (req, res) => {
    try {
        const categories = await MuhuratCategory.find().sort({ createdAt: -1 });
        res.render('muhurat/index', {
            username: req.session.username,
            activePage: 'muhurat',
            categories
        });
    } catch (error) {
        res.render('muhurat/index', {
            username: req.session.username,
            activePage: 'muhurat',
            categories: [],
            error: 'Error loading muhurat data'
        });
    }
});

// ============= CATEGORY ROUTES =============

// Add category form
router.get('/category/add', requireAuth, (req, res) => {
    res.render('muhurat/categoryAdd', {
        username: req.session.username,
        activePage: 'muhurat'
    });
});

// Create category
router.post('/category/add', requireAuth, async (req, res) => {
    try {
        const { categoryName, imageUrl } = req.body;
        await MuhuratCategory.create({ 
            categoryName, 
            imageUrl: imageUrl || undefined 
        });
        res.redirect('/muhurat');
    } catch (err) {
        res.status(500).send('Error creating category: ' + err.message);
    }
});

// Edit category form
router.get('/category/edit/:id', requireAuth, async (req, res) => {
    try {
        const category = await MuhuratCategory.findById(req.params.id);
        if (!category) return res.status(404).send('Category not found');
        res.render('muhurat/categoryEdit', { 
            category, 
            username: req.session.username,
            activePage: 'muhurat'
        });
    } catch (err) {
        res.status(500).send('Error: ' + err.message);
    }
});

// Update category
router.post('/category/edit/:id', requireAuth, async (req, res) => {
    try {
        const { categoryName, imageUrl } = req.body;
        await MuhuratCategory.findByIdAndUpdate(req.params.id, { 
            categoryName, 
            imageUrl: imageUrl || undefined 
        });
        res.redirect('/muhurat');
    } catch (err) {
        res.status(500).send('Error updating category: ' + err.message);
    }
});

// Delete category
router.post('/category/delete/:id', requireAuth, async (req, res) => {
    try {
        const categoryId = req.params.id;
        // Delete all content under this category
        await MuhuratContent.deleteMany({ categoryId });
        // Delete the category
        await MuhuratCategory.findByIdAndDelete(categoryId);
        res.redirect('/muhurat');
    } catch (err) {
        res.status(500).send('Error deleting category: ' + err.message);
    }
});

// ============= CONTENT ROUTES =============

// View content for a category
router.get('/content/:categoryId', requireAuth, async (req, res) => {
    try {
        const category = await MuhuratCategory.findById(req.params.categoryId);
        if (!category) return res.status(404).send('Category not found');
        
        const contents = await MuhuratContent.find({ categoryId: req.params.categoryId })
            .sort({ year: -1, date: 1 });
        
        res.render('muhurat/content', {
            username: req.session.username,
            activePage: 'muhurat',
            category,
            contents
        });
    } catch (err) {
        res.status(500).send('Error: ' + err.message);
    }
});

// Add content form
router.get('/content/:categoryId/add', requireAuth, async (req, res) => {
    try {
        const category = await MuhuratCategory.findById(req.params.categoryId);
        if (!category) return res.status(404).send('Category not found');
        
        res.render('muhurat/contentAdd', {
            username: req.session.username,
            activePage: 'muhurat',
            category
        });
    } catch (err) {
        res.status(500).send('Error: ' + err.message);
    }
});

// Create content
router.post('/content/:categoryId/add', requireAuth, async (req, res) => {
    try {
        const { year, date, detail } = req.body;
        const categoryId = req.params.categoryId;
        
        await MuhuratContent.create({ 
            categoryId,
            year: year ? parseInt(year) : undefined,
            date: date || undefined,
            detail: detail || undefined
        });
        
        res.redirect(`/muhurat/content/${categoryId}`);
    } catch (err) {
        res.status(500).send('Error creating content: ' + err.message);
    }
});

// Edit content form
router.get('/content/:categoryId/edit/:contentId', requireAuth, async (req, res) => {
    try {
        const category = await MuhuratCategory.findById(req.params.categoryId);
        const content = await MuhuratContent.findById(req.params.contentId);
        
        if (!category || !content) return res.status(404).send('Not found');
        
        res.render('muhurat/contentEdit', { 
            category,
            content,
            username: req.session.username,
            activePage: 'muhurat'
        });
    } catch (err) {
        res.status(500).send('Error: ' + err.message);
    }
});

// Update content
router.post('/content/:categoryId/edit/:contentId', requireAuth, async (req, res) => {
    try {
        const { year, date, detail } = req.body;
        const { categoryId, contentId } = req.params;
        
        const updateData = {};
        if (year) updateData.year = parseInt(year);
        if (date) updateData.date = date;
        if (detail) updateData.detail = detail;
        
        await MuhuratContent.findByIdAndUpdate(contentId, updateData);
        
        res.redirect(`/muhurat/content/${categoryId}`);
    } catch (err) {
        res.status(500).send('Error updating content: ' + err.message);
    }
});

// Delete content
router.post('/content/:categoryId/delete/:contentId', requireAuth, async (req, res) => {
    try {
        await MuhuratContent.findByIdAndDelete(req.params.contentId);
        res.redirect(`/muhurat/content/${req.params.categoryId}`);
    } catch (err) {
        res.status(500).send('Error deleting content: ' + err.message);
    }
});

// Upload Excel for content
router.post('/content/:categoryId/upload-excel', requireAuth, upload.single('excelFile'), async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const category = await MuhuratCategory.findById(categoryId);
        
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        // Expected columns: year, date, detail
        const contents = data.map(row => ({
            categoryId,
            year: row.year ? parseInt(row.year) : undefined,
            date: row.date || undefined,
            detail: row.detail || undefined
        }));

        await MuhuratContent.insertMany(contents);

        res.json({
            success: true,
            message: 'Content uploaded successfully',
            count: contents.length
        });
    } catch (error) {
        console.error('Error uploading content:', error);
        res.status(500).json({
            success: false,
            error: 'Error processing Excel file'
        });
    }
});

module.exports = router;

