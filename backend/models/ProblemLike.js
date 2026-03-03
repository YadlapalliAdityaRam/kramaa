const mongoose = require('mongoose');

const ProblemLikeSchema = new mongoose.Schema({
    problem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reactionType: {
        type: String,
        enum: ['like', 'dislike'],
        default: 'like'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// One reaction per user per problem (user can only have one like OR dislike)
ProblemLikeSchema.index({ problem: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('ProblemLike', ProblemLikeSchema);
