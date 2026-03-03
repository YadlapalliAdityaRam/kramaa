const mongoose = require('mongoose');

const ValidationJobSchema = new mongoose.Schema({
    problemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
        required: true
    },
    status: {
        type: String,
        enum: ['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED_INTERNAL'],
        default: 'QUEUED'
    },
    result: {
        type: String,
        enum: ['PENDING', 'PASSED', 'FAILED'],
        default: 'PENDING'
    },
    logs: [{
        type: String
    }],
    failureReason: {
        type: String
    },
    startedAt: {
        type: Date
    },
    finishedAt: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ValidationJob', ValidationJobSchema);
