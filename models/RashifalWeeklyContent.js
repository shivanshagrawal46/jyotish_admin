const mongoose = require('mongoose');

// One rashi entry for a given week (12 per week), linked to a RashifalWeeklyDate.
const rashifalWeeklyContentSchema = new mongoose.Schema({
    dateRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RashifalWeeklyDate',
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

rashifalWeeklyContentSchema.index({ dateRef: 1, sequence: 1 });

module.exports = mongoose.model('RashifalWeeklyContent', rashifalWeeklyContentSchema);
