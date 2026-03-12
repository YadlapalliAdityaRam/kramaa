const mongoose = require('mongoose');

const ContestResultSchema = new mongoose.Schema({
    contestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contest',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    rank: {
        type: Number,
        default: null,
        min: 1
    },
    score: {
        type: Number,
        default: 0,
        min: 0
    },
    problemsSolved: {
        type: Number,
        default: 0,
        min: 0
    },
    totalTime: {
        type: Number,
        default: 0,
        min: 0
    },
    penaltyTime: {
        type: Number,
        default: 0,
        min: 0
    },
    wrongSubmissions: {
        type: Number,
        default: 0,
        min: 0
    },
    submissionCount: {
        type: Number,
        default: 0,
        min: 0
    },
    status: {
        type: String,
        enum: ['active', 'exited', 'finished'],
        default: 'active',
        index: true
    },
    source: {
        type: String,
        enum: ['system', 'admin'],
        default: 'system'
    },
    ratingChange: {
        type: Number,
        default: 0
    },
    exitTime: {
        type: Date,
        default: null
    },
    finalizedAt: {
        type: Date,
        default: null
    },
    profileSyncedAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: false
});

ContestResultSchema.pre('save', function updateTimestamp() {
    this.updatedAt = new Date();
});

ContestResultSchema.index({ contestId: 1, userId: 1 }, { unique: true });
ContestResultSchema.index({ contestId: 1, rank: 1 });
ContestResultSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('ContestResult', ContestResultSchema);
