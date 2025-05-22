const mongoose = require('mongoose');
const slugify = require('slugify');

const offerSchema = new mongoose.Schema({
  title: String,
  description: String,
  code: String,
  type: {
    type: String,
    enum: ['percentage', 'bogo', 'flat', 'custom'],
    default: 'custom',
  }
});

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AstroShopCategory',
    required: true
  },
  short_description: {
    type: String,
  },
  full_description: {
    type: String,
  },
  images: [{
    type: String,
  }],
  price: {
    type: Number,
    required: true,
  },
  original_price: {
    type: Number,
  },
  discount_percentage: {
    type: Number,
  },
  rating: {
    type: Number,
    default: 0,
  },
  total_reviews: {
    type: Number,
    default: 0,
  },
  stock_quantity: {
    type: Number,
    default: 0,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  offers: [offerSchema],
  promo_note: {
    type: String,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  }
});

// Auto-generate slug from title
productSchema.pre('validate', function(next) {
  if (this.title && (!this.slug || this.isModified('title'))) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model('Product', productSchema); 