const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const granthCategorySchema = new mongoose.Schema({
    id: { type: Number, unique: true },
    name: {
        type: String,
        required: true,
        unique: true
    },
    cover_image: {
        type: String
    }
}, {
    timestamps: true
});

granthCategorySchema.plugin(AutoIncrement, { inc_field: 'id', id: 'granth_category_id_counter' });

module.exports = mongoose.model('GranthCategory', granthCategorySchema);

