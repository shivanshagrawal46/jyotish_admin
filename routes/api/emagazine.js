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

module.exports = router; 