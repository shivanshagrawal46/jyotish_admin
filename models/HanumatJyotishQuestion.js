const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const hanumatJyotishQuestionSchema = new mongoose.Schema({
    id: { type: Number, unique: true },
    question: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    position: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

hanumatJyotishQuestionSchema.plugin(AutoIncrement, { inc_field: 'id', id: 'hanumat_jyotish_question_id_counter' });

module.exports = mongoose.model('HanumatJyotishQuestion', hanumatJyotishQuestionSchema); 