const mongoose = require('mongoose');

const festivalSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  vrat: { type: String,  },
  festival_name: { type: String, required: true },
  jyanti: { type: String },
  vishesh: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Festival', festivalSchema); 