const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const granthNameSchema = new mongoose.Schema({
    id: { type: Number, unique: true },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GranthCategory',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    book_image: {
        type: String
    }
}, {
    timestamps: true
});

granthNameSchema.plugin(AutoIncrement, { inc_field: 'id', id: 'granth_name_id_counter' });

module.exports = mongoose.model('GranthName', granthNameSchema);

