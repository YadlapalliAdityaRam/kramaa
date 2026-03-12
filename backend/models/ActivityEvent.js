const mongoose = require('mongoose');

const ACTIVITY_TYPES = Object.freeze([
    'problem_solved',
    'daily_challenge_completed',
    'solution_posted',
    'discussion_created',
    'contest_joined',
    'contest_ranked',
    'contest_finished',
    'contest_exited'
]);

const ActivityEventSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    activityType: {
        type: String,
        enum: ACTIVITY_TYPES,
        required: true,
        index: true
    },
    problemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
        default: null
    },
    contestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contest',
        default: null
    },
    doubtId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doubt',
        default: null
    },
    solutionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Submission',
        default: null
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: false
});

ActivityEventSchema.index({ userId: 1, createdAt: -1 });
ActivityEventSchema.index({ activityType: 1, createdAt: -1 });

ActivityEventSchema.statics.ACTIVITY_TYPES = ACTIVITY_TYPES;

module.exports = mongoose.model('ActivityEvent', ActivityEventSchema);
