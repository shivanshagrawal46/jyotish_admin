const mongoose = require('mongoose');

// One practice/test session played by an app user. The correct answers are
// snapshotted onto the attempt when it starts, so editing a question in the
// admin panel later never rewrites a user's past result.
const attemptQuestionSchema = new mongoose.Schema({
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'McqContent', required: true },
  question_id: { type: Number },
  sequence: { type: Number, required: true },
  // Display order of the options; each entry is an original option number (1-4).
  option_order: [{ type: Number }],
  correct_answers: [{ type: Number }],
  selected: [{ type: Number }],
  answered: { type: Boolean, default: false },
  is_correct: { type: Boolean, default: null },
  time_taken_sec: { type: Number, default: 0 },
}, { _id: false });

const mcqAttemptSchema = new mongoose.Schema({
  user_id: { type: String, required: true, index: true, trim: true },
  email: { type: String, lowercase: true, trim: true, default: null },
  phone: { type: String, trim: true, default: null },

  category: { type: mongoose.Schema.Types.ObjectId, ref: 'McqCategory', default: null },
  master: { type: mongoose.Schema.Types.ObjectId, ref: 'McqMaster', default: null },
  // Where the questions came from: a single set, a whole category (mixed),
  // previously wrong answers, or bookmarked questions.
  source: { type: String, enum: ['set', 'category', 'wrong', 'bookmarked'], default: 'set' },
  mode: { type: String, enum: ['practice', 'test'], default: 'practice' },
  status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress', index: true },

  questions: [attemptQuestionSchema],

  total: { type: Number, default: 0 },
  correct: { type: Number, default: 0 },
  wrong: { type: Number, default: 0 },
  skipped: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  percent: { type: Number, default: 0 },
  time_taken_sec: { type: Number, default: 0 },

  started_at: { type: Date, default: Date.now },
  finished_at: { type: Date, default: null },
}, { timestamps: true });

mcqAttemptSchema.index({ user_id: 1, status: 1, finished_at: -1 });
mcqAttemptSchema.index({ user_id: 1, master: 1 });

module.exports = mongoose.model('McqAttempt', mcqAttemptSchema);
