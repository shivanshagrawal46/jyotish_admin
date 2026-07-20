const mongoose = require('mongoose');

// Generic paid-content purchase record for modules other than Kosh
// (karmkand, book, emagazine, ...). Kosh keeps its own KoshPurchase model.
// Payment + verification happen on an external backend; the app posts a
// confirmation here after payment succeeds.
const purchaseSchema = new mongoose.Schema({
  module: { type: String, required: true, index: true }, // 'karmkand' | 'book' | 'emagazine'
  email: { type: String, lowercase: true, trim: true, default: null, index: true },
  phone: { type: String, trim: true, default: null, index: true },
  // The content identifier the public API exposes for that module.
  // Numeric id for karmkand/emagazine, Mongo _id string for book — stored as string.
  contentId: { type: String, required: true, index: true },
  amount: { type: Number, default: 0 },
  reference: { type: String, default: null }, // receipt id from the external payment backend
  status: { type: String, enum: ['paid', 'refunded'], default: 'paid' },
  createdAt: { type: Date, default: Date.now },
});

// Fast lookups: "has this user paid for this content in this module?"
purchaseSchema.index({ module: 1, email: 1, contentId: 1 });
purchaseSchema.index({ module: 1, phone: 1, contentId: 1 });

module.exports = mongoose.model('Purchase', purchaseSchema);
