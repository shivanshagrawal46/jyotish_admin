const mongoose = require('mongoose');

const bookContentSchema = new mongoose.Schema({
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BookCategory',
        required: true
    },
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BookName',
        required: true
    },
    chapter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BookChapter',
        required: true
    },
    title_hn: {
        type: String,
        required: true
    },
    title_en: {
        type: String,
        required: true
    },
    title_hinglish: {
        type: String,
        required: true
    },
    meaning: {
        type: String,
        required: true
    },
    details: {
        type: String,
        required: true
    },
    extra: {
        type: String
    },
    images: [{
        type: String
    }],
    video_links: [{
        type: String
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('BookContent', bookContentSchema); 