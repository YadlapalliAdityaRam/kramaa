const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    coverPhoto: {
        type: String,
        default: 'default-cover.jpg'
    },
    bio: {
        type: String,
        maxlength: 500,
        trim: true
    },
    title: {
        type: String,
        maxlength: 100,
        trim: true,
        default: 'Coder'
    },
    website: {
        type: String,
        trim: true
    },
    location: {
        country: { type: String, trim: true },
        state: { type: String, trim: true },
        timezone: { type: String, trim: true }
    },
    experienceLevel: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        default: 'Beginner'
    },
    social: {
        github: { type: String, trim: true },
        linkedin: { type: String, trim: true },
        twitter: { type: String, trim: true },
        portfolio: { type: String, trim: true },
        leetcode: { type: String, trim: true },
        codeforces: { type: String, trim: true }
    },
    educationDetails: {
        college: { type: String, trim: true },
        degree: { type: String, trim: true },
        branch: { type: String, trim: true },
        yearOfStudy: { type: String, trim: true },
        graduationYear: { type: String, trim: true }
    },
    // Legacy education array (kept for backward compatibility or multiple entries)
    education: [{
        school: { type: String, required: true },
        degree: { type: String },
        fieldOfStudy: { type: String },
        from: { type: Date },
        to: { type: Date },
        current: { type: Boolean, default: false }
    }],
    skills: [{
        type: String,
        trim: true
    }],
    preferences: {
        preferredLanguage: { type: String, default: 'javascript' },
        isPublic: { type: Boolean, default: true },
        showActivity: { type: Boolean, default: true },
        showSubmissions: { type: Boolean, default: true },
        showRating: { type: Boolean, default: true },
        showCalendar: { type: Boolean, default: true },
        allowMessages: { type: Boolean, default: true },
        showEmail: { type: Boolean, default: false }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Profile', ProfileSchema);
