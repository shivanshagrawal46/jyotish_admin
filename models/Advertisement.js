const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;
const deepLinkSchema = require('./schemas/deepLink');
const { PLACEMENT_TYPES } = require('../services/adPlacements');

// One section = one banner/slide inside an advertisement. It can point at any
// content item in the app (via deepLink, same format as notifications), at an
// external URL, or at nothing.
const adSectionSchema = new mongoose.Schema({
    title:    { type: String, trim: true, default: '' },
    subtitle: { type: String, trim: true, default: '' },
    imageUrl: { type: String, default: null },
    linkType: { type: String, enum: ['content', 'url', 'none'], default: 'none' },
    // Used when linkType === 'url'
    actionUrl: { type: String, default: null },
    // Used when linkType === 'content'
    deepLink: { type: deepLinkSchema, default: null },
    position: { type: Number, default: 0 },
    clickCount: { type: Number, default: 0 }
});

const advertisementSchema = new mongoose.Schema({
    // Where in the app this advertisement shows. Exactly one ad per placement.
    // Fixed keys: kundli, kundli_match, panchang, karmkand, book, rashifal,
    // numerology, emagazine. Kosh: one per sub category → 'kosh_sub:<subCategoryId>'.
    placement: { type: String, required: true, unique: true, trim: true },
    placementType: { type: String, enum: PLACEMENT_TYPES, required: true },
    // Kosh sub category id when placementType === 'kosh_sub'
    placementRef: { type: ObjectId, ref: 'KoshSubCategory', default: null },
    placementLabel: { type: String, default: '' },

    // Internal name shown in admin
    title: { type: String, required: true, trim: true },

    sections: { type: [adSectionSchema], default: [] },

    isActive: { type: Boolean, default: true },
    startsAt: { type: Date, default: null },
    endsAt:   { type: Date, default: null },

    impressionCount: { type: Number, default: 0 },
    createdBy: { type: ObjectId, ref: 'User', default: null }
}, { timestamps: true });

advertisementSchema.index({ isActive: 1, startsAt: 1, endsAt: 1 });
advertisementSchema.index({ placementType: 1 });

module.exports = mongoose.model('Advertisement', advertisementSchema);
