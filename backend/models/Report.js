const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    reporterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reportedUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // May be empty if reporting content by a deleted user
    },
    contentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true // Can be a User, Doubt, Solution, or Submission ID
    },
    contentType: {
        type: String,
        enum: ['Profile', 'Doubt', 'Solution', 'Submission'],
        required: true
    },
    reason: {
        type: String,
        enum: ['Spam', 'Harassment', 'Inappropriate Content', 'Plagiarism', 'Incorrect Solution', 'Cheating', 'Other'],
        required: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'resolved', 'rejected', 'action_taken'],
        default: 'pending'
    },
    actionTaken: {
        type: String,
        enum: ['none', 'review', 'mark_safe', 'dismiss', 'warn', 'remove_content', 'temp_suspend', 'permanent_ban', 'delete_user'],
        default: 'none'
    },
    adminNotes: {
        type: String,
        trim: true
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// One report per user per content
ReportSchema.index({ reporterId: 1, contentId: 1, contentType: 1 }, { unique: true });

// For admin dashboard performance
ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ contentType: 1, status: 1 });

module.exports = mongoose.model('Report', ReportSchema);
