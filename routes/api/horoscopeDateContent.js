const express = require('express');

// Factory that builds a public "date -> content" CRUD router, matching the daily
// rashifal/numerology API shape. Used for the weekly variant so both rashifal and
// numerology get identical endpoints without duplicating the logic.
//
//   GET    /            list dates (sequential numeric ids)
//   POST   /            create a date
//   PUT    /:dateId     update a date
//   DELETE /:dateId     delete a date + its contents
//   DELETE /            bulk delete dates (by _id array)
//   GET    /:dateId               list contents for a date
//   POST   /:dateId               create a content under a date
//   GET    /:dateId/:contentId    get one content
//   PUT    /:dateId/:contentId    update one content
//   DELETE /:dateId/:contentId    delete one content
module.exports = function createDateContentRoutes({ DateModel, ContentModel }) {
    const router = express.Router();

    // Resolve a 1-based numeric id (list order) OR an ObjectId to a date document.
    async function resolveDateByParam(dateIdParam) {
        if (/^\d+$/.test(String(dateIdParam))) {
            const index = parseInt(dateIdParam);
            if (index < 1) return null;
            const dates = await DateModel.find().sort({ sequence: 1, createdAt: 1 });
            if (index > dates.length) return null;
            return dates[index - 1];
        }
        try {
            return await DateModel.findById(dateIdParam);
        } catch (_) {
            return null;
        }
    }

    // ---- Dates ----
    router.get('/', async (req, res) => {
        try {
            const dates = await DateModel.find().sort({ sequence: 1, createdAt: 1 });
            const datesWithIds = dates.map((d, index) => ({ id: index + 1, ...d.toObject() }));
            res.json({ success: true, data: datesWithIds });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Error fetching dates' });
        }
    });

    router.post('/', async (req, res) => {
        try {
            const { dateLabel, dateISO, notes } = req.body;
            if (!dateLabel) return res.status(400).json({ success: false, error: 'dateLabel is required' });
            const maxSequence = await DateModel.findOne().sort({ sequence: -1 }).select('sequence');
            const sequence = maxSequence && maxSequence.sequence ? maxSequence.sequence + 1 : 1;
            const created = await DateModel.create({ dateLabel, dateISO, notes, sequence });
            res.json({ success: true, data: created });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Error creating date' });
        }
    });

    router.put('/:dateId', async (req, res) => {
        try {
            const dateDoc = await resolveDateByParam(req.params.dateId);
            if (!dateDoc) return res.status(404).json({ success: false, error: 'Date not found' });
            const updated = await DateModel.findByIdAndUpdate(dateDoc._id, req.body, { new: true });
            if (!updated) return res.status(404).json({ success: false, error: 'Date not found' });
            res.json({ success: true, data: updated });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Error updating date' });
        }
    });

    router.delete('/:dateId', async (req, res) => {
        try {
            const dateDoc = await resolveDateByParam(req.params.dateId);
            if (!dateDoc) return res.status(404).json({ success: false, error: 'Date not found' });
            await DateModel.findByIdAndDelete(dateDoc._id);
            await ContentModel.deleteMany({ dateRef: dateDoc._id });
            res.json({ success: true, message: 'Date and its contents deleted' });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Error deleting date' });
        }
    });

    router.delete('/', async (req, res) => {
        try {
            const { dateIds } = req.body;
            if (!dateIds || !Array.isArray(dateIds) || dateIds.length === 0) {
                return res.status(400).json({ success: false, error: 'Date IDs array is required' });
            }
            const dates = await DateModel.find({ _id: { $in: dateIds } });
            const dateObjectIds = dates.map(d => d._id);
            if (dateObjectIds.length === 0) {
                return res.status(404).json({ success: false, error: 'No valid dates found' });
            }
            await ContentModel.deleteMany({ dateRef: { $in: dateObjectIds } });
            const result = await DateModel.deleteMany({ _id: { $in: dateObjectIds } });
            res.json({
                success: true,
                message: `${result.deletedCount} date(s) and their contents deleted successfully`,
                deletedCount: result.deletedCount
            });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Error deleting dates: ' + error.message });
        }
    });

    // ---- Contents ----
    router.get('/:dateId', async (req, res) => {
        try {
            const date = await resolveDateByParam(req.params.dateId);
            if (!date) return res.status(404).json({ success: false, error: 'Date not found' });
            const contents = await ContentModel.find({ dateRef: date._id }).sort({ sequence: 1, createdAt: 1 });
            const contentsWithIds = contents.map((c, idx) => ({ id: idx + 1, ...c.toObject() }));
            res.json({ success: true, data: contentsWithIds });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Error fetching contents for date' });
        }
    });

    router.post('/:dateId', async (req, res) => {
        try {
            const date = await resolveDateByParam(req.params.dateId);
            if (!date) return res.status(404).json({ success: false, error: 'Date not found' });
            const { sequence, title_hn, title_en, details_hn, details_en, images } = req.body;
            const created = await ContentModel.create({
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

    router.get('/:dateId/:contentId', async (req, res) => {
        try {
            const { contentId } = req.params;
            const date = await resolveDateByParam(req.params.dateId);
            if (!date) return res.status(404).json({ success: false, error: 'Date not found' });
            if (/^\d+$/.test(String(contentId))) {
                const idx = parseInt(contentId);
                if (idx < 1) return res.status(404).json({ success: false, error: 'Content not found' });
                const contents = await ContentModel.find({ dateRef: date._id }).sort({ sequence: 1, createdAt: 1 });
                if (idx > contents.length) return res.status(404).json({ success: false, error: 'Content not found' });
                return res.json({ success: true, data: { id: idx, ...contents[idx - 1].toObject() } });
            }
            const contentDoc = await ContentModel.findOne({ _id: contentId, dateRef: date._id });
            if (!contentDoc) return res.status(404).json({ success: false, error: 'Content not found' });
            const contents = await ContentModel.find({ dateRef: date._id }).sort({ sequence: 1, createdAt: 1 });
            const idx = contents.findIndex(c => String(c._id) === String(contentDoc._id)) + 1;
            res.json({ success: true, data: { id: idx, ...contentDoc.toObject() } });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Error fetching content' });
        }
    });

    router.put('/:dateId/:contentId', async (req, res) => {
        try {
            const { contentId } = req.params;
            const date = await resolveDateByParam(req.params.dateId);
            if (!date) return res.status(404).json({ success: false, error: 'Date not found' });
            const updatePayload = { ...req.body };
            if (updatePayload.images && !Array.isArray(updatePayload.images)) {
                updatePayload.images = String(updatePayload.images).split(',').map(s => s.trim());
            }
            let updated = null;
            if (/^\d+$/.test(String(contentId))) {
                const idx = parseInt(contentId);
                if (idx < 1) return res.status(404).json({ success: false, error: 'Content not found' });
                const contents = await ContentModel.find({ dateRef: date._id }).sort({ sequence: 1, createdAt: 1 });
                if (idx > contents.length) return res.status(404).json({ success: false, error: 'Content not found' });
                const targetId = contents[idx - 1]._id;
                updated = await ContentModel.findOneAndUpdate({ _id: targetId, dateRef: date._id }, updatePayload, { new: true });
            } else {
                updated = await ContentModel.findOneAndUpdate({ _id: contentId, dateRef: date._id }, updatePayload, { new: true });
            }
            if (!updated) return res.status(404).json({ success: false, error: 'Content not found' });
            const contents = await ContentModel.find({ dateRef: date._id }).sort({ sequence: 1, createdAt: 1 });
            const idx = contents.findIndex(c => String(c._id) === String(updated._id)) + 1;
            res.json({ success: true, data: { id: idx, ...updated.toObject() } });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Error updating content' });
        }
    });

    router.delete('/:dateId/:contentId', async (req, res) => {
        try {
            const { contentId } = req.params;
            const date = await resolveDateByParam(req.params.dateId);
            if (!date) return res.status(404).json({ success: false, error: 'Date not found' });
            let deleted = null;
            if (/^\d+$/.test(String(contentId))) {
                const idx = parseInt(contentId);
                if (idx < 1) return res.status(404).json({ success: false, error: 'Content not found' });
                const contents = await ContentModel.find({ dateRef: date._id }).sort({ sequence: 1, createdAt: 1 });
                if (idx > contents.length) return res.status(404).json({ success: false, error: 'Content not found' });
                const targetId = contents[idx - 1]._id;
                deleted = await ContentModel.findOneAndDelete({ _id: targetId, dateRef: date._id });
            } else {
                deleted = await ContentModel.findOneAndDelete({ _id: contentId, dateRef: date._id });
            }
            if (!deleted) return res.status(404).json({ success: false, error: 'Content not found' });
            res.json({ success: true, message: 'Content deleted' });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Error deleting content' });
        }
    });

    return router;
};
