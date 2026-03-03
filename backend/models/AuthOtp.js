const mongoose = require('mongoose');

const AuthOtpSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true
    },
    purpose: {
        type: String,
        enum: ['EMAIL_VERIFICATION', 'PASSWORD_RESET'],
        required: true,
        index: true
    },
    otpHash: {
        type: String,
        required: true,
        select: false
    },
    expiresAt: {
        type: Date,
        required: true
    },
    consumedAt: {
        type: Date,
        default: null
    },
    attempts: {
        type: Number,
        default: 0
    },
    maxAttempts: {
        type: Number,
        default: 5
    },
    lastSentAt: {
        type: Date,
        default: Date.now
    },
    requestedFromIp: {
        type: String,
        default: ''
    },
    requestedFromUserAgent: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

AuthOtpSchema.index({ email: 1, purpose: 1, consumedAt: 1 });
AuthOtpSchema.index({ user: 1, purpose: 1, consumedAt: 1 });
AuthOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AuthOtp', AuthOtpSchema);

