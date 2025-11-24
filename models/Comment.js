const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const commentSchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true
    },
    userId: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    mobile: {
        type: String,
        required: true,
        trim: true
    },
    comment: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
}, {
    timestamps: true
});

commentSchema.plugin(AutoIncrement, { inc_field: 'id', id: 'comment_id_counter' });

module.exports = mongoose.model('Comment', commentSchema);

