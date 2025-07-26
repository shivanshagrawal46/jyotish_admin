const mongoose = require('mongoose');

const numerologyMonthlySchema = new mongoose.Schema({
    sequence: {
        type: Number,
        default: 0
    },
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
numerologyMonthlySchema.index({ month: 1 });
numerologyMonthlySchema.index({ sequence: 1 });

module.exports = mongoose.model('NumerologyMonthly', numerologyMonthlySchema); 