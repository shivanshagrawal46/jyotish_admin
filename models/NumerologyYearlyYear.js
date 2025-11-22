const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const numerologyYearlyYearSchema = new mongoose.Schema({
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

numerologyYearlyYearSchema.plugin(AutoIncrement, { inc_field: 'id', id: 'numerology_yearly_year_id_counter' });

module.exports = mongoose.model('NumerologyYearlyYear', numerologyYearlyYearSchema);

