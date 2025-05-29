const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const karmkandSubCategorySchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'KarmkandCategory', required: true },
  name: { type: String, required: true },
  position: { type: Number, required: true },
  introduction: { type: String },
  createdAt: { type: Date, default: Date.now }
});

karmkandSubCategorySchema.plugin(AutoIncrement, { inc_field: 'id', id: 'karmkand_subcategory_id_counter' });

module.exports = mongoose.model('KarmkandSubCategory', karmkandSubCategorySchema); 