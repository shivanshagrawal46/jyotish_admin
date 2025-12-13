const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const granthChapterSchema = new mongoose.Schema({
    id: { type: Number, unique: true },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GranthCategory',
        required: true
    },
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GranthName',
        required: true
    },
    name: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

granthChapterSchema.plugin(AutoIncrement, { inc_field: 'id', id: 'granth_chapter_id_counter' });

module.exports = mongoose.model('GranthChapter', granthChapterSchema);

