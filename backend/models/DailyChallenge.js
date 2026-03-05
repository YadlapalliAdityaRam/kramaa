const mongoose = require('mongoose');

const DAILY_CHALLENGE_SOURCES = Object.freeze({
    ADMIN: 'ADMIN',
    SYSTEM: 'SYSTEM'
});

const DailyChallengeSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    dateKey: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    problem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
        required: true,
        index: true
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        required: true
    },
    expectedDifficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        required: true
    },
    source: {
        type: String,
        enum: Object.values(DAILY_CHALLENGE_SOURCES),
        default: DAILY_CHALLENGE_SOURCES.SYSTEM,
        index: true
    },
    scheduledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    overrideRepeatedProblem: {
        type: Boolean,
        default: false
    },
    overrideDifficultyPattern: {
        type: Boolean,
        default: false
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 500,
        default: ''
    }
}, {
    timestamps: true
});

DailyChallengeSchema.index({ date: 1 }, { unique: true });
DailyChallengeSchema.index({ source: 1, date: 1 });
DailyChallengeSchema.index({ problem: 1, date: -1 });

DailyChallengeSchema.statics.DAILY_CHALLENGE_SOURCES = DAILY_CHALLENGE_SOURCES;

module.exports = mongoose.model('DailyChallenge', DailyChallengeSchema);
