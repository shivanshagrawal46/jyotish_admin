const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const deepLinkSchema = new mongoose.Schema({
    // Which content section this notification links to
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

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['info', 'warning', 'success', 'error', 'announcement', 'content'],
        default: 'info'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    targetAudience: {
        type: String,
        enum: ['all', 'premium', 'free', 'specific'],
        default: 'all'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    scheduledAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        default: null
    },
    // Optional manual action URL (used when no deep link)
    actionUrl: {
        type: String,
        default: null
    },
    actionText: {
        type: String,
        default: null
    },
    imageUrl: {
        type: String,
        default: null
    },
    // Deep link navigation data — the core of content-linked notifications
    deepLink: {
        type: deepLinkSchema,
        default: null
    },
    createdBy: {
        type: ObjectId,
        ref: 'User',
        required: false,
        default: null
    },
    sentCount: {
        type: Number,
        default: 0
    },
    readCount: {
        type: Number,
        default: 0
    },
    openCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

notificationSchema.index({ isActive: 1, scheduledAt: 1 });
notificationSchema.index({ targetAudience: 1, isActive: 1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ 'deepLink.contentType': 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
