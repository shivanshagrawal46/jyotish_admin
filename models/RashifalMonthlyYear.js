const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const rashifalMonthlyYearSchema = new mongoose.Schema({
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
rashifalMonthlyYearSchema.plugin(AutoIncrement, { inc_field: 'id', id: 'rashifal_monthly_year_id_counter' });

// Index for faster queries
rashifalMonthlyYearSchema.index({ year: -1 });

module.exports = mongoose.model('RashifalMonthlyYear', rashifalMonthlyYearSchema);

