const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const muhuratContentSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MuhuratCategory',
    required: true
  },
  year: {
    type: Number
  },
  date: {
    type: String
  },
  detail: {
    type: String
  }
}, {
  timestamps: true
});

muhuratContentSchema.plugin(AutoIncrement, { inc_field: 'id', id: 'muhurat_content_id_counter' });

module.exports = mongoose.model('MuhuratContent', muhuratContentSchema);

