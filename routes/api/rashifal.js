const express = require('express');
const router = express.Router();
// Legacy model will be removed from API-level usage for daily
const RashifalDaily = require('../../models/RashifalDaily');
const RashifalMonthly = require('../../models/RashifalMonthly');
const RashifalYearly = require('../../models/RashifalYearly');
const RashifalDailyDate = require('../../models/RashifalDailyDate');
const RashifalDailyContent = require('../../models/RashifalDailyContent');

// Helper: resolve numeric dateId (1-based) to actual date document (_id)
async function resolveDateByParam(dateIdParam) {
    if (/^\d+$/.test(String(dateIdParam))) {
        const index = parseInt(dateIdParam);
        if (index < 1) return null;
        const dates = await RashifalDailyDate.find().sort({ createdAt: -1 });
        if (index > dates.length) return null;
        return dates[index - 1];
    }
    try {
        const date = await RashifalDailyDate.findById(dateIdParam);
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

// Get all daily rashifal dates with sequential IDs
router.get('/daily', async (req, res) => {
    try {
        const dates = await RashifalDailyDate.find().sort({ createdAt: -1 });
        const datesWithIds = dates.map((d, index) => ({ id: index + 1, ...d.toObject() }));
        res.json({ success: true, data: datesWithIds });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error fetching daily rashifal dates'
        });
    }
});

// Create a new date
router.post('/daily', async (req, res) => {
    try {
        const { dateLabel, dateISO, notes } = req.body;
        if (!dateLabel) return res.status(400).json({ success: false, error: 'dateLabel is required' });
        const created = await RashifalDailyDate.create({ dateLabel, dateISO, notes });
        res.json({ success: true, data: created });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error creating date'
        });
    }
});

// Update a date
router.put('/daily/:dateId', async (req, res) => {
    try {
        const { dateId } = req.params;
        const dateDoc = await resolveDateByParam(dateId);
        if (!dateDoc) return res.status(404).json({ success: false, error: 'Date not found' });
        const updated = await RashifalDailyDate.findByIdAndUpdate(dateDoc._id, req.body, { new: true });
        if (!updated) return res.status(404).json({ success: false, error: 'Date not found' });
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error updating date' });
    }
});

// Delete a date and its contents
router.delete('/daily/:dateId', async (req, res) => {
    try {
        const { dateId } = req.params;
        const dateDoc = await resolveDateByParam(dateId);
        if (!dateDoc) return res.status(404).json({ success: false, error: 'Date not found' });
        await RashifalDailyDate.findByIdAndDelete(dateDoc._id);
        await RashifalDailyContent.deleteMany({ dateRef: dateDoc._id });
        res.json({ success: true, message: 'Date and its contents deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error deleting date' });
    }
});

// Get all contents for a date (contents only, with numeric IDs)
router.get('/daily/:dateId', async (req, res) => {
    try {
        const { dateId } = req.params;
        const date = await resolveDateByParam(dateId);
        if (!date) return res.status(404).json({ success: false, error: 'Date not found' });
        const contents = await RashifalDailyContent.find({ dateRef: date._id }).sort({ sequence: 1, createdAt: 1 });
        const contentsWithIds = contents.map((c, idx) => ({ id: idx + 1, ...c.toObject() }));
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
        const created = await RashifalDailyContent.create({
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

// Get a specific content (numeric contentId supported)
router.get('/daily/:dateId/:contentId', async (req, res) => {
    try {
        const { dateId, contentId } = req.params;
        const date = await resolveDateByParam(dateId);
        if (!date) return res.status(404).json({ success: false, error: 'Date not found' });
        let contentDoc = null;
        if (/^\d+$/.test(String(contentId))) {
            const idx = parseInt(contentId);
            if (idx < 1) return res.status(404).json({ success: false, error: 'Content not found' });
            const contents = await RashifalDailyContent.find({ dateRef: date._id }).sort({ sequence: 1, createdAt: 1 });
            if (idx > contents.length) return res.status(404).json({ success: false, error: 'Content not found' });
            contentDoc = contents[idx - 1];
            return res.json({ success: true, data: { id: idx, ...contentDoc.toObject() } });
        } else {
            contentDoc = await RashifalDailyContent.findOne({ _id: contentId, dateRef: date._id });
            if (!contentDoc) return res.status(404).json({ success: false, error: 'Content not found' });
            const contents = await RashifalDailyContent.find({ dateRef: date._id }).sort({ sequence: 1, createdAt: 1 });
            const idx = contents.findIndex(c => String(c._id) === String(contentDoc._id)) + 1;
            return res.json({ success: true, data: { id: idx, ...contentDoc.toObject() } });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error fetching content' });
    }
});

// Update a specific content
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
            const contents = await RashifalDailyContent.find({ dateRef: date._id }).sort({ sequence: 1, createdAt: 1 });
            if (idx > contents.length) return res.status(404).json({ success: false, error: 'Content not found' });
            const targetId = contents[idx - 1]._id;
            updated = await RashifalDailyContent.findOneAndUpdate({ _id: targetId, dateRef: date._id }, updatePayload, { new: true });
        } else {
            updated = await RashifalDailyContent.findOneAndUpdate({ _id: contentId, dateRef: date._id }, updatePayload, { new: true });
        }
        if (!updated) return res.status(404).json({ success: false, error: 'Content not found' });
        const contents = await RashifalDailyContent.find({ dateRef: date._id }).sort({ sequence: 1, createdAt: 1 });
        const idx = contents.findIndex(c => String(c._id) === String(updated._id)) + 1;
        res.json({ success: true, data: { id: idx, ...updated.toObject() } });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error updating content' });
    }
});

// Delete a specific content
router.delete('/daily/:dateId/:contentId', async (req, res) => {
    try {
        const { dateId, contentId } = req.params;
        const date = await resolveDateByParam(dateId);
        if (!date) return res.status(404).json({ success: false, error: 'Date not found' });
        let deleted = null;
        if (/^\d+$/.test(String(contentId))) {
            const idx = parseInt(contentId);
            if (idx < 1) return res.status(404).json({ success: false, error: 'Content not found' });
            const contents = await RashifalDailyContent.find({ dateRef: date._id }).sort({ sequence: 1, createdAt: 1 });
            if (idx > contents.length) return res.status(404).json({ success: false, error: 'Content not found' });
            const targetId = contents[idx - 1]._id;
            deleted = await RashifalDailyContent.findOneAndDelete({ _id: targetId, dateRef: date._id });
        } else {
            deleted = await RashifalDailyContent.findOneAndDelete({ _id: contentId, dateRef: date._id });
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