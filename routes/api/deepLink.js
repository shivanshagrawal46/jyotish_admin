/**
 * Deep Link Resolver API
 * 
 * Flutter calls this ONE endpoint when a notification is tapped.
 * Returns the full content + full hierarchy with correct numeric IDs
 * so Flutter can open the detail screen directly AND build a proper
 * back navigation stack — without needing multiple API calls.
 *
 * GET /api/deep-link/resolve?section=kosh&contentId=64abc...
 *
 * Response shape (same structure for all sections):
 * {
 *   success: true,
 *   section: "kosh",
 *   screen: "KoshContentDetail",
 *   content: { ...all fields of the content document },
 *   hierarchy: {
 *     category:    { _id, id (numeric), name, ... },
 *     subCategory: { _id, id (numeric), name, ... },   // if applicable
 *     level3:      { _id, id (numeric), name, ... },   // book chapter only
 *   },
 *   navigationIds: {
 *     // These are the NUMERIC ids used by your existing Flutter API calls
 *     // so back navigation (re-fetching list screens) uses them directly
 *     categoryNumericId:    1,
 *     subCategoryNumericId: 3,
 *     level3NumericId:      null,
 *   }
 * }
 */

const express = require('express');
const router = express.Router();

const KoshContent        = require('../../models/KoshContent');
const KoshSubCategory    = require('../../models/KoshSubCategory');
const KoshCategory       = require('../../models/KoshCategory');
const KarmkandContent    = require('../../models/KarmkandContent');
const KarmkandSubCategory= require('../../models/KarmkandSubCategory');
const KarmkandCategory   = require('../../models/KarmkandCategory');
const BookContent        = require('../../models/BookContent');
const BookChapter        = require('../../models/BookChapter');
const BookName           = require('../../models/BookName');
const BookCategory       = require('../../models/BookCategory');
const MuhuratContent     = require('../../models/MuhuratContent');
const MuhuratCategory    = require('../../models/MuhuratCategory');
const RashifalDailyContent  = require('../../models/RashifalDailyContent');
const RashifalDailyDate     = require('../../models/RashifalDailyDate');
const NumerologyDailyContent= require('../../models/NumerologyDailyContent');
const NumerologyDailyDate   = require('../../models/NumerologyDailyDate');
const Festival           = require('../../models/Festival');

const SCREENS = {
    kosh:             'KoshContentDetail',
    karmkand:         'KarmkandContentDetail',
    book:             'BookContentDetail',
    muhurat:          'MuhuratDetail',
    rashifal_daily:   'RashifalDailyDetail',
    numerology_daily: 'NumerologyDailyDetail',
    festival:         'FestivalDetail'
};

// ─── GET /api/deep-link/resolve ───────────────────────────────────────────────
router.get('/resolve', async (req, res) => {
    const { section, contentId } = req.query;

    if (!section || !contentId) {
        return res.status(400).json({
            success: false,
            error: 'section and contentId are required'
        });
    }

    if (!SCREENS[section]) {
        return res.status(400).json({
            success: false,
            error: `Unknown section: ${section}`
        });
    }

    try {
        let result;
        switch (section) {
            case 'kosh':          result = await resolveKosh(contentId);          break;
            case 'karmkand':      result = await resolveKarmkand(contentId);      break;
            case 'book':          result = await resolveBook(contentId);           break;
            case 'muhurat':       result = await resolveMuhurat(contentId);        break;
            case 'rashifal_daily':   result = await resolveRashifalDaily(contentId); break;
            case 'numerology_daily': result = await resolveNumerologyDaily(contentId); break;
            case 'festival':      result = await resolveFestival(contentId);       break;
        }

        if (!result) {
            return res.status(404).json({ success: false, error: 'Content not found' });
        }

        res.json({
            success: true,
            section,
            screen: SCREENS[section],
            ...result
        });
    } catch (err) {
        console.error(`[deepLink resolve] ${section}/${contentId}:`, err);
        res.status(500).json({ success: false, error: 'Server error: ' + err.message });
    }
});

// ─── Resolvers ────────────────────────────────────────────────────────────────

async function resolveKosh(contentId) {
    const content = await KoshContent.findById(contentId).lean();
    if (!content) return null;

    const subCat = await KoshSubCategory.findById(content.subCategory).lean();
    const cat    = subCat ? await KoshCategory.findById(subCat.parentCategory).lean() : null;

    return {
        content: {
            _id:          content._id,
            id:           content.id,
            hindiWord:    content.hindiWord    || '',
            englishWord:  content.englishWord  || '',
            hinglishWord: content.hinglishWord || '',
            meaning:      content.meaning      || '',
            extra:        content.extra        || '',
            structure:    content.structure    || '',
            youtubeLink:  content.youtubeLink  || '',
            image:        content.image        || '',
            sequenceNo:   content.sequenceNo
        },
        hierarchy: {
            category:    cat    ? { _id: cat._id,    id: cat.id,    name: cat.name    } : null,
            subCategory: subCat ? { _id: subCat._id, id: subCat.id, name: subCat.name } : null
        },
        // Numeric IDs for your existing Flutter API calls like:
        // /api/kosh-content/subcategory/:subcategoryObjectId
        navigationIds: {
            categoryObjectId:    cat?._id?.toString()    || null,
            subCategoryObjectId: subCat?._id?.toString() || null,
            // Kosh API uses ObjectIds for subcategory lookup
            subCategoryForList:  subCat?._id?.toString() || null
        }
    };
}

async function resolveKarmkand(contentId) {
    const content = await KarmkandContent.findById(contentId).lean();
    if (!content) return null;

    const subCat = await KarmkandSubCategory.findById(content.subCategory).lean();
    const cat    = subCat ? await KarmkandCategory.findById(subCat.parentCategory).lean() : null;

    return {
        content: {
            _id:          content._id,
            id:           content.id,
            hindiWord:    content.hindiWord    || '',
            englishWord:  content.englishWord  || '',
            hinglishWord: content.hinglishWord || '',
            meaning:      content.meaning      || '',
            extra:        content.extra        || '',
            structure:    content.structure    || '',
            youtubeLink:  content.youtubeLink  || '',
            image:        content.image        || '',
            sequenceNo:   content.sequenceNo
        },
        hierarchy: {
            category:    cat    ? { _id: cat._id,    id: cat.id,    name: cat.name    } : null,
            subCategory: subCat ? { _id: subCat._id, id: subCat.id, name: subCat.name } : null
        },
        // Karmkand API uses NUMERIC id for:
        // /api/karmkand/category/:categoryId/:subcategoryId
        navigationIds: {
            categoryNumericId:    cat?.id    ?? null,
            subCategoryNumericId: subCat?.id ?? null,
            // Use these in your existing Flutter API calls for back navigation
            categoryObjectId:    cat?._id?.toString()    || null,
            subCategoryObjectId: subCat?._id?.toString() || null
        }
    };
}

async function resolveBook(contentId) {
    const content = await BookContent.findById(contentId).lean();
    if (!content) return null;

    const [chapter, book, category] = await Promise.all([
        BookChapter.findById(content.chapter).lean(),
        BookName.findById(content.book).lean(),
        BookCategory.findById(content.category).lean()
    ]);

    return {
        content: {
            _id:           content._id,
            title_hn:      content.title_hn       || '',
            title_en:      content.title_en       || '',
            title_hinglish:content.title_hinglish || '',
            meaning:       content.meaning        || '',
            details:       content.details        || '',
            extra:         content.extra          || '',
            images:        content.images         || [],
            video_links:   content.video_links    || [],
            sequence:      content.sequence
        },
        hierarchy: {
            category: category ? { _id: category._id, id: category.id, name: category.name } : null,
            book:     book     ? { _id: book._id,     id: book.id,     name: book.name     } : null,
            chapter:  chapter  ? { _id: chapter._id,  id: chapter.id,  name: chapter.name  } : null
        },
        // Book API uses NUMERIC id for:
        // /api/book/category/:categoryId → books
        // /api/book/category/:categoryId/:bookId → chapters
        // /api/book/category/:categoryId/:bookId/:chapterId → content
        navigationIds: {
            categoryNumericId: category?.id ?? null,
            bookNumericId:     book?.id     ?? null,
            chapterNumericId:  chapter?.id  ?? null,
            // Also include ObjectIds for direct resolution
            categoryObjectId:  category?._id?.toString() || null,
            bookObjectId:      book?._id?.toString()     || null,
            chapterObjectId:   chapter?._id?.toString()  || null
        }
    };
}

async function resolveMuhurat(contentId) {
    const content = await MuhuratContent.findById(contentId).lean();
    if (!content) return null;

    const category = await MuhuratCategory.findById(content.categoryId).lean();

    return {
        content: {
            _id:    content._id,
            id:     content.id,
            year:   content.year,
            date:   content.date,
            detail: content.detail || ''
        },
        hierarchy: {
            category: category ? { _id: category._id, id: category.id, name: category.categoryName } : null
        },
        // Muhurat API supports both ObjectId and numeric id:
        // /api/muhurat/:categoryId (works with both)
        navigationIds: {
            categoryNumericId: category?.id ?? null,
            categoryObjectId:  category?._id?.toString() || null
        }
    };
}

async function resolveRashifalDaily(contentId) {
    const content = await RashifalDailyContent.findById(contentId).lean();
    if (!content) return null;

    const dateDoc = await RashifalDailyDate.findById(content.dateRef).lean();

    // Rashifal API uses 1-based index for dates, so we need to find the position
    let dateIndex = null;
    if (dateDoc) {
        const allDates = await RashifalDailyDate.find()
            .sort({ sequence: 1, createdAt: 1 })
            .select('_id')
            .lean();
        dateIndex = allDates.findIndex(d => d._id.toString() === dateDoc._id.toString()) + 1;
    }

    return {
        content: {
            _id:        content._id,
            title_hn:   content.title_hn   || '',
            title_en:   content.title_en   || '',
            details_hn: content.details_hn || '',
            details_en: content.details_en || '',
            images:     content.images     || [],
            sequence:   content.sequence
        },
        hierarchy: {
            date: dateDoc ? {
                _id:       dateDoc._id,
                dateLabel: dateDoc.dateLabel,
                dateISO:   dateDoc.dateISO,
                sequence:  dateDoc.sequence
            } : null
        },
        // Rashifal API uses either 1-based index or ObjectId:
        // /api/rashifal/daily/:dateId/content (accepts ObjectId or index)
        navigationIds: {
            dateObjectId:   dateDoc?._id?.toString() || null,
            dateIndex:      dateIndex  // 1-based index for the Rashifal API
        }
    };
}

async function resolveNumerologyDaily(contentId) {
    const content = await NumerologyDailyContent.findById(contentId).lean();
    if (!content) return null;

    const dateDoc = await NumerologyDailyDate.findById(content.dateRef).lean();

    let dateIndex = null;
    if (dateDoc) {
        const allDates = await NumerologyDailyDate.find()
            .sort({ sequence: 1, createdAt: 1 })
            .select('_id')
            .lean();
        dateIndex = allDates.findIndex(d => d._id.toString() === dateDoc._id.toString()) + 1;
    }

    return {
        content: {
            _id:        content._id,
            title_hn:   content.title_hn   || '',
            title_en:   content.title_en   || '',
            details_hn: content.details_hn || '',
            details_en: content.details_en || '',
            images:     content.images     || [],
            sequence:   content.sequence
        },
        hierarchy: {
            date: dateDoc ? {
                _id:       dateDoc._id,
                dateLabel: dateDoc.dateLabel,
                dateISO:   dateDoc.dateISO,
                sequence:  dateDoc.sequence
            } : null
        },
        navigationIds: {
            dateObjectId: dateDoc?._id?.toString() || null,
            dateIndex
        }
    };
}

async function resolveFestival(contentId) {
    const content = await Festival.findById(contentId).lean();
    if (!content) return null;

    return {
        content: {
            _id:           content._id,
            date:          content.date,
            vrat:          content.vrat          || '',
            festival_name: content.festival_name || '',
            jyanti:        content.jyanti        || '',
            vishesh:       content.vishesh        || '',
            sequence:      content.sequence
        },
        hierarchy: null,
        navigationIds: {}
    };
}

module.exports = router;
