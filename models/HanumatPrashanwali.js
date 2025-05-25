const mongoose = require('mongoose');

const hanumatPrashanwaliSchema = new mongoose.Schema({
    // Only one document expected, but allow for future expansion
    entries: [{
        number: { type: Number, required: true },
        content: { type: String, default: '' }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('HanumatPrashanwali', hanumatPrashanwaliSchema); 