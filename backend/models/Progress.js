const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    topic: {
        type: String,
        required: true
    },
    totalProblems: {
        type: Number,
        default: 0
    },
    solvedProblems: {
        type: Number,
        default: 0
    },
    masteryLevel: {
        type: Number,
        default: 0 // 0-100%
    }
}, { timestamps: true });

// Ensure user only has one progress entry per topic
ProgressSchema.index({ user: 1, topic: 1 }, { unique: true });

module.exports = mongoose.model('Progress', ProgressSchema);
