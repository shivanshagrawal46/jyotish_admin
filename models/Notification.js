const mongoose = require('mongoose');

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
        enum: ['info', 'warning', 'success', 'error', 'announcement'],
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
        default: null // null means never expires
    },
    actionUrl: {
        type: String,
        default: null // Optional URL for action button
    },
    actionText: {
        type: String,
        default: null // Optional text for action button
    },
    imageUrl: {
        type: String,
        default: null // Optional image URL
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sentCount: {
        type: Number,
        default: 0
    },
    readCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for efficient queries
notificationSchema.index({ isActive: 1, scheduledAt: 1 });
notificationSchema.index({ targetAudience: 1, isActive: 1 });
notificationSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
