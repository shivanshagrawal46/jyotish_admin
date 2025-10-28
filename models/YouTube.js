const mongoose = require('mongoose');

const youTubeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true
  },
  category: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('YouTube', youTubeSchema);


