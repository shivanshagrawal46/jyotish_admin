const mongoose = require('mongoose');

const celebrityKundliSchema = new mongoose.Schema({
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'CelebrityKundliCategory', required: true },
  name: { type: String, required: true },
  dob: { type: Date, required: true },
  time: { type: String, required: true },
  place: { type: String, required: true },
  about: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CelebrityKundli', celebrityKundliSchema); 