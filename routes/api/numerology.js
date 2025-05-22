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

// Get all daily numerology
router.get('/daily', async (req, res) => {
    try {
        const dailyNumerology = await NumerologyDaily.find().sort({ date: -1 });
        res.json({
            success: true,
            data: dailyNumerology
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

// Get numerology data for a specific month
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
        
        res.json({
            success: true,
            month: month.name,
            data: monthlyNumerology
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error fetching monthly numerology'
        });
    }
});

// Get all yearly numerology
router.get('/yearly', async (req, res) => {
    try {
        const yearlyNumerology = await NumerologyYearly.find().sort({ date: -1 });
        res.json({
            success: true,
            data: yearlyNumerology
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error fetching yearly numerology'
        });
    }
});

module.exports = router; 