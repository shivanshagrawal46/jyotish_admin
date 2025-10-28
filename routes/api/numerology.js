const express = require('express');
const router = express.Router();
const NumerologyMonthly = require('../../models/NumerologyMonthly');
const NumerologyYearly = require('../../models/NumerologyYearly');
const NumerologyDailyDate = require('../../models/NumerologyDailyDate');
const NumerologyDailyContent = require('../../models/NumerologyDailyContent');

// Helper: resolve numeric dateId (1-based) to actual date document (_id)
async function resolveDateByParam(dateIdParam) {
    // If numeric like '1', map based on the same ordering used in list (createdAt desc)
    if (/^\d+$/.test(String(dateIdParam))) {
        const index = parseInt(dateIdParam);
        if (index < 1) return null;
        const dates = await NumerologyDailyDate.find().sort({ createdAt: -1 });
        if (index > dates.length) return null;
        return dates[index - 1];
    }
    // Otherwise try to fetch by ObjectId directly
    try {
        const date = await NumerologyDailyDate.findById(dateIdParam);
        return date;
    } catch (_) {
        return null;
    }
}

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
        // Return all admin-created dates with sequential numeric IDs (1, 2, 3...)
        const dates = await NumerologyDailyDate.find().sort({ createdAt: -1 });
        const datesWithIds = dates.map((date, index) => ({
            id: index + 1,
            ...date.toObject()
        }));
        res.json({ success: true, data: datesWithIds });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error fetching daily dates' });
    }
});

// Get specific daily numerology by ID
// Create a new date
router.post('/daily', async (req, res) => {
    try {
        const { dateLabel, dateISO, notes } = req.body;
        if (!dateLabel) return res.status(400).json({ success: false, error: 'dateLabel is required' });
        const created = await NumerologyDailyDate.create({ dateLabel, dateISO, notes });
        res.json({ success: true, data: created });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error creating date' });
    }
});

// Update a date
router.put('/daily/:dateId', async (req, res) => {
    try {
        const { dateId } = req.params;
        const dateDoc = await resolveDateByParam(dateId);
        if (!dateDoc) return res.status(404).json({ success: false, error: 'Date not found' });
        const updated = await NumerologyDailyDate.findByIdAndUpdate(dateDoc._id, req.body, { new: true });
        if (!updated) return res.status(404).json({ success: false, error: 'Date not found' });
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error updating date' });
    }
});

// Delete a date (and cascade delete its contents)
router.delete('/daily/:dateId', async (req, res) => {
    try {
        const { dateId } = req.params;
        const dateDoc = await resolveDateByParam(dateId);
        if (!dateDoc) return res.status(404).json({ success: false, error: 'Date not found' });
        const date = await NumerologyDailyDate.findByIdAndDelete(dateDoc._id);
        if (!date) return res.status(404).json({ success: false, error: 'Date not found' });
        await NumerologyDailyContent.deleteMany({ dateRef: dateDoc._id });
        res.json({ success: true, message: 'Date and its contents deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error deleting date' });
    }
});

// Get all contents for a date
router.get('/daily/:dateId', async (req, res) => {
    try {
        const { dateId } = req.params;
        const date = await resolveDateByParam(dateId);
        if (!date) return res.status(404).json({ success: false, error: 'Date not found' });
        const contents = await NumerologyDailyContent.find({ dateRef: date._id }).sort({ sequence: 1, createdAt: 1 });
        const contentsWithIds = contents.map((c, idx) => ({ id: idx + 1, ...c.toObject() }));
        // Return only content list, no date object per requirement
        res.json({ success: true, data: contentsWithIds });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error fetching contents for date' });
    }
});

// Create a single content under a date
router.post('/daily/:dateId', async (req, res) => {
    try {
        const { dateId } = req.params;
        const date = await resolveDateByParam(dateId);
        if (!date) return res.status(404).json({ success: false, error: 'Date not found' });
        const { sequence, title_hn, title_en, details_hn, details_en, images } = req.body;
        const created = await NumerologyDailyContent.create({
            dateRef: date._id,
            sequence: sequence || 0,
            title_hn,
            title_en,
            details_hn,
            details_en,
            images: Array.isArray(images) ? images : (images ? String(images).split(',').map(s => s.trim()) : [])
        });
        res.json({ success: true, data: created });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error creating content' });
    }
});

// Get a specific content under a date
router.get('/daily/:dateId/:contentId', async (req, res) => {
    try {
        const { dateId, contentId } = req.params;
        const date = await resolveDateByParam(dateId);
        if (!date) return res.status(404).json({ success: false, error: 'Date not found' });
        let contentDoc = null;
        if (/^\d+$/.test(String(contentId))) {
            const idx = parseInt(contentId);
            if (idx < 1) return res.status(404).json({ success: false, error: 'Content not found' });
            const contents = await NumerologyDailyContent.find({ dateRef: date._id }).sort({ sequence: 1, createdAt: 1 });
            if (idx > contents.length) return res.status(404).json({ success: false, error: 'Content not found' });
            contentDoc = contents[idx - 1];
            return res.json({ success: true, data: { id: idx, ...contentDoc.toObject() } });
        } else {
            contentDoc = await NumerologyDailyContent.findOne({ _id: contentId, dateRef: date._id });
            if (!contentDoc) return res.status(404).json({ success: false, error: 'Content not found' });
            // compute its numeric position
            const contents = await NumerologyDailyContent.find({ dateRef: date._id }).sort({ sequence: 1, createdAt: 1 });
            const idx = contents.findIndex(c => String(c._id) === String(contentDoc._id)) + 1;
            return res.json({ success: true, data: { id: idx, ...contentDoc.toObject() } });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error fetching content' });
    }
});

// Update a specific content under a date
router.put('/daily/:dateId/:contentId', async (req, res) => {
    try {
        const { dateId, contentId } = req.params;
        const date = await resolveDateByParam(dateId);
        if (!date) return res.status(404).json({ success: false, error: 'Date not found' });
        const updatePayload = { ...req.body };
        if (updatePayload.images && !Array.isArray(updatePayload.images)) {
            updatePayload.images = String(updatePayload.images).split(',').map(s => s.trim());
        }
        let updated = null;
        if (/^\d+$/.test(String(contentId))) {
            const idx = parseInt(contentId);
            if (idx < 1) return res.status(404).json({ success: false, error: 'Content not found' });
            const contents = await NumerologyDailyContent.find({ dateRef: date._id }).sort({ sequence: 1, createdAt: 1 });
            if (idx > contents.length) return res.status(404).json({ success: false, error: 'Content not found' });
            const targetId = contents[idx - 1]._id;
            updated = await NumerologyDailyContent.findOneAndUpdate({ _id: targetId, dateRef: date._id }, updatePayload, { new: true });
        } else {
            updated = await NumerologyDailyContent.findOneAndUpdate({ _id: contentId, dateRef: date._id }, updatePayload, { new: true });
        }
        if (!updated) return res.status(404).json({ success: false, error: 'Content not found' });
        // include numeric id in response
        const contents = await NumerologyDailyContent.find({ dateRef: date._id }).sort({ sequence: 1, createdAt: 1 });
        const idx = contents.findIndex(c => String(c._id) === String(updated._id)) + 1;
        res.json({ success: true, data: { id: idx, ...updated.toObject() } });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error updating content' });
    }
});

// Delete a specific content under a date
router.delete('/daily/:dateId/:contentId', async (req, res) => {
    try {
        const { dateId, contentId } = req.params;
        const date = await resolveDateByParam(dateId);
        if (!date) return res.status(404).json({ success: false, error: 'Date not found' });
        let deleted = null;
        if (/^\d+$/.test(String(contentId))) {
            const idx = parseInt(contentId);
            if (idx < 1) return res.status(404).json({ success: false, error: 'Content not found' });
            const contents = await NumerologyDailyContent.find({ dateRef: date._id }).sort({ sequence: 1, createdAt: 1 });
            if (idx > contents.length) return res.status(404).json({ success: false, error: 'Content not found' });
            const targetId = contents[idx - 1]._id;
            deleted = await NumerologyDailyContent.findOneAndDelete({ _id: targetId, dateRef: date._id });
        } else {
            deleted = await NumerologyDailyContent.findOneAndDelete({ _id: contentId, dateRef: date._id });
        }
        if (!deleted) return res.status(404).json({ success: false, error: 'Content not found' });
        res.json({ success: true, message: 'Content deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error deleting content' });
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