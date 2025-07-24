const express = require('express');
const router = express.Router();
const NumerologyDaily = require('../../models/NumerologyDaily');
const NumerologyMonthly = require('../../models/NumerologyMonthly');
const NumerologyYearly = require('../../models/NumerologyYearly');

// Helper: get all months with IDs
const MONTHS = [
    { id: 1, name: 'January' },
    { id: 2, name: 'February' },
    { id: 3, name: 'March' },
    { id: 4, name: 'April' },
    { id: 5, name: 'May' },
    { id: 6, name: 'June' },
    { id: 7, name: 'July' },
    { id: 8, name: 'August' },
    { id: 9, name: 'September' },
    { id: 10, name: 'October' },
    { id: 11, name: 'November' },
    { id: 12, name: 'December' }
];

// Get all daily numerology with sequential IDs
router.get('/daily', async (req, res) => {
    try {
        const dailyNumerology = await NumerologyDaily.find().sort({ date: -1 });
        
        // Add sequential IDs to the data
        const numerologyWithIds = dailyNumerology.map((numerology, index) => ({
            id: index + 1,
            ...numerology.toObject()
        }));
        
        res.json({
            success: true,
            data: numerologyWithIds
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error fetching daily numerology'
        });
    }
});

// Get specific daily numerology by ID
router.get('/daily/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const dailyNumerology = await NumerologyDaily.find().sort({ date: -1 });
        
        if (id < 1 || id > dailyNumerology.length) {
            return res.status(404).json({
                success: false,
                error: 'Numerology not found'
            });
        }
        
        const numerology = dailyNumerology[id - 1];
        res.json({
            success: true,
            data: {
                id: id,
                ...numerology.toObject()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error fetching daily numerology'
        });
    }
});

// Get all months
router.get('/months', async (req, res) => {
    try {
        res.json({
            success: true,
            data: MONTHS
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error fetching months'
        });
    }
});

// Get numerology data for a specific month with sequential IDs
router.get('/months/:monthId', async (req, res) => {
    try {
        const monthId = parseInt(req.params.monthId);
        const month = MONTHS.find(m => m.id === monthId);
        
        if (!month) {
            return res.status(404).json({
                success: false,
                error: 'Invalid month ID'
            });
        }

        const monthlyNumerology = await NumerologyMonthly.find({ month: month.name }).sort({ createdAt: -1 });
        
        // Add sequential IDs to the data
        const numerologyWithIds = monthlyNumerology.map((numerology, index) => ({
            id: index + 1,
            ...numerology.toObject()
        }));
        
        res.json({
            success: true,
            month: month.name,
            data: numerologyWithIds
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error fetching monthly numerology'
        });
    }
});

// Get specific monthly numerology by month ID and numerology ID
router.get('/months/:monthId/:id', async (req, res) => {
    try {
        const monthId = parseInt(req.params.monthId);
        const numerologyId = parseInt(req.params.id);
        const month = MONTHS.find(m => m.id === monthId);
        
        if (!month) {
            return res.status(404).json({
                success: false,
                error: 'Invalid month ID'
            });
        }

        const monthlyNumerology = await NumerologyMonthly.find({ month: month.name }).sort({ createdAt: -1 });
        
        if (numerologyId < 1 || numerologyId > monthlyNumerology.length) {
            return res.status(404).json({
                success: false,
                error: 'Numerology not found'
            });
        }
        
        const numerology = monthlyNumerology[numerologyId - 1];
        res.json({
            success: true,
            month: month.name,
            data: {
                id: numerologyId,
                ...numerology.toObject()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error fetching monthly numerology'
        });
    }
});

// Get all yearly numerology with sequential IDs
router.get('/yearly', async (req, res) => {
    try {
        const yearlyNumerology = await NumerologyYearly.find().sort({ date: -1 });
        
        // Add sequential IDs to the data
        const numerologyWithIds = yearlyNumerology.map((numerology, index) => ({
            id: index + 1,
            ...numerology.toObject()
        }));
        
        res.json({
            success: true,
            data: numerologyWithIds
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error fetching yearly numerology'
        });
    }
});

// Get specific yearly numerology by ID
router.get('/yearly/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const yearlyNumerology = await NumerologyYearly.find().sort({ date: -1 });
        
        if (id < 1 || id > yearlyNumerology.length) {
            return res.status(404).json({
                success: false,
                error: 'Numerology not found'
            });
        }
        
        const numerology = yearlyNumerology[id - 1];
        res.json({
            success: true,
            data: {
                id: id,
                ...numerology.toObject()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error fetching yearly numerology'
        });
    }
});

module.exports = router; 