const mongoose = require('mongoose');

const rashifalDailyDateSchema = new mongoose.Schema({
    dateLabel: {
        type: String,
        required: true
    },
    dateISO: {
        type: Date
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});

rashifalDailyDateSchema.index({ createdAt: -1 });
rashifalDailyDateSchema.index({ dateLabel: 1 });

module.exports = mongoose.model('RashifalDailyDate', rashifalDailyDateSchema);


