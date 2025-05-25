const mongoose = require('mongoose');

const sixtyFourPrashanYantraSchema = new mongoose.Schema({
    entries: [{
        number: { type: Number, required: true },
        content: { type: String, default: '' }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('SixtyFourPrashanYantra', sixtyFourPrashanYantraSchema); 