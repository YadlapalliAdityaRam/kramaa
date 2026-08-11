const mongoose = require('mongoose');

const MentorProgressSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    completedLessons: [{ type: String }],
    attemptedProblems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }],
    solvedProblems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }],
    practicedConcepts: [{ type: String }],
    hintsUsed: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('MentorProgress', MentorProgressSchema);
