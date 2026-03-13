/**
 * Notification Content API
 * 
 * Provides cascading dropdown data for the admin notification form.
 * Supports 7 content sections, each with their own hierarchy:
 *   kosh            → Category → SubCategory → Content
 *   karmkand        → Category → SubCategory → Content
 *   book            → Category → Book → Chapter → Content
 *   muhurat         → Category → Content
 *   rashifal_daily  → Date → Content
 *   numerology_daily→ Date → Content
 *   festival        → Content (flat)
 * 
 * Deep link URL scheme:  jyotishapp://<section>/...ids
 * Flutter screen map is returned per-section in /sections response.
 */

const express = require('express');
const router = express.Router();

const KoshCategory       = require('../../models/KoshCategory');
const KoshSubCategory    = require('../../models/KoshSubCategory');
const KoshContent        = require('../../models/KoshContent');
const KarmkandCategory   = require('../../models/KarmkandCategory');
const KarmkandSubCategory= require('../../models/KarmkandSubCategory');
const KarmkandContent    = require('../../models/KarmkandContent');
const BookCategory       = require('../../models/BookCategory');
const BookName           = require('../../models/BookName');
const BookChapter        = require('../../models/BookChapter');
const BookContent        = require('../../models/BookContent');
const MuhuratCategory    = require('../../models/MuhuratCategory');
const MuhuratContent     = require('../../models/MuhuratContent');
const RashifalDailyDate    = require('../../models/RashifalDailyDate');
const RashifalDailyContent = require('../../models/RashifalDailyContent');
const NumerologyDailyDate    = require('../../models/NumerologyDailyDate');
const NumerologyDailyContent = require('../../models/NumerologyDailyContent');
const Festival = require('../../models/Festival');
const EMagazine = require('../../models/EMagazine');
const YouTube = require('../../models/YouTube');

// ─── Section registry ────────────────────────────────────────────────────────
const SECTIONS = [
    {
        key: 'kosh',
        label: 'Kosh (Sanskrit Dictionary)',
        icon: '📚',
        screen: 'KoshContentDetail',
        levels: ['Category', 'Sub Category', 'Content Title'],
        deepLinkBase: 'jyotishapp://kosh'
    },
    {
        key: 'karmkand',
        label: 'Karmkand',
        icon: '🪔',
        screen: 'KarmkandContentDetail',
        levels: ['Category', 'Sub Category', 'Content Title'],
        deepLinkBase: 'jyotishapp://karmkand'
    },
    {
        key: 'book',
        label: 'Book Content',
        icon: '📖',
        screen: 'BookContentDetail',
        levels: ['Category', 'Book Name', 'Chapter', 'Content Title'],
        deepLinkBase: 'jyotishapp://book'
    },
    {
        key: 'muhurat',
        label: 'Muhurat',
        icon: '🌟',
        screen: 'MuhuratDetail',
        levels: ['Category', 'Content Entry'],
        deepLinkBase: 'jyotishapp://muhurat'
    },
    {
        key: 'rashifal_daily',
        label: 'Rashifal Daily Content',
        icon: '♈',
        screen: 'RashifalDailyDetail',
        levels: ['Date', 'Content Title'],
        deepLinkBase: 'jyotishapp://rashifal/daily'
    },
    {
        key: 'numerology_daily',
        label: 'Numerology Daily Content',
        icon: '🔢',
        screen: 'NumerologyDailyDetail',
        levels: ['Date', 'Content Title'],
        deepLinkBase: 'jyotishapp://numerology/daily'
    },
    {
        key: 'festival',
        label: 'Festival',
        icon: '🎉',
        screen: 'FestivalDetail',
        levels: ['Festival Entry'],
        deepLinkBase: 'jyotishapp://festival'
    },
    {
        key: 'emagazine',
        label: 'E-Magazine',
        icon: '📰',
        screen: 'EMagazineDetail',
        levels: ['Magazine Article'],
        deepLinkBase: 'jyotishapp://emagazine'
    },
    {
        key: 'youtube',
        label: 'YouTube',
        icon: '▶️',
        screen: 'YouTubeDetail',
        levels: ['Video'],
        deepLinkBase: 'jyotishapp://youtube'
    }
];

// GET /api/notification-content/sections
router.get('/sections', (req, res) => {
    res.json({ success: true, sections: SECTIONS });
});

// ─── Level 1: Categories / Dates / Festival list ─────────────────────────────
// GET /api/notification-content/:section/level1
router.get('/:section/level1', async (req, res) => {
    const { section } = req.params;
    try {
        let data = [];
        switch (section) {
            case 'kosh':
                data = (await KoshCategory.find().sort({ position: 1 }).lean())
                    .map(d => ({ _id: d._id, name: d.name }));
                break;
            case 'karmkand':
                data = (await KarmkandCategory.find().sort({ position: 1 }).lean())
                    .map(d => ({ _id: d._id, name: d.name }));
                break;
            case 'book':
                data = (await BookCategory.find().sort({ name: 1 }).lean())
                    .map(d => ({ _id: d._id, name: d.name }));
                break;
            case 'muhurat':
                data = (await MuhuratCategory.find().sort({ categoryName: 1 }).lean())
                    .map(d => ({ _id: d._id, name: d.categoryName }));
                break;
            case 'rashifal_daily':
                data = (await RashifalDailyDate.find().sort({ sequence: 1, createdAt: -1 }).limit(200).lean())
                    .map(d => ({ _id: d._id, name: d.dateLabel }));
                break;
            case 'numerology_daily':
                data = (await NumerologyDailyDate.find().sort({ sequence: 1, createdAt: -1 }).limit(200).lean())
                    .map(d => ({ _id: d._id, name: d.dateLabel }));
                break;
            case 'festival':
                // Festival is flat — level1 IS the content
                data = (await Festival.find().sort({ sequence: 1 }).limit(500).lean())
                    .map(d => ({
                        _id: d._id,
                        name: [d.festival_name, d.vrat, d.jyanti].filter(Boolean).join(' / ') || 'Festival Entry',
                        date: d.date ? new Date(d.date).toLocaleDateString('en-IN') : null
                    }));
                break;
            case 'emagazine':
                // E-Magazine is flat — level1 IS the content
                data = (await EMagazine.find().sort({ createdAt: -1 }).limit(500).lean())
                    .map(d => ({
                        _id: d._id,
                        name: (d.title || 'Magazine') + (d.month && d.year ? ` (${d.month} ${d.year})` : '')
                    }));
                break;
            case 'youtube':
                // YouTube is flat — level1 IS the content
                data = (await YouTube.find().sort({ createdAt: -1 }).limit(500).lean())
                    .map(d => ({ _id: d._id, name: d.title || 'Video' }));
                break;
            default:
                return res.status(400).json({ success: false, error: 'Invalid section' });
        }
        res.json({ success: true, data });
    } catch (err) {
        console.error(`[notifContent level1 ${section}]`, err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─── Level 2: SubCategories / Books / Content (flat sections) ────────────────
// GET /api/notification-content/:section/level2/:id
router.get('/:section/level2/:id', async (req, res) => {
    const { section, id } = req.params;
    try {
        let data = [];
        switch (section) {
            case 'kosh':
                data = (await KoshSubCategory.find({ parentCategory: id }).sort({ position: 1 }).lean())
                    .map(d => ({ _id: d._id, name: d.name }));
                break;
            case 'karmkand':
                data = (await KarmkandSubCategory.find({ parentCategory: id }).sort({ position: 1 }).lean())
                    .map(d => ({ _id: d._id, name: d.name }));
                break;
            case 'book':
                data = (await BookName.find({ category: id }).sort({ name: 1 }).lean())
                    .map(d => ({ _id: d._id, name: d.name }));
                break;
            case 'muhurat':
                // Level 2 = final content for muhurat
                data = (await MuhuratContent.find({ categoryId: id }).sort({ year: -1, date: 1 }).lean())
                    .map(d => ({
                        _id: d._id,
                        name: `${d.date || ''}${d.year ? ' ('+d.year+')' : ''}${d.detail ? ' — ' + d.detail.slice(0, 60) : ''}`.trim()
                    }));
                break;
            case 'rashifal_daily':
                // Level 2 = final content for rashifal
                data = (await RashifalDailyContent.find({ dateRef: id }).sort({ sequence: 1 }).lean())
                    .map(d => ({ _id: d._id, name: d.title_hn || d.title_en }));
                break;
            case 'numerology_daily':
                data = (await NumerologyDailyContent.find({ dateRef: id }).sort({ sequence: 1 }).lean())
                    .map(d => ({ _id: d._id, name: d.title_hn || d.title_en }));
                break;
            case 'festival':
            case 'emagazine':
            case 'youtube':
                // Flat sections — level1 selection IS the content, no level2
                return res.status(400).json({ success: false, error: `Section "${section}" has no level2` });
            default:
                return res.status(400).json({ success: false, error: `Section "${section}" has no level2` });
        }
        res.json({ success: true, data });
    } catch (err) {
        console.error(`[notifContent level2 ${section}]`, err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─── Level 3: Chapters (book) / Content (kosh, karmkand) ─────────────────────
// GET /api/notification-content/:section/level3/:id
router.get('/:section/level3/:id', async (req, res) => {
    const { section, id } = req.params;
    try {
        let data = [];
        switch (section) {
            case 'kosh':
                data = (await KoshContent.find({ subCategory: id }).sort({ sequenceNo: 1, hindiWord: 1 }).lean())
                    .map(d => ({ _id: d._id, name: d.hindiWord || d.englishWord || d.hinglishWord || `Entry #${d.id}` }));
                break;
            case 'karmkand':
                data = (await KarmkandContent.find({ subCategory: id }).sort({ sequenceNo: 1, hindiWord: 1 }).lean())
                    .map(d => ({ _id: d._id, name: d.hindiWord || d.englishWord || d.hinglishWord || `Entry #${d.id}` }));
                break;
            case 'book':
                data = (await BookChapter.find({ book: id }).sort({ name: 1 }).lean())
                    .map(d => ({ _id: d._id, name: d.name }));
                break;
            default:
                return res.status(400).json({ success: false, error: `Section "${section}" has no level3` });
        }
        res.json({ success: true, data });
    } catch (err) {
        console.error(`[notifContent level3 ${section}]`, err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─── Level 4: Content (book only) ────────────────────────────────────────────
// GET /api/notification-content/book/level4/:chapterId
router.get('/book/level4/:chapterId', async (req, res) => {
    const { chapterId } = req.params;
    try {
        const data = (await BookContent.find({ chapter: chapterId }).sort({ sequence: 1 }).lean())
            .map(d => ({ _id: d._id, name: d.title_hn || d.title_en || d.title_hinglish || 'Content Entry' }));
        res.json({ success: true, data });
    } catch (err) {
        console.error('[notifContent level4 book]', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
