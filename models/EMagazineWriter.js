const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const eMagazineWriterSchema = new mongoose.Schema({
    id: { type: Number, unique: true },
    name: { type: String, required: true, trim: true },
    designation: { type: String },
    phone: { type: String },
    image: { type: String }
}, {
    timestamps: true
});

eMagazineWriterSchema.plugin(AutoIncrement, { inc_field: 'id', id: 'emag_writer_id_counter' });

module.exports = mongoose.model('EMagazineWriter', eMagazineWriterSchema); 