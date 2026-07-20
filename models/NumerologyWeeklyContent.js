const mongoose = require('mongoose');

// One number entry for a given week (9 per week), linked to a NumerologyWeeklyDate.
const numerologyWeeklyContentSchema = new mongoose.Schema({
    dateRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'NumerologyWeeklyDate',
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

numerologyWeeklyContentSchema.index({ dateRef: 1, sequence: 1 });

module.exports = mongoose.model('NumerologyWeeklyContent', numerologyWeeklyContentSchema);
