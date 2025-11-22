const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const muhuratCategorySchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true
  },
  categoryName: {
    type: String,
    required: true,
    trim: true
  },
  imageUrl: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

muhuratCategorySchema.plugin(AutoIncrement, { inc_field: 'id', id: 'muhurat_category_id_counter' });

module.exports = mongoose.model('MuhuratCategory', muhuratCategorySchema);

