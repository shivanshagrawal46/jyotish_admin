const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const eMagazineCategorySchema = new mongoose.Schema({
    id: { type: Number, unique: true },
    name: { type: String, required: true, trim: true },
    position: { type: Number, default: 0 },
    description: { type: String },
    coverImage: { type: String }
}, {
    timestamps: true
});

eMagazineCategorySchema.plugin(AutoIncrement, { inc_field: 'id', id: 'emag_category_id_counter' });

module.exports = mongoose.model('EMagazineCategory', eMagazineCategorySchema); 