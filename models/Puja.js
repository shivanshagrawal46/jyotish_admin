const mongoose = require('mongoose');

const pujaSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  tagline: {
    type: String,
  },
  temple_name: {
    type: String,
    required: true,
  },
  temple_location: {
    type: String,
    required: true,
  },
  puja_date: {
    type: Date,
    required: true,
  },
  puja_day: {
    type: String,
  },
  description: {
    type: String,
  },
  image_url: {
    type: String,
  },
  banner_text: {
    type: String,
  },
  booked_count: {
    type: Number,
    default: 0,
  },
  total_slots: {
    type: Number,
  },
  countdown_time: {
    type: Date,
  },
  is_last_day: {
    type: Boolean,
    default: false,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  whatsapp_link: {
    type: String,
  },
}, {
  timestamps: true // adds createdAt and updatedAt
});

module.exports = mongoose.model('Puja', pujaSchema); 