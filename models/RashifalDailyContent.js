const mongoose = require('mongoose');

const rashifalDailyContentSchema = new mongoose.Schema({
    dateRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RashifalDailyDate',
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

rashifalDailyContentSchema.index({ dateRef: 1, sequence: 1 });

module.exports = mongoose.model('RashifalDailyContent', rashifalDailyContentSchema);


