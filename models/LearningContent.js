const mongoose = require('mongoose');
const mongooseSequence = require('mongoose-sequence')(mongoose);

const learningContentSchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    chapter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LearningChapter',
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

learningContentSchema.plugin(mongooseSequence, { inc_field: 'id', id: 'learning_content_id_counter' });

module.exports = mongoose.model('LearningContent', learningContentSchema); 