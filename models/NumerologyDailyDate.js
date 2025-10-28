const mongoose = require('mongoose');

const numerologyDailyDateSchema = new mongoose.Schema({
    dateLabel: {
        type: String,
        required: true
    },
    // Optional ISO date if admin wants to store actual date object
    dateISO: {
        type: Date
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});

numerologyDailyDateSchema.index({ createdAt: -1 });
numerologyDailyDateSchema.index({ dateLabel: 1 });

module.exports = mongoose.model('NumerologyDailyDate', numerologyDailyDateSchema);


