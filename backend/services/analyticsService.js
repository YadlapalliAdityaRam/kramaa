const User = require('../models/User');
const UserAnalytics = require('../models/UserAnalytics');
const ActivityLog = require('../models/ActivityLog');
const Submission = require('../models/Submission');
const Profile = require('../models/Profile');
const badgeService = require('./badgeService');

class AnalyticsService {

    // 1. Core hook called after submission
    async processSubmission(userId, submissionId) {
        try {
            const submission = await Submission.findById(submissionId).populate('problem');
            if (!submission) return;

            // A. Update Streak
            await this.updateUserStats(userId, submission);

            // B. Update Activity Log
            await this.logActivity(userId, 'SUBMISSION', {
                submissionId,
                problemId: submission.problem._id,
                status: submission.status
            });

            // C. Update Deep Analytics (Language, Tags, Heatmap, Insights)
            await this.recalculateDeepAnalytics(userId);

            // D. Update Performance Stats (Avg Runtime, Memory, Fastest)
            await this.updatePerformanceStats(userId);

            // E. Check & Award Badges
            await badgeService.checkAndAward(userId, submission);

        } catch (error) {
            console.error(`Analytics Error for user ${userId}:`, error);
        }
    }

    // 2. Update User Model (Streak Only - stats are handled in submissionController transaction)
    async updateUserStats(userId, submission) {
        const user = await User.findById(userId);
        if (!user) return;

        // Streak Logic (only thing not handled by the controller)
        const today = new Date().setHours(0, 0, 0, 0);
        const lastActive = user.streak.lastActive ? new Date(user.streak.lastActive).setHours(0, 0, 0, 0) : null;

        if (lastActive !== today) {
            const oneDayMs = 24 * 60 * 60 * 1000;
            if (lastActive && (today - lastActive === oneDayMs)) {
                user.streak.current += 1;
            } else if (lastActive && (today - lastActive > oneDayMs)) {
                user.streak.current = 1;
            } else if (!lastActive) {
                user.streak.current = 1;
            }

            user.streak.lastActive = new Date();
            if (user.streak.current > user.streak.longest) {
                user.streak.longest = user.streak.current;
            }
        }

        await user.save();
    }

    // 3. Deep Analytics (Language, Tags, Insights)
    async recalculateDeepAnalytics(userId) {
        let analytics = await UserAnalytics.findOne({ user: userId });
        if (!analytics) {
            analytics = new UserAnalytics({ user: userId });
        }

        // Fetch all submissions for aggregation
        const submissions = await Submission.find({ user: userId }).populate('problem');

        // Reset stats containers
        const langStats = {};
        const tagStats = {};
        const heatmap = {}; // Map of "YYYY-MM-DD" -> count

        submissions.forEach(sub => {
            // Heatmap
            const dateParams = new Date(sub.createdAt).toISOString().split('T')[0];
            heatmap[dateParams] = (heatmap[dateParams] || 0) + 1;

            // Language Stats
            if (!langStats[sub.language]) {
                langStats[sub.language] = { solved: 0, attempted: 0, totalRuntime: 0, countRuntime: 0, totalMemory: 0, countMemory: 0 };
            }
            langStats[sub.language].attempted += 1;
            if (sub.status === 'accepted') {
                langStats[sub.language].solved += 1;
                if (sub.runtime) {
                    langStats[sub.language].totalRuntime += sub.runtime;
                    langStats[sub.language].countRuntime += 1;
                }
                if (sub.memory) {
                    langStats[sub.language].totalMemory += sub.memory;
                    langStats[sub.language].countMemory += 1;
                }
            }

            // Tag Stats
            if (sub.problem && sub.problem.topics) {
                sub.problem.topics.forEach(tag => {
                    if (!tagStats[tag]) {
                        tagStats[tag] = { solved: 0, attempted: 0, totalTime: 0, failures: 0 };
                    }
                    tagStats[tag].attempted += 1;
                    if (sub.status === 'accepted') {
                        tagStats[tag].solved += 1;
                    } else {
                        tagStats[tag].failures += 1;
                    }
                });
            }
        });

        // Transform Language Stats for Schema
        analytics.languageStats = {};
        for (const [lang, data] of Object.entries(langStats)) {
            analytics.languageStats.set(lang, {
                solved: data.solved,
                attempted: data.attempted,
                avgRuntime: data.countRuntime ? (data.totalRuntime / data.countRuntime) : 0,
                avgMemory: data.countMemory ? (data.totalMemory / data.countMemory) : 0
            });
        }

        // Transform Tag Stats & Calculate Weakness
        analytics.tagStats = {};
        const weakTopics = [];
        const strongTopics = [];

        for (const [tag, data] of Object.entries(tagStats)) {
            const efficiency = data.attempted ? (data.solved / data.attempted) : 0;

            analytics.tagStats.set(tag, {
                solved: data.solved,
                attempted: data.attempted,
                efficiency: efficiency
            });

            if (data.attempted >= 5) {
                if (efficiency < 0.4) weakTopics.push(tag);
                if (efficiency > 0.8) strongTopics.push(tag);
            }
        }

        // Update Insights
        analytics.insights.weakTopics = weakTopics;
        analytics.insights.strongTopics = strongTopics;

        // Consistency score: submissions in last 30 days / 30
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentDays = Object.keys(heatmap).filter(d => new Date(d) >= thirtyDaysAgo).length;
        analytics.insights.consistencyScore = Math.round((recentDays / 30) * 100);

        // Update Heatmap
        analytics.heatmap = new Map(Object.entries(heatmap));
        analytics.lastCalculated = new Date();

        await analytics.save();

        // Check polyglot badge
        await badgeService.checkLanguageBadge(userId, langStats);
    }

    // 4. Performance Stats Aggregation
    async updatePerformanceStats(userId) {
        try {
            const acceptedSubs = await Submission.find({
                user: userId,
                status: 'accepted',
                runtime: { $exists: true, $gt: 0 }
            }).select('runtime memory').sort({ runtime: 1 });

            if (acceptedSubs.length === 0) return;

            const totalRuntime = acceptedSubs.reduce((sum, s) => sum + (s.runtime || 0), 0);
            const totalMemory = acceptedSubs.reduce((sum, s) => sum + (s.memory || 0), 0);
            const fastest = acceptedSubs[0];

            await User.findByIdAndUpdate(userId, {
                'performanceStats.avgRuntime': Math.round((totalRuntime / acceptedSubs.length) * 100) / 100,
                'performanceStats.avgMemory': Math.round((totalMemory / acceptedSubs.length) * 100) / 100,
                'performanceStats.fastestRuntime': fastest.runtime,
                'performanceStats.fastestSubmission': fastest._id
            });

        } catch (error) {
            console.error('Performance Stats Error:', error);
        }
    }

    async logActivity(userId, action, metadata = {}) {
        await ActivityLog.create({
            user: userId,
            action,
            metadata
        });
    }
}

module.exports = new AnalyticsService();
