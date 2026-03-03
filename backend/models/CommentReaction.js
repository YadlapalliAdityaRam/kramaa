const mongoose = require('mongoose');

const CommentReactionSchema = new mongoose.Schema({
    comment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doubt',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['like', 'dislike'],
        default: 'like',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// One like per user per comment
CommentReactionSchema.index({ comment: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('CommentReaction', CommentReactionSchema);
