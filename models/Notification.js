const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

// Shared with Advertisement — see models/schemas/deepLink.js
const deepLinkSchema = require('./schemas/deepLink');

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
