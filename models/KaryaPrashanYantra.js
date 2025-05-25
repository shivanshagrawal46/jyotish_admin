const mongoose = require('mongoose');

const karyaPrashanYantraSchema = new mongoose.Schema({
    entries: [{
        number: { type: Number, required: true },
        content: { type: String, default: '' }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('KaryaPrashanYantra', karyaPrashanYantraSchema); 