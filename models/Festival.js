const mongoose = require('mongoose');

const festivalSchema = new mongoose.Schema({
  date: { type: Date },
  vrat: { type: String },
  festival_name: { type: String },
  jyanti: { type: String },
  vishesh: { type: String },
  sequence: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Festival', festivalSchema); 