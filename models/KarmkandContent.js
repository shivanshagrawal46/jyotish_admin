const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const karmkandContentSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'KarmkandSubCategory', required: true },
  sequenceNo: { type: Number, required: true },
  hindiWord: { type: String },
  englishWord: { type: String },
  hinglishWord: { type: String },
  meaning: { type: String },
  extra: { type: String },
  structure: { type: String },
  search: { type: String },
  youtubeLink: { type: String },
  image: { type: String },
  createdAt: { type: Date, default: Date.now }
});

karmkandContentSchema.plugin(AutoIncrement, { inc_field: 'id', id: 'karmkand_content_id_counter' });

module.exports = mongoose.model('KarmkandContent', karmkandContentSchema); 