const express = require('express');
const router = express.Router();

const EMagazineCategory = require('../../models/EMagazineCategory');
const EMagazineSubject = require('../../models/EMagazineSubject');
const EMagazineWriter = require('../../models/EMagazineWriter');
const EMagazine = require('../../models/EMagazine');

// GET all categories
router.get('/category', async (req, res) => {
    try {
        const categories = await EMagazineCategory.find();
        res.json({ success: true, categories });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET all magazines in a category (by category id, not _id)
router.get('/category/:categoryId', async (req, res) => {
    try {
        // Find the category by id field
        const category = await EMagazineCategory.findOne({ id: req.params.categoryId });
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        // Find magazines with this category's _id
        const magazines = await EMagazine.find({ category: category._id })
            .populate('category', 'name')
            .populate('subject', 'name')
            .populate('writer', 'name');
        // Map magazines to only include names for category, subject, writer
        const result = magazines.map(mag => ({
            _id: mag._id,
            language: mag.language,
            category: mag.category ? mag.category.name : '',
            subject: mag.subject ? mag.subject.name : '',
            writer: mag.writer ? mag.writer.name : '',
            month: mag.month,
            year: mag.year,
            title: mag.title,
            introduction: mag.introduction,
            subPoints: mag.subPoints,
            importance: mag.importance,
            explain: mag.explain,
            summary: mag.summary,
            reference: mag.reference,
            images: mag.images
        }));
        res.json({ success: true, magazines: result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET all subjects
router.get('/subject', async (req, res) => {
    try {
        const subjects = await EMagazineSubject.find();
        res.json({ success: true, subjects });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET all writers
router.get('/writer', async (req, res) => {
    try {
        const writers = await EMagazineWriter.find();
        res.json({ success: true, writers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET all magazines for a specific subject (by subject id)
router.get('/subject/:subjectId', async (req, res) => {
    try {
        // Find the subject by id field
        const subject = await EMagazineSubject.findOne({ id: req.params.subjectId });
        if (!subject) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }
        // Find magazines with this subject's _id
        const magazines = await EMagazine.find({ subject: subject._id })
            .populate('category', 'name')
            .populate('subject', 'name')
            .populate('writer', 'name');
        // Map magazines to only include names for category, subject, writer
        const result = magazines.map(mag => ({
            _id: mag._id,
            language: mag.language,
            category: mag.category ? mag.category.name : '',
            subject: mag.subject ? mag.subject.name : '',
            writer: mag.writer ? mag.writer.name : '',
            month: mag.month,
            year: mag.year,
            title: mag.title,
            introduction: mag.introduction,
            subPoints: mag.subPoints,
            importance: mag.importance,
            explain: mag.explain,
            summary: mag.summary,
            reference: mag.reference,
            images: mag.images
        }));
        res.json({ success: true, magazines: result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET all magazines for a specific writer (by writer id)
router.get('/writer/:writerId', async (req, res) => {
    try {
        // Find the writer by id field
        const writer = await EMagazineWriter.findOne({ id: req.params.writerId });
        if (!writer) {
            return res.status(404).json({ success: false, message: 'Writer not found' });
        }
        // Find magazines with this writer's _id
        const magazines = await EMagazine.find({ writer: writer._id })
            .populate('category', 'name')
            .populate('subject', 'name')
            .populate('writer', 'name');
        // Map magazines to only include names for category, subject, writer
        const result = magazines.map(mag => ({
            _id: mag._id,
            language: mag.language,
            category: mag.category ? mag.category.name : '',
            subject: mag.subject ? mag.subject.name : '',
            writer: mag.writer ? mag.writer.name : '',
            month: mag.month,
            year: mag.year,
            title: mag.title,
            introduction: mag.introduction,
            subPoints: mag.subPoints,
            importance: mag.importance,
            explain: mag.explain,
            summary: mag.summary,
            reference: mag.reference,
            images: mag.images
        }));
        res.json({ success: true, magazines: result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET all magazines (irrespective of category, writer, and subjects) with pagination
router.get('/all', async (req, res) => {
    try {
        // Get pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Fixed limit of 10 per page
        const skip = (page - 1) * limit;

        // Get total count of all magazines
        const total = await EMagazine.countDocuments({});

        // Find all magazines without any filters with pagination
        const magazines = await EMagazine.find({})
            .populate('category', 'name')
            .populate('subject', 'name')
            .populate('writer', 'name')
            .sort({ createdAt: -1 }) // Sort by newest first
            .skip(skip)
            .limit(limit);
        
        // Map magazines to only include names for category, subject, writer
        const result = magazines.map(mag => ({
            _id: mag._id,
            language: mag.language,
            category: mag.category ? mag.category.name : '',
            subject: mag.subject ? mag.subject.name : '',
            writer: mag.writer ? mag.writer.name : '',
            month: mag.month,
            year: mag.year,
            title: mag.title,
            introduction: mag.introduction,
            subPoints: mag.subPoints,
            importance: mag.importance,
            explain: mag.explain,
            summary: mag.summary,
            reference: mag.reference,
            images: mag.images
        }));

        // Calculate total pages
        const totalPages = Math.ceil(total / limit);

        res.json({ 
            success: true, 
            magazines: result, 
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalMagazines: total,
                limit: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router; 