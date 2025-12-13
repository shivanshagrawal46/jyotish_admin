const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const divineSanskritSchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true
    },
    quote: {
        type: String,
        required: true,
        trim: true
    },
    meaning: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true
});

divineSanskritSchema.plugin(AutoIncrement, { inc_field: 'id', id: 'divine_sanskrit_id_counter' });

module.exports = mongoose.model('DivineSanskrit', divineSanskritSchema);

