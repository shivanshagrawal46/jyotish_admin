const express = require('express');
const router = express.Router();
const Puja = require('../models/Puja');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const slugify = require('slugify');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'public/uploads/puja';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Main page - List all pujas with pagination
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Items per page
        const skip = (page - 1) * limit;

        // Get total count of pujas
        const totalPujas = await Puja.countDocuments();
        const totalPages = Math.ceil(totalPujas / limit);

        // Get pujas for current page
        const pujas = await Puja.find()
            .sort({ puja_date: -1 })
            .skip(skip)
            .limit(limit);

        res.render('puja/index', {
            pujas,
            pagination: {
                currentPage: page,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Add Puja form
router.get('/add', (req, res) => {
    res.render('puja/add');
});

// Handle Add Puja POST
router.post('/add', upload.single('image'), async (req, res) => {
    try {
        const {
            title,
            tagline,
            temple_name,
            temple_location,
            puja_date,
            puja_day,
            description,
            banner_text,
            total_slots,
            countdown_time,
            is_last_day,
            is_active,
            whatsapp_link
        } = req.body;

        // Generate slug from title
        const slug = slugify(title, { lower: true, strict: true });

        // Handle image upload
        let image_url = '';
        if (req.file) {
            image_url = '/uploads/puja/' + req.file.filename;
        }

        const puja = new Puja({
            title,
            slug,
            tagline,
            temple_name,
            temple_location,
            puja_date,
            puja_day,
            description,
            image_url,
            banner_text,
            total_slots,
            countdown_time,
            is_last_day: is_last_day === 'on',
            is_active: is_active === 'on',
            whatsapp_link
        });

        await puja.save();
        res.redirect('/puja');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error saving puja: ' + err.message);
    }
});

module.exports = router; 