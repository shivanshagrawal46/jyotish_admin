const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const rashifalYearlyYearSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true
  },
  year: {
    type: Number,
    required: true,
    unique: true
  },
  description: {
    type: String
  }
}, {
  timestamps: true
});

rashifalYearlyYearSchema.plugin(AutoIncrement, { inc_field: 'id', id: 'rashifal_yearly_year_id_counter' });

module.exports = mongoose.model('RashifalYearlyYear', rashifalYearlyYearSchema);

