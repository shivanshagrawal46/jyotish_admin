const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const eMagazineSchema = new mongoose.Schema({
    id: { type: Number, unique: true },
    language: { type: String, enum: ['Hindi', 'English', 'Sanskrit'], required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'EMagazineCategory', required: true, index: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'EMagazineSubject', required: true, index: true },
    writer: { type: mongoose.Schema.Types.ObjectId, ref: 'EMagazineWriter', required: true, index: true },
    month: { type: String, required: true },
    year: { type: Number, required: true },
    title: { type: String, required: true },
    introduction: { type: String },
    subPoints: { type: String },
    importance: { type: String },
    explain: { type: String },
    summary: { type: String },
    reference: { type: String },
    images: [{ type: String }]
}, {
    timestamps: true
});

// Index for sorting by createdAt (used in /all endpoint)
eMagazineSchema.index({ createdAt: -1 });

eMagazineSchema.plugin(AutoIncrement, { inc_field: 'id', id: 'emagazine_id_counter' });

module.exports = mongoose.model('EMagazine', eMagazineSchema); 