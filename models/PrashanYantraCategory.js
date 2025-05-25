const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const prashanYantraCategorySchema = new mongoose.Schema({
    id: { type: Number, unique: true },
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String
    },
    cover_image: {
        type: String
    },
    position: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

prashanYantraCategorySchema.plugin(AutoIncrement, { inc_field: 'id', id: 'prashan_yantra_category_id_counter' });

module.exports = mongoose.model('PrashanYantraCategory', prashanYantraCategorySchema); 