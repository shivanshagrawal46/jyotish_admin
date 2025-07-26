const express = require('express');
const router = express.Router();
const RashifalDaily = require('../../models/RashifalDaily');
const RashifalMonthly = require('../../models/RashifalMonthly');
const RashifalYearly = require('../../models/RashifalYearly');

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

// Get all daily rashifals with sequential IDs
router.get('/daily', async (req, res) => {
    try {
        const dailyRashifals = await RashifalDaily.find().sort({ sequence: 1 });
        
        // Add sequential IDs to the data
        const rashifalsWithIds = dailyRashifals.map((rashifal, index) => ({
            id: index + 1,
            ...rashifal.toObject()
        }));
        
        res.json({
            success: true,
            data: rashifalsWithIds
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error fetching daily rashifals'
        });
    }
});

// Get specific daily rashifal by ID
router.get('/daily/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const dailyRashifals = await RashifalDaily.find().sort({ date: -1 });
        
        if (id < 1 || id > dailyRashifals.length) {
            return res.status(404).json({
                success: false,
                error: 'Rashifal not found'
            });
        }
        
        const rashifal = dailyRashifals[id - 1];
        res.json({
            success: true,
            data: {
                id: id,
                ...rashifal.toObject()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error fetching daily rashifal'
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

// Get rashifal data for a specific month with sequential IDs
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

        const monthlyRashifals = await RashifalMonthly.find({ month: month.name }).sort({ sequence: 1 });
        
        // Add sequential IDs to the data
        const rashifalsWithIds = monthlyRashifals.map((rashifal, index) => ({
            id: index + 1,
            ...rashifal.toObject()
        }));
        
        res.json({
            success: true,
            month: month.name,
            data: rashifalsWithIds
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error fetching monthly rashifals'
        });
    }
});

// Get specific monthly rashifal by month ID and rashifal ID
router.get('/months/:monthId/:id', async (req, res) => {
    try {
        const monthId = parseInt(req.params.monthId);
        const rashifalId = parseInt(req.params.id);
        const month = MONTHS.find(m => m.id === monthId);
        
        if (!month) {
            return res.status(404).json({
                success: false,
                error: 'Invalid month ID'
            });
        }

        const monthlyRashifals = await RashifalMonthly.find({ month: month.name }).sort({ createdAt: -1 });
        
        if (rashifalId < 1 || rashifalId > monthlyRashifals.length) {
            return res.status(404).json({
                success: false,
                error: 'Rashifal not found'
            });
        }
        
        const rashifal = monthlyRashifals[rashifalId - 1];
        res.json({
            success: true,
            month: month.name,
            data: {
                id: rashifalId,
                ...rashifal.toObject()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error fetching monthly rashifal'
        });
    }
});

// Get all yearly rashifals with sequential IDs
router.get('/yearly', async (req, res) => {
    try {
        const yearlyRashifals = await RashifalYearly.find().sort({ sequence: 1 });
        
        // Add sequential IDs to the data
        const rashifalsWithIds = yearlyRashifals.map((rashifal, index) => ({
            id: index + 1,
            ...rashifal.toObject()
        }));
        
        res.json({
            success: true,
            data: rashifalsWithIds
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error fetching yearly rashifals'
        });
    }
});

// Get specific yearly rashifal by ID
router.get('/yearly/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const yearlyRashifals = await RashifalYearly.find().sort({ date: -1 });
        
        if (id < 1 || id > yearlyRashifals.length) {
            return res.status(404).json({
                success: false,
                error: 'Rashifal not found'
            });
        }
        
        const rashifal = yearlyRashifals[id - 1];
        res.json({
            success: true,
            data: {
                id: id,
                ...rashifal.toObject()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error fetching yearly rashifal'
        });
    }
});

module.exports = router; 