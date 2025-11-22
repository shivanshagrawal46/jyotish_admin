const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const numerologyMonthlyYearSchema = new mongoose.Schema({
    id: { type: Number, unique: true },
    year: {
        type: Number,
        required: true,
        unique: true
    },
    description: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Auto-increment plugin for id field
numerologyMonthlyYearSchema.plugin(AutoIncrement, { inc_field: 'id', id: 'numerology_monthly_year_id_counter' });

// Index for faster queries
numerologyMonthlyYearSchema.index({ year: -1 });

module.exports = mongoose.model('NumerologyMonthlyYear', numerologyMonthlyYearSchema);

