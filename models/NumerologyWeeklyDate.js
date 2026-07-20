const mongoose = require('mongoose');

// Parent document for weekly numerology: one entry per week (identified by a date
// label / ISO date). Each week then has 9 number content children.
const numerologyWeeklyDateSchema = new mongoose.Schema({
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

numerologyWeeklyDateSchema.index({ createdAt: -1 });
numerologyWeeklyDateSchema.index({ dateLabel: 1 });
numerologyWeeklyDateSchema.index({ sequence: 1 });

module.exports = mongoose.model('NumerologyWeeklyDate', numerologyWeeklyDateSchema);
