const express = require('express');
const router = express.Router();
const KoshCategory = require('../../models/KoshCategory');
const auth = require('../../middleware/auth');

// Get all Kosh Categories with pagination (integer id)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const categories = await KoshCategory.find()
            .sort({ position: 1 })
            .skip(skip)
            .limit(limit)
            .select('-_id id name position introduction createdAt');

        const total = await KoshCategory.countDocuments();

        res.json({
            categories,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalCategories: total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all subcategories in a category (by integer id, paginated)
router.get('/:categoryId', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;
        const KoshSubCategory = require('../../models/KoshSubCategory');
        const category = await KoshCategory.findOne({ id: parseInt(req.params.categoryId) });
        if (!category) return res.status(404).json({ message: 'Category not found' });
        const subcategories = await KoshSubCategory.find({ parentCategory: category._id })
            .sort({ position: 1 })
            .skip(skip)
            .limit(limit)
            .select('-_id id name position introduction createdAt');
        const total = await KoshSubCategory.countDocuments({ parentCategory: category._id });
        res.json({
            subcategories,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalSubcategories: total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all content in a subcategory (by integer id, paginated)
router.get('/:categoryId/:subCategoryId', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;
        const KoshSubCategory = require('../../models/KoshSubCategory');
        const KoshContent = require('../../models/KoshContent');
        const category = await KoshCategory.findOne({ id: parseInt(req.params.categoryId) });
        if (!category) return res.status(404).json({ message: 'Category not found' });
        const subcategory = await KoshSubCategory.findOne({ id: parseInt(req.params.subCategoryId), parentCategory: category._id });
        if (!subcategory) return res.status(404).json({ message: 'Subcategory not found' });
        
        // Get all contents for vishesh_suchi
        const allContents = await KoshContent.find({ subCategory: subcategory._id });
        console.log('1. Found total contents for subcategory:', allContents.length);

        // Process search terms
        const searchTermsSet = new Set();
        allContents.forEach((content, index) => {
            console.log(`Content ${index + 1} search field: "${content.search}" (type: ${typeof content.search})`);
            if (content.search && typeof content.search === 'string' && content.search.trim() !== '') {
                const terms = content.search.split(',')
                    .map(term => term.trim())
                    .filter(term => term !== '');
                console.log(`Content ${index + 1} extracted terms:`, terms);
                terms.forEach(term => searchTermsSet.add(term));
            }
        });

        // Convert Set to sorted array
        const vishesh_suchi = Array.from(searchTermsSet).sort();
        console.log('2. Extracted vishesh_suchi:', vishesh_suchi);

        // Get paginated contents
        const contents = await KoshContent.find({ subCategory: subcategory._id })
            .sort({ sequenceNo: 1 })
            .skip(skip)
            .limit(limit)
            .select('-_id id sequenceNo hindiWord englishWord hinglishWord meaning extra structure search youtubeLink image createdAt');
        const total = await KoshContent.countDocuments({ subCategory: subcategory._id });
        
        res.json({
            contents,
            vishesh_suchi: vishesh_suchi,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalContents: total
        });
    } catch (error) {
        console.error('Error in category/subcategory API:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get a single Kosh Category
router.get('/:id', async (req, res) => {
    try {
        const category = await KoshCategory.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new Kosh Category (protected route)
router.post('/', auth, async (req, res) => {
    try {
        const category = new KoshCategory({
            name: req.body.name,
            description: req.body.description,
            position: req.body.position,
            isActive: req.body.isActive
        });
        const newCategory = await category.save();
        res.status(201).json(newCategory);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update a Kosh Category (protected route)
router.put('/:id', auth, async (req, res) => {
    try {
        const category = await KoshCategory.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        category.name = req.body.name;
        category.description = req.body.description;
        category.position = req.body.position;
        category.isActive = req.body.isActive;

        const updatedCategory = await category.save();
        res.json(updatedCategory);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete a Kosh Category (protected route)
router.delete('/:id', auth, async (req, res) => {
    try {
        const category = await KoshCategory.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        await category.remove();
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 