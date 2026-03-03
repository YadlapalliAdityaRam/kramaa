const mongoose = require('mongoose');

const SolutionSchema = new mongoose.Schema({
    problemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
        required: true
    },
    solutionType: {
        type: String,
        enum: ['REFERENCE', 'BRUTE_FORCE', 'WRONG'],
        required: true
    },
    language: {
        type: String,
        required: true,
        enum: ['javascript', 'python', 'java', 'cpp', 'c']
    },
    sourceCode: {
        type: String,
        required: true
    },
    // Optional: store compilation/execution performance metrics if needed later
    lastValidationRequest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ValidationJob'
    },
    isHidden: {
        type: Boolean,
        default: false
    },
    reportCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Ensure only one solution of each type per problem (or allow multiple? User req implies single Reference)
// User requirements didn't specify, but typically there's ONE reference.
// But there could be multiple WRONG solutions.
// Let's enforce unique Reference per problem.
SolutionSchema.index({ problemId: 1, solutionType: 1 }, { unique: true, partialFilterExpression: { solutionType: 'REFERENCE' } });

module.exports = mongoose.model('Solution', SolutionSchema);
