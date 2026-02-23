const mongoose = require('mongoose');

const csuSchema = new mongoose.Schema(
  {
    pageNo: { type: Number, default: 1 },
    sequence: { type: Number, default: 0 },

    heading_hn: { type: String },
    di_hn: { type: String },
    var_hn: { type: String },

    // Same day can have multiple tithi names and times
    tithi_hn: [{ type: String }],
    tithi_time_hn: [{ type: String }],

    nakshatra_hn: { type: String },
    nakshatra_time_hn: { type: String },
    chara_rashi_pravesh_hn: { type: String },
    chara_rashi_time_hn: { type: String },
    vrat_parvadi_vivaran_hn: { type: String }
  },
  {
    timestamps: true
  }
);

csuSchema.index({ pageNo: 1, sequence: 1 });
csuSchema.index({ di_hn: 1, var_hn: 1 });

module.exports = mongoose.model('Csu', csuSchema);
