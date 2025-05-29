const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const eMagazineSubjectSchema = new mongoose.Schema({
    id: { type: Number, unique: true },
    name: { type: String, required: true, trim: true }
}, {
    timestamps: true
});

eMagazineSubjectSchema.plugin(AutoIncrement, { inc_field: 'id', id: 'emag_subject_id_counter' });

module.exports = mongoose.model('EMagazineSubject', eMagazineSubjectSchema); 