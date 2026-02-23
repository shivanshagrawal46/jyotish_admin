const mongoose = require('mongoose');

const csu2EntrySchema = new mongoose.Schema(
  {
    date: { type: String },
    lagna: { type: String },
    sequence: { type: Number, default: 0 }
  },
  { _id: false }
);

const csu2Schema = new mongoose.Schema(
  {
    pageNo: { type: Number, default: 1 },
    sequence: { type: Number, default: 0 },
    heading: { type: String },
    items: [csu2EntrySchema]
  },
  {
    timestamps: true
  }
);

csu2Schema.index({ pageNo: 1, sequence: 1 });
csu2Schema.index({ heading: 1 });

module.exports = mongoose.model('Csu2', csu2Schema);
