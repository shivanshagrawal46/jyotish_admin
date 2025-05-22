const mongoose = require('mongoose');

const numerologyDailySchema = new mongoose.Schema({
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

module.exports = mongoose.model('NumerologyDaily', numerologyDailySchema); 