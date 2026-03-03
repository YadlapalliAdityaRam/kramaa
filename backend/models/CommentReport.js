const mongoose = require('mongoose');

const CommentReportSchema = new mongoose.Schema({
    comment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doubt',
        required: true
    },
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reason: {
        type: String,
        required: true,
        enum: ['spam', 'harassment', 'inappropriate', 'off-topic', 'other'],
        default: 'inappropriate'
    },
    details: {
        type: String,
        maxlength: 500
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'dismissed'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// One report per user per comment
CommentReportSchema.index({ comment: 1, reporter: 1 }, { unique: true });
CommentReportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('CommentReport', CommentReportSchema);
