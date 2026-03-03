const mongoose = require('mongoose');

const LoginHistorySchema = new mongoose.Schema({
    ip: {
        type: String,
        default: 'UNKNOWN'
    },
    device: {
        type: String,
        default: 'UNKNOWN'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const ActionPerformedSchema = new mongoose.Schema({
    actionType: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    targetId: {
        type: String,
        default: null
    },
    targetType: {
        type: String,
        default: 'SYSTEM'
    },
    ip: {
        type: String,
        default: 'UNKNOWN'
    },
    device: {
        type: String,
        default: 'UNKNOWN'
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const SuperAdminSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    fullName: {
        type: String,
        trim: true,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true,
        default: ''
    },
    profileImage: {
        type: String,
        default: ''
    },
    role: {
        type: String,
        enum: ['USER', 'ADMIN', 'SUPER_ADMIN'],
        default: 'SUPER_ADMIN'
    },
    permissions: {
        type: [String],
        default: ['ALL']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    loginHistory: {
        type: [LoginHistorySchema],
        default: []
    },
    actionsPerformed: {
        type: [ActionPerformedSchema],
        default: []
    }
}, {
    timestamps: true
});

SuperAdminSchema.index({ role: 1, isActive: 1 });
SuperAdminSchema.index({ 'actionsPerformed.actionType': 1, 'actionsPerformed.timestamp': -1 });
SuperAdminSchema.index({ 'actionsPerformed.timestamp': -1 });
SuperAdminSchema.index({ 'loginHistory.timestamp': -1 });

module.exports = mongoose.model('SuperAdmin', SuperAdminSchema);
