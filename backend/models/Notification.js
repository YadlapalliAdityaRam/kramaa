const mongoose = require('mongoose');

const NOTIFICATION_TYPES = ['contest', 'reply', 'like', 'submission', 'system', 'achievement', 'message'];

const NotificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: NOTIFICATION_TYPES,
        required: true,
        default: 'system'
    },
    title: {
        type: String,
        required: true,
        maxlength: 200
    },
    message: {
        type: String,
        default: '',
        maxlength: 500
    },
    link: {
        type: String,
        default: ''
    },
    icon: {
        type: String,
        default: '🔔'
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: false
});

// Compound index for efficient queries
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });

// TTL index — auto-delete after 90 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

NotificationSchema.statics.NOTIFICATION_TYPES = NOTIFICATION_TYPES;

module.exports = mongoose.model('Notification', NotificationSchema);
