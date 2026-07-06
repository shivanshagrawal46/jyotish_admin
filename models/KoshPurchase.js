const mongoose = require('mongoose');

// Records that a user (identified by email and/or phone) has paid for a specific
// Kosh content entry. The actual payment + verification happens on an external
// backend; the Flutter app posts a confirmation here after payment succeeds.
const koshPurchaseSchema = new mongoose.Schema({
  email: { type: String, lowercase: true, trim: true, default: null, index: true },
  phone: { type: String, trim: true, default: null, index: true },
  // KoshContent.id (the numeric id the public API returns), e.g. 1234
  contentId: { type: Number, required: true, index: true },
  subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'KoshSubCategory', default: null },
  amount: { type: Number, default: 0 },
  // Optional reference/receipt id from the external payment backend
  reference: { type: String, default: null },
  status: { type: String, enum: ['paid', 'refunded'], default: 'paid' },
  createdAt: { type: Date, default: Date.now },
});

// Fast lookups: "has this user paid for this content?"
koshPurchaseSchema.index({ email: 1, contentId: 1 });
koshPurchaseSchema.index({ phone: 1, contentId: 1 });

module.exports = mongoose.model('KoshPurchase', koshPurchaseSchema);
