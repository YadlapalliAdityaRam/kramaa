const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    problem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
        required: true
    },
    contest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contest'
    },
    code: { type: String, required: true },
    language: { type: String, required: true },
    status: {
        type: String,
        enum: ['accepted', 'wrong_answer', 'time_limit_exceeded', 'runtime_error', 'compilation_error'],
        required: true
    },
    testCasesPassed: { type: Number, default: 0 },
    totalTestCases: { type: Number, required: true },
    runtime: Number,
    memory: Number,
    xpEarned: { type: Number, default: 0 },
    isFirstAccepted: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false },
    reportCount: { type: Number, default: 0 }
}, {
    timestamps: true
});

SubmissionSchema.index({ user: 1, problem: 1 });

module.exports = mongoose.model('Submission', SubmissionSchema);
