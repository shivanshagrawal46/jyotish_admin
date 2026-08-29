const mongoose = require('mongoose');

// A question an app user saved to revise later.
const mcqBookmarkSchema = new mongoose.Schema({
  user_id: { type: String, required: true, index: true, trim: true },
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'McqContent', required: true },
  question_id: { type: Number },
}, { timestamps: true });

mcqBookmarkSchema.index({ user_id: 1, question: 1 }, { unique: true });

module.exports = mongoose.model('McqBookmark', mcqBookmarkSchema);
