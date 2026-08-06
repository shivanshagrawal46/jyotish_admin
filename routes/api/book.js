const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const BookCategory = require('../../models/BookCategory');
const BookName = require('../../models/BookName');
const BookChapter = require('../../models/BookChapter');
const BookContent = require('../../models/BookContent');

// Get all categories
router.get('/category', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const categories = await BookCategory.find()
            .select('id name cover_image')
            .sort({ id: 1 })
            .skip(skip)
            .limit(limit);

        const total = await BookCategory.countDocuments();

        res.json({
            success: true,
            data: categories,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching categories',
            error: error.message
        });
    }
});

// Book index (table of contents): chapters -> topics, with auto-derived page
// numbers. Accepts either the numeric book id or its _id.
router.get('/index/:nameId', async (req, res) => {
    try {
        const { loadBookIndex, flattenIndex, DEFAULT_CHARS_PER_PAGE, DEFAULT_IMAGE_CHARS } = require('../../services/bookIndex');

        const filters = [];
        const numericId = parseInt(req.params.nameId, 10);
        if (!Number.isNaN(numericId)) filters.push({ id: numericId });
        if (mongoose.Types.ObjectId.isValid(req.params.nameId)) filters.push({ _id: req.params.nameId });
        if (!filters.length) {
            return res.status(400).json({ success: false, message: 'Invalid book id' });
        }

        const book = await BookName.findOne({ $or: filters })
            .populate('category', 'id name')
            .lean();

        if (!book) {
            return res.status(404).json({ success: false, message: 'Book not found' });
        }

        const clamp = (value, fallback, min, max) => {
            const n = parseInt(value, 10);
            if (Number.isNaN(n)) return fallback;
            return Math.min(Math.max(n, min), max);
        };

        const index = await loadBookIndex({
            book,
            ChapterModel: BookChapter,
            ContentModel: BookContent,
            charsPerPage: clamp(req.query.chars_per_page, DEFAULT_CHARS_PER_PAGE, 200, 20000),
            imageChars: clamp(req.query.image_chars, DEFAULT_IMAGE_CHARS, 0, 20000),
            includeFrontMatter: req.query.front_matter !== '0',
        });

        res.json({
            success: true,
            data: {
                book: {
                    id: book.id,
                    _id: book._id,
                    name: book.name,
                    book_image: book.book_image || '',
                    author: book.author || '',
                    publications: book.publications || '',
                    isbn_no: book.isbn_no || '',
                    acknowledgement_title: book.acknowledgement_title || '',
                    category: book.category || null,
                },
                ...index,
                ...(req.query.flat === '1' || req.query.flat === 'true'
                    ? { flat: flattenIndex(index) }
                    : {}),
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error building book index',
            error: error.message
        });
    }
});

// Get books by category
router.get('/category/:categoryId', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const category = await BookCategory.findOne({ id: req.params.categoryId });
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        const books = await BookName.find({ category: category._id })
            .select('id name book_image author publications acknowledgement_title acknowledgement_content isbn_no')
            .sort({ id: 1 })
            .skip(skip)
            .limit(limit);

        const total = await BookName.countDocuments({ category: category._id });

        res.json({
            success: true,
            data: books,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching books',
            error: error.message
        });
    }
});

// Get chapters by book
router.get('/category/:categoryId/:nameId', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const category = await BookCategory.findOne({ id: req.params.categoryId });
        const book = await BookName.findOne({ id: req.params.nameId });

        if (!category || !book) {
            return res.status(404).json({
                success: false,
                message: 'Category or book not found'
            });
        }

        const chapters = await BookChapter.find({
            category: category._id,
            book: book._id
        })
        .select('id name')
        .sort({ id: 1 })
        .skip(skip)
        .limit(limit);

        const total = await BookChapter.countDocuments({
            category: category._id,
            book: book._id
        });

        res.json({
            success: true,
            data: chapters,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching chapters',
            error: error.message
        });
    }
});

// Get content by chapter
router.get('/category/:categoryId/:nameId/:chapterId', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const category = await BookCategory.findOne({ id: req.params.categoryId });
        const book = await BookName.findOne({ id: req.params.nameId });
        const chapter = await BookChapter.findOne({ id: req.params.chapterId });

        if (!category || !book || !chapter) {
            return res.status(404).json({
                success: false,
                message: 'Category, book, or chapter not found'
            });
        }

        let content = await BookContent.find({
            category: category._id,
            book: book._id,
            chapter: chapter._id
        })
        .select('id title_hn title_en title_hinglish meaning details extra images video_links payment amount')
        .sort({ sequence: 1 })
        .skip(skip)
        .limit(limit)
        .lean();

        // Paid-content gating (books are keyed by _id since they have no numeric id)
        const { gateItems } = require('../../services/purchaseGating');
        content = await gateItems(content, {
            module: 'book',
            email: req.query.email,
            phone: req.query.phone,
            idField: '_id',
            bodyFields: ['meaning', 'details', 'extra', 'video_links'],
        });

        const total = await BookContent.countDocuments({
            category: category._id,
            book: book._id,
            chapter: chapter._id
        });

        res.json({
            success: true,
            data: content,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching content',
            error: error.message
        });
    }
});

// Get specific content by ID within a chapter
router.get('/category/:categoryId/:nameId/:chapterId/:contentId', async (req, res) => {
    try {
        const category = await BookCategory.findOne({ id: req.params.categoryId });
        const book = await BookName.findOne({ id: req.params.nameId });
        const chapter = await BookChapter.findOne({ id: req.params.chapterId });

        if (!category || !book || !chapter) {
            return res.status(404).json({
                success: false,
                message: 'Category, book, or chapter not found'
            });
        }

        const contentFilters = [{ id: req.params.contentId }];
        const numericContentId = parseInt(req.params.contentId, 10);
        if (!Number.isNaN(numericContentId)) {
            contentFilters.push({ id: numericContentId });
        }
        if (mongoose.Types.ObjectId.isValid(req.params.contentId)) {
            contentFilters.push({ _id: req.params.contentId });
        }

        const contentDoc = await BookContent.findOne({
            category: category._id,
            book: book._id,
            chapter: chapter._id,
            $or: contentFilters
        })
        .select('id title_hn title_en title_hinglish meaning details extra images video_links payment amount')
        .lean();

        if (!contentDoc) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }

        const { gateItems } = require('../../services/purchaseGating');
        const [content] = await gateItems([contentDoc], {
            module: 'book',
            email: req.query.email,
            phone: req.query.phone,
            idField: '_id',
            bodyFields: ['meaning', 'details', 'extra', 'video_links'],
        });

        res.json({
            success: true,
            data: content
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching content',
            error: error.message
        });
    }
});

module.exports = router; 