const mongoose = require('mongoose');

const UserAnalyticsSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    // Map of Language -> Stats
    // e.g., "javascript": { solved: 10, attempted: 12, avgRuntime: 50.5 }
    languageStats: {
        type: Map,
        of: new mongoose.Schema({
            solved: { type: Number, default: 0 },
            attempted: { type: Number, default: 0 },
            avgRuntime: { type: Number, default: 0 }, // ms
            avgMemory: { type: Number, default: 0 } // MB
        }, { _id: false }),
        default: {}
    },
    // Map of Tag -> Stats
    // e.g., "Dynamic Programming": { solved: 2, attempted: 5, efficiency: 0.4 }
    tagStats: {
        type: Map,
        of: new mongoose.Schema({
            solved: { type: Number, default: 0 },
            attempted: { type: Number, default: 0 },
            avgTimeTaken: { type: Number, default: 0 }, // seconds (time spent before submit)
            efficiency: { type: Number, default: 0 } // calculated metric
        }, { _id: false }),
        default: {}
    },
    // Pattern Recognition
    insights: {
        weakTopics: [{ type: String }],
        strongTopics: [{ type: String }],
        overconfidenceScore: { type: Number, default: 0 }, // Derived from high failures with low time
        consistencyScore: { type: Number, default: 0 },
        learnerType: {
            type: String,
            enum: ['Unclassified', 'Analytical', 'Brute Force', 'Balanced', 'Sprinter'],
            default: 'Unclassified'
        }
    },
    // Heatmap / Daily Activity (Compact storage)
    // Map DateString (YYYY-MM-DD) -> Count
    heatmap: {
        type: Map,
        of: Number,
        default: {}
    },
    lastCalculated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('UserAnalytics', UserAnalyticsSchema);
