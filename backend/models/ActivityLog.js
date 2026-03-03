const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: ['LOGIN', 'SUBMISSION', 'CONTEST_JOIN', 'PROFILE_UPDATE', 'PROBLEM_VIEW', 'LOGOUT']
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed, // Flexible for different actions
        default: {}
    },
    ip: {
        type: String,
        select: false // Privacy
    },
    userAgent: {
        type: String,
        select: false
    }
}, {
    timestamps: true
});

// clean up logs older than 1 year automatically
ActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });
ActivityLogSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
