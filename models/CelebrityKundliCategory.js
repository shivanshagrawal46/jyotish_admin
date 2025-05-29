const mongoose = require('mongoose');

const celebrityKundliCategorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CelebrityKundliCategory', celebrityKundliCategorySchema); 