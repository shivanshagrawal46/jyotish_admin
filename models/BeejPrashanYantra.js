const mongoose = require('mongoose');

const beejPrashanYantraSchema = new mongoose.Schema({
    entries: [{
        name: { type: String, required: true },
        content: { type: String, default: '' }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('BeejPrashanYantra', beejPrashanYantraSchema); 