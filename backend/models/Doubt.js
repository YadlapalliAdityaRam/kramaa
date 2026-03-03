const mongoose = require('mongoose');

const DoubtSchema = new mongoose.Schema({
    problem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
        required: false // Optional now for general threads
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        trim: true,
        maxlength: 200
    },
    category: {
        type: String,
        enum: ['Problem', 'General', 'Interview', 'Career', 'Showcase', 'Official'],
        default: 'Problem'
    },
    tags: [{
        type: String,
        trim: true
    }],
    content: {
        type: String,
        required: true,
        maxlength: 5000 // Increased limit
    },
    imageUrl: {
        type: String,
        default: null
    },
    views: {
        type: Number,
        default: 0
    },
    viewedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doubt',
        default: null
    },
    depth: {
        type: Number,
        default: 0,
        max: 2 // 0, 1, 2 = 3 levels max
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    isHidden: {
        type: Boolean,
        default: false
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    likesCount: {
        type: Number,
        default: 0
    },
    dislikesCount: {
        type: Number,
        default: 0
    },
    repliesCount: {
        type: Number,
        default: 0
    },
    reportCount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: null
    }
});

// Indexes for performance
DoubtSchema.index({ problem: 1, parentComment: 1, createdAt: -1 });
DoubtSchema.index({ parentComment: 1 });
DoubtSchema.index({ problem: 1, createdAt: -1 });
DoubtSchema.index({ problem: 1, likesCount: -1 });

module.exports = mongoose.model('Doubt', DoubtSchema);
