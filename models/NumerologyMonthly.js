const mongoose = require('mongoose');

const numerologyMonthlySchema = new mongoose.Schema({
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

module.exports = mongoose.model('NumerologyMonthly', numerologyMonthlySchema); 