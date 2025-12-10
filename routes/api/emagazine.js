const express = require('express');
const router = express.Router();

const EMagazineCategory = require('../../models/EMagazineCategory');
const EMagazineSubject = require('../../models/EMagazineSubject');
const EMagazineWriter = require('../../models/EMagazineWriter');
const EMagazine = require('../../models/EMagazine');

// ============================================
// Helper function for aggregation with lookups (single query instead of multiple populates)
// ============================================
async function getMagazinesWithLookup(matchQuery = {}, skip = 0, limit = null, sort = { createdAt: -1 }) {
    const pipeline = [
        { $match: matchQuery },
        { $sort: sort },
        // Use $lookup to join in a single query (much faster than multiple populate)
        {
            $lookup: {
                from: 'emagazinecategories',
                localField: 'category',
                foreignField: '_id',
                as: 'categoryData'
            }
        },
        {
            $lookup: {
                from: 'emagazinesubjects',
                localField: 'subject',
                foreignField: '_id',
                as: 'subjectData'
            }
        },
        {
            $lookup: {
                from: 'emagazinewriters',
                localField: 'writer',
                foreignField: '_id',
                as: 'writerData'
            }
        },
        // Project to format the output
        {
            $project: {
                _id: 1,
                language: 1,
                category: { $arrayElemAt: ['$categoryData.name', 0] },
                subject: { $arrayElemAt: ['$subjectData.name', 0] },
                writer: { $arrayElemAt: ['$writerData.name', 0] },
                month: 1,
                year: 1,
                title: 1,
                introduction: 1,
                subPoints: 1,
                importance: 1,
                explain: 1,
                summary: 1,
                reference: 1,
                images: 1
            }
        }
    ];

    // Add skip if provided
    if (skip > 0) {
        pipeline.push({ $skip: skip });
    }

    // Add limit if provided
    if (limit) {
        pipeline.push({ $limit: limit });
    }

    return await EMagazine.aggregate(pipeline);
}

// GET all categories - OPTIMIZED
router.get('/category', async (req, res) => {
    try {
        const categories = await EMagazineCategory.find().lean();
        res.json({ success: true, categories });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET all magazines in a category (by category id, not _id) - OPTIMIZED
router.get('/category/:categoryId', async (req, res) => {
    try {
        // Find the category by id field
        const category = await EMagazineCategory.findOne({ id: req.params.categoryId }).lean();
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        
        // Use aggregation with $lookup (single query instead of 4 queries)
        const result = await getMagazinesWithLookup({ category: category._id });
        
        res.json({ success: true, magazines: result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET all subjects - OPTIMIZED
router.get('/subject', async (req, res) => {
    try {
        const subjects = await EMagazineSubject.find().lean();
        res.json({ success: true, subjects });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET all writers - OPTIMIZED
router.get('/writer', async (req, res) => {
    try {
        const writers = await EMagazineWriter.find().lean();
        res.json({ success: true, writers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET all magazines for a specific subject (by subject id) - OPTIMIZED
router.get('/subject/:subjectId', async (req, res) => {
    try {
        // Find the subject by id field
        const subject = await EMagazineSubject.findOne({ id: req.params.subjectId }).lean();
        if (!subject) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }
        
        // Use aggregation with $lookup (single query instead of 4 queries)
        const result = await getMagazinesWithLookup({ subject: subject._id });
        
        res.json({ success: true, magazines: result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET all magazines for a specific writer (by writer id) - OPTIMIZED
router.get('/writer/:writerId', async (req, res) => {
    try {
        // Find the writer by id field
        const writer = await EMagazineWriter.findOne({ id: req.params.writerId }).lean();
        if (!writer) {
            return res.status(404).json({ success: false, message: 'Writer not found' });
        }
        
        // Use aggregation with $lookup (single query instead of 4 queries)
        const result = await getMagazinesWithLookup({ writer: writer._id });
        
        res.json({ success: true, magazines: result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET all magazines (irrespective of category, writer, and subjects) with pagination - OPTIMIZED
router.get('/all', async (req, res) => {
    try {
        // Get pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Fixed limit of 10 per page
        const skip = (page - 1) * limit;

        // Get total count of all magazines (uses index on _id)
        const total = await EMagazine.countDocuments({});

        // Use aggregation with $lookup (single query instead of 4 queries)
        const result = await getMagazinesWithLookup({}, skip, limit, { createdAt: -1 });

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