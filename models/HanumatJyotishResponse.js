const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const hanumatJyotishResponseSchema = new mongoose.Schema({
    id: { type: Number, unique: true },
    question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HanumatJyotishQuestion',
        required: true
    },
    responses: [{
        field_number: {
            type: Number,
            required: true,
            min: 1,
            max: 10
        },
        content: {
            type: String,
            required: true
        }
    }]
}, {
    timestamps: true
});

hanumatJyotishResponseSchema.plugin(AutoIncrement, { inc_field: 'id', id: 'hanumat_jyotish_response_id_counter' });

module.exports = mongoose.model('HanumatJyotishResponse', hanumatJyotishResponseSchema); 