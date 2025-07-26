const mongoose = require('mongoose');

const rashifalDailySchema = new mongoose.Schema({
    sequence: {
        type: Number,
        default: 0
    },
    title_hn: {
        type: String,
        required: [true, 'Hindi title is required'],
        trim: true
    },
    title_en: {
        type: String,
        required: [true, 'English title is required'],
        trim: true
    },
    date: {
        type: String,
        required: true
    },
    details_hn: {
        type: String,
        required: [true, 'Hindi details are required'],
        trim: true
    },
    details_en: {
        type: String,
        required: [true, 'English details are required'],
        trim: true
    },
    images: [{
        type: String,
        trim: true
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for faster queries
rashifalDailySchema.index({ date: 1 });
rashifalDailySchema.index({ sequence: 1 });

// Pre-save middleware to update the updatedAt field
rashifalDailySchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const RashifalDaily = mongoose.model('RashifalDaily', rashifalDailySchema);

module.exports = RashifalDaily; 