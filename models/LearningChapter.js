const mongoose = require('mongoose');
const mongooseSequence = require('mongoose-sequence')(mongoose);

const learningChapterSchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LearningCategory',
        required: true
    },
    position: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

learningChapterSchema.plugin(mongooseSequence, { inc_field: 'id', id: 'learning_chapter_id_counter' });

module.exports = mongoose.model('LearningChapter', learningChapterSchema); 