const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

// Shared deep-link sub-document. Used by Notification (push deep links) and
// Advertisement (banner sections). Built by services/notificationDeepLink.js.
const deepLinkSchema = new mongoose.Schema({
    // Which content section this links to
    contentType: {
        type: String,
        enum: ['kosh', 'karmkand', 'book', 'muhurat', 'rashifal_daily', 'numerology_daily', 'festival', 'emagazine', 'youtube'],
        default: null
    },
    // Level 1 — Category / Date
    categoryId: { type: ObjectId, default: null },
    categoryName: { type: String, default: null },
    // Level 2 — SubCategory / Book / Content (for flat sections)
    subCategoryId: { type: ObjectId, default: null },
    subCategoryName: { type: String, default: null },
    // Level 3 — Chapter (book only) / Content (kosh, karmkand)
    level3Id: { type: ObjectId, default: null },
    level3Name: { type: String, default: null },
    // The actual content item
    contentId: { type: ObjectId, default: null },
    contentTitle: { type: String, default: null },
    // Constructed deep link URL — Flutter app uses this for navigation
    deepLinkUrl: { type: String, default: null },
    // Flutter screen/route name
    screen: { type: String, default: null },
    // Full navigation params as JSON (for flexible future use)
    navigationParams: { type: mongoose.Schema.Types.Mixed, default: {} },
    // E-Magazine specific (categoryName = category, subCategoryName = subject)
    writerName:  { type: String, default: null },
    writerImage: { type: String, default: null },
    subjectName: { type: String, default: null }
}, { _id: false });

module.exports = deepLinkSchema;
