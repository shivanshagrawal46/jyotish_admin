const mongoose = require('mongoose');

const rashifalMonthlySchema = new mongoose.Schema({
    month: {
        type: String,
        required: true
    },
    title_hn: {
        type: String,
        required: true
    },
    title_en: {
        type: String,
        required: true
    },
    details_hn: {
        type: String,
        required: true
    },
    details_en: {
        type: String,
        required: true
    },
    images: [{
        type: String
    }]
}, {
    timestamps: true
});

// Index for faster queries
rashifalMonthlySchema.index({ date: 1 });

// Pre-save middleware to update the updatedAt field
rashifalMonthlySchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const RashifalMonthly = mongoose.model('RashifalMonthly', rashifalMonthlySchema);

module.exports = RashifalMonthly; 