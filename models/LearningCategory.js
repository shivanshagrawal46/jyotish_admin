const mongoose = require('mongoose');
const mongooseSequence = require('mongoose-sequence')(mongoose);

const learningCategorySchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true
    },
    name: {
        type: String,
        required: true,
        unique: true
    },
    fee: {
        type: Number,
        required: true
    },
    plan: {
        type: String,
        required: true
    },
    demo: {
        type: String,
        required: true
    },
    introduction: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    position: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

learningCategorySchema.plugin(mongooseSequence, { inc_field: 'id', id: 'learning_category_id_counter' });

module.exports = mongoose.model('LearningCategory', learningCategorySchema); 