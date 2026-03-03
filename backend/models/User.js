const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        default: 'default-avatar.png'
    },
    level: {
        type: Number,
        default: 1
    },
    xp: {
        type: Number,
        default: 0
    },
    streak: {
        current: { type: Number, default: 0 },
        longest: { type: Number, default: 0 },
        lastActive: { type: Date }
    },
    stats: {
        totalProblems: { type: Number, default: 0 },
        easySolved: { type: Number, default: 0 },
        mediumSolved: { type: Number, default: 0 },
        hardSolved: { type: Number, default: 0 },
        totalSubmissions: { type: Number, default: 0 },
        acceptedSubmissions: { type: Number, default: 0 }
    },
    totalSolvedEasy: {
        type: Number,
        default: 0
    },
    totalSolvedMedium: {
        type: Number,
        default: 0
    },
    totalSolvedHard: {
        type: Number,
        default: 0
    },
    problemAcceptanceRate: {
        type: Number,
        default: 0
    },
    finalScore: {
        type: Number,
        default: 0
    },
    globalRank: {
        type: Number,
        default: null
    },
    badges: [{
        id: { type: String, required: true },
        name: String,
        description: String,
        icon: String,
        tier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'bronze' },
        earnedAt: { type: Date, default: Date.now }
    }],
    rating: {
        current: { type: Number, default: 1200 },
        highest: { type: Number, default: 1200 },
        history: [{
            date: { type: Date, default: Date.now },
            rating: Number,
            contestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contest' },
            change: Number
        }]
    },
    contestStats: {
        participated: { type: Number, default: 0 },
        bestRank: { type: Number, default: null },
        totalScore: { type: Number, default: 0 }
    },
    performanceStats: {
        avgRuntime: { type: Number, default: 0 },
        avgMemory: { type: Number, default: 0 },
        fastestRuntime: { type: Number, default: null },
        fastestSubmission: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission' }
    },
    bookmarkedProblems: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem'
    }],
    savedDoubts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doubt'
    }],
    solvedProblems: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem'
    }],
    isVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationRequired: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: {
        type: String,
        select: false
    },
    emailVerificationExpires: {
        type: Date,
        select: false
    },
    // isActive: { type: Boolean, default: true }, // Deprecated in favor of accountStatus
    role: {
        type: String,
        enum: ['USER', 'ADMIN', 'SUPER_ADMIN'],
        default: 'USER'
    },
    adminRole: {
        type: String,
        enum: ['ADMIN', 'SUPER_ADMIN', 'PROBLEM_ADMIN', 'USER_ADMIN', 'MODERATOR'],
        default: null
    },
    adminId: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    adminPermissions: {
        type: Map,
        of: Boolean,
        default: undefined
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    loginHistory: [{
        ip: {
            type: String,
            default: ''
        },
        device: {
            type: String,
            default: 'Unknown device'
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    failedLoginAttempts: {
        type: Number,
        default: 0
    },
    lastFailedLoginAt: {
        type: Date
    },
    sessionInvalidatedAt: {
        type: Date
    },
    // New Fields
    fullName: {
        type: String,
        trim: true,
        maxlength: 50
    },
    phoneNumber: {
        type: String,
        trim: true
    },
    accountStatus: {
        type: String,
        enum: ['Active', 'Suspended', 'Deleted'],
        default: 'Active'
    },
    lastLogin: {
        type: Date
    },
    invitationToken: {
        type: String,
        select: false
    },
    invitationExpires: {
        type: Date,
        select: false
    },
    passwordResetTokenHash: {
        type: String,
        select: false
    },
    passwordResetTokenExpires: {
        type: Date,
        select: false
    },
    resetOtp: {
        type: String,
        select: false
    },
    resetOtpExpiry: {
        type: Date,
        select: false
    },
    resetOtpAttempts: {
        type: Number,
        default: 0,
        select: false
    },
    resetOtpVerifiedAt: {
        type: Date,
        select: false
    }
}, {
    timestamps: true
});

// Hash password before saving
// Hash password before saving
UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.index({
    role: 1,
    accountStatus: 1,
    finalScore: -1,
    totalSolvedHard: -1,
    problemAcceptanceRate: -1,
    createdAt: 1
});

UserSchema.index({ role: 1, accountStatus: 1, globalRank: 1 });
UserSchema.index({ email: 1, resetOtpExpiry: 1 });

module.exports = mongoose.model('User', UserSchema);
