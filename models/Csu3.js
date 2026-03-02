const mongoose = require('mongoose');

const csu3Schema = new mongoose.Schema(
  {
    pageNo: { type: Number, default: 1 },
    sequence: { type: Number, default: 0 },
    heading: { type: String },
    content: { type: String }
  },
  {
    timestamps: true
  }
);

csu3Schema.index({ pageNo: 1, sequence: 1 });
csu3Schema.index({ heading: 1, pageNo: 1 });

module.exports = mongoose.model('Csu3', csu3Schema);
