const mongoose = require('mongoose');

const TestcaseGeneratorSchema = new mongoose.Schema({
    problemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
        required: true,
        unique: true // One generator per problem for now
    },
    language: {
        type: String,
        required: true,
        enum: ['javascript', 'python', 'java', 'cpp', 'c']
    },
    generatorCode: {
        type: String,
        required: true
    },
    constraints: {
        maxN: { type: Number },
        maxValue: { type: Number },
        // Flexible for other constraints
        custom: { type: mongoose.Schema.Types.Mixed }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('TestcaseGenerator', TestcaseGeneratorSchema);
