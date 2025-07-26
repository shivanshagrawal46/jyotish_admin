const express = require('express');
const router = express.Router();
const KarmkandCategory = require('../../models/KarmkandCategory');
const KarmkandSubCategory = require('../../models/KarmkandSubCategory');
const KarmkandContent = require('../../models/KarmkandContent');

// GET /api/karmkand/category - Get all categories
router.get('/category', async (req, res) => {
    try {
        const categories = await KarmkandCategory.find()
            .sort({ position: 1 })
            .select('id name position introduction cover_image -_id');

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
});

// GET /api/karmkand/category/:categoryId - Get all subcategories for a category
router.get('/category/:categoryId', async (req, res) => {
    try {
        const { categoryId } = req.params;

        // Check if category exists
        const category = await KarmkandCategory.findOne({ id: categoryId });
        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }

        const subcategories = await KarmkandSubCategory.find({ parentCategory: category._id })
            .sort({ position: 1 })
            .select('id name position introduction cover_image -_id');

        res.json({
            success: true,
            data: subcategories
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
});

// GET /api/karmkand/category/:categoryId/:subcategoryId - Get all contents for a subcategory with pagination
router.get('/category/:categoryId/:subcategoryId', async (req, res) => {
    try {
        const { categoryId, subcategoryId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Check if category exists
        const category = await KarmkandCategory.findOne({ id: categoryId });
        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }

        // Check if subcategory exists and belongs to the category
        const subcategory = await KarmkandSubCategory.findOne({
            id: subcategoryId,
            parentCategory: category._id
        });
        if (!subcategory) {
            return res.status(404).json({
                success: false,
                error: 'Subcategory not found'
            });
        }

        // Get total count for pagination (filter only by subCategory)
        const total = await KarmkandContent.countDocuments({
            subCategory: subcategory._id
        });

        // Get all contents for vishesh_suchi extraction (no pagination)
        const allContents = await KarmkandContent.find({
            subCategory: subcategory._id
        });

        // Process search terms for vishesh_suchi
        const searchTermsSet = new Set();
        allContents.forEach((content) => {
            if (content.search && typeof content.search === 'string' && content.search.trim() !== '') {
                const terms = content.search.split(',')
                    .map(term => term.trim())
                    .filter(term => term !== '');
                terms.forEach(term => searchTermsSet.add(term));
            }
        });
        const vishesh_suchi = Array.from(searchTermsSet).sort();

        // Get contents with pagination (filter only by subCategory)
        const contents = await KarmkandContent.find({
            subCategory: subcategory._id
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('id hindiWord englishWord hinglishWord meaning extra structure search youtubeLink image sequenceNo -_id');

        res.json({
            success: true,
            data: {
                contents,
                vishesh_suchi,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: limit
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
});

module.exports = router; 