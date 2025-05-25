const mongoose = require('mongoose');

const ankPrashanSchema = new mongoose.Schema({
    entries: [{
        number: { type: Number, required: true },
        content: { type: String, default: '' }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('AnkPrashan', ankPrashanSchema); 