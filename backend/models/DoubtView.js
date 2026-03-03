const mongoose = require('mongoose');

const DoubtViewSchema = new mongoose.Schema({
    doubt: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doubt',
        required: true
    },
    viewerUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Start timestamp of the 24h counting window bucket.
    windowStartAt: {
        type: Date,
        required: true
    },
    viewedAt: {
        type: Date,
        default: Date.now
    }
});

// One counted view per user per post per 24h bucket.
DoubtViewSchema.index({ doubt: 1, viewerUser: 1, windowStartAt: 1 }, { unique: true });
DoubtViewSchema.index({ doubt: 1, windowStartAt: -1 });
DoubtViewSchema.index({ viewerUser: 1, viewedAt: -1 });

module.exports = mongoose.model('DoubtView', DoubtViewSchema);
