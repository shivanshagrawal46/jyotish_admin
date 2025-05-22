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

// Get all daily rashifals
router.get('/daily', async (req, res) => {
    try {
        const dailyRashifals = await RashifalDaily.find().sort({ date: -1 });
        res.json({
            success: true,
            data: dailyRashifals
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error fetching daily rashifals'
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

// Get rashifal data for a specific month
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

        const monthlyRashifals = await RashifalMonthly.find({ month: month.name }).sort({ createdAt: -1 });
        
        res.json({
            success: true,
            month: month.name,
            data: monthlyRashifals
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error fetching monthly rashifals'
        });
    }
});

// Get all yearly rashifals
router.get('/yearly', async (req, res) => {
    try {
        const yearlyRashifals = await RashifalYearly.find().sort({ date: -1 });
        res.json({
            success: true,
            data: yearlyRashifals
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error fetching yearly rashifals'
        });
    }
});

module.exports = router; 