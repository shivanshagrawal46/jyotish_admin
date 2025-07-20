const express = require('express');
const router = express.Router();
const KoshContent = require('../../models/KoshContent');
const auth = require('../../middleware/auth');

// Get all Kosh Contents with pagination
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const contents = await KoshContent.find()
            .populate('category', 'name')
            .populate('subcategory', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await KoshContent.countDocuments();
        
        res.json({
            contents,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalContents: total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Search Kosh Contents
router.get('/search', async (req, res) => {
    try {
        const query = req.query.q;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const searchQuery = {
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { content: { $regex: query, $options: 'i' } },
                { keywords: { $regex: query, $options: 'i' } }
            ]
        };

        const contents = await KoshContent.find(searchQuery)
            .populate('category', 'name')
            .populate('subcategory', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await KoshContent.countDocuments(searchQuery);

        res.json({
            contents,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalContents: total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get contents by category
router.get('/category/:categoryId', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Get all contents for vishesh_suchi
        const allContents = await KoshContent.find({ category: req.params.categoryId });
        console.log('Category API - Found total contents:', allContents.length);

        // Process search terms
        const searchTermsSet = new Set();
        allContents.forEach((content, index) => {
            console.log(`Category Content ${index + 1} search field: "${content.search}"`);
            if (content.search && typeof content.search === 'string' && content.search.trim() !== '') {
                const terms = content.search.split(',')
                    .map(term => term.trim())
                    .filter(term => term !== '');
                terms.forEach(term => searchTermsSet.add(term));
            }
        });

        // Convert Set to sorted array
        const vishesh_suchi = Array.from(searchTermsSet).sort();

        const contents = await KoshContent.find({ category: req.params.categoryId })
            .populate('category', 'name')
            .populate('subcategory', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await KoshContent.countDocuments({ category: req.params.categoryId });

        res.json({
            vishesh_suchi: vishesh_suchi,
            contents,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalContents: total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get contents by subcategory
router.get('/subcategory/:subcategoryId', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Get all contents for vishesh_suchi
        const allContents = await KoshContent.find({ subCategory: req.params.subcategoryId });
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
        const contents = await KoshContent.find({ subCategory: req.params.subcategoryId })
            .populate('subCategory', 'name')
            .sort({ sequenceNo: 1 })
            .skip(skip)
            .limit(limit);

        const total = await KoshContent.countDocuments({ subCategory: req.params.subcategoryId });

        // Always include vishesh_suchi in response, even if empty
        const response = {
            vishesh_suchi: vishesh_suchi,
            contents: contents,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalContents: total
        };

        console.log('3. Final response structure:', Object.keys(response));
        res.json(response);
    } catch (error) {
        console.error('Error in subcategory API:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get a single Kosh Content
router.get('/:id', async (req, res) => {
    try {
        const content = await KoshContent.findById(req.params.id)
            .populate('category', 'name')
            .populate('subcategory', 'name');
        if (!content) {
            return res.status(404).json({ message: 'Content not found' });
        }
        res.json(content);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new Kosh Content (protected route)
router.post('/', auth, async (req, res) => {
    try {
        const content = new KoshContent({
            title: req.body.title,
            content: req.body.content,
            category: req.body.category,
            subcategory: req.body.subcategory,
            keywords: req.body.keywords ? req.body.keywords.split(',').map(k => k.trim()) : [],
            image: req.body.image,
            isActive: req.body.isActive
        });
        const newContent = await content.save();
        res.status(201).json(newContent);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update a Kosh Content (protected route)
router.put('/:id', auth, async (req, res) => {
    try {
        const content = await KoshContent.findById(req.params.id);
        if (!content) {
            return res.status(404).json({ message: 'Content not found' });
        }

        content.title = req.body.title;
        content.content = req.body.content;
        content.category = req.body.category;
        content.subcategory = req.body.subcategory;
        content.keywords = req.body.keywords ? req.body.keywords.split(',').map(k => k.trim()) : [];
        content.isActive = req.body.isActive;
        if (req.body.image) {
            content.image = req.body.image;
        }

        const updatedContent = await content.save();
        res.json(updatedContent);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete a Kosh Content (protected route)
router.delete('/:id', auth, async (req, res) => {
    try {
        const content = await KoshContent.findById(req.params.id);
        if (!content) {
            return res.status(404).json({ message: 'Content not found' });
        }
        await content.remove();
        res.json({ message: 'Content deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 