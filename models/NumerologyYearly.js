const mongoose = require('mongoose');

const numerologyYearlySchema = new mongoose.Schema({
    yearRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'NumerologyYearlyYear',
        required: true
    },
    sequence: {
        type: Number,
        default: 0
    },
    title_hn: {
        type: String,
        required: true
    },
    title_en: {
        type: String,
        required: true
    },
    date: {
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
numerologyYearlySchema.index({ yearRef: 1, sequence: 1 });
numerologyYearlySchema.index({ yearRef: 1 });

module.exports = mongoose.model('NumerologyYearly', numerologyYearlySchema); 