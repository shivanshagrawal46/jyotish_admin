const mongoose = require('mongoose');

const rashifalYearlySchema = new mongoose.Schema({
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

rashifalYearlySchema.index({ date: 1 });

rashifalYearlySchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const RashifalYearly = mongoose.model('RashifalYearly', rashifalYearlySchema);

module.exports = RashifalYearly; 