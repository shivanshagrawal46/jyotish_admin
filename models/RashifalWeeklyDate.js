const mongoose = require('mongoose');

// Parent document for weekly rashifal: one entry per week (identified by a date
// label / ISO date). Each week then has 12 rashi content children.
const rashifalWeeklyDateSchema = new mongoose.Schema({
    dateLabel: {
        type: String,
        required: true
    },
    dateISO: {
        type: Date
    },
    notes: {
        type: String
    },
    sequence: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

rashifalWeeklyDateSchema.index({ createdAt: -1 });
rashifalWeeklyDateSchema.index({ dateLabel: 1 });
rashifalWeeklyDateSchema.index({ sequence: 1 });

module.exports = mongoose.model('RashifalWeeklyDate', rashifalWeeklyDateSchema);
