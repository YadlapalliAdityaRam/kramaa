const mongoose = require('mongoose');

const ContestParticipantSchema = new mongoose.Schema({
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
    score: {
        type: Number,
        default: 0,
        min: 0
    },
    solvedCount: {
        type: Number,
        default: 0,
        min: 0
    },
    totalTime: {
        type: Number,
        default: 0,
        min: 0
    },
    penalty: {
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
    lastSubmissionTime: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['active', 'exited', 'finished'],
        default: 'active',
        index: true
    },
    lockNewSubmissions: {
        type: Boolean,
        default: false
    },
    lastActiveAt: {
        type: Date,
        default: Date.now
    },
    exitTime: {
        type: Date,
        default: null
    },
    exitReason: {
        type: String,
        default: ''
    },
    rejoinCount: {
        type: Number,
        default: 0,
        min: 0
    },
    finishedAt: {
        type: Date,
        default: null
    },
    registeredAt: {
        type: Date,
        default: Date.now
    },
    solvedProblemIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem'
    }]
}, {
    timestamps: false
});

ContestParticipantSchema.index({ contestId: 1, userId: 1 }, { unique: true });
ContestParticipantSchema.index({ contestId: 1, status: 1 });
ContestParticipantSchema.index({ contestId: 1, score: -1, totalTime: 1, wrongSubmissions: 1, lastSubmissionTime: 1 });

module.exports = mongoose.model('ContestParticipant', ContestParticipantSchema);
