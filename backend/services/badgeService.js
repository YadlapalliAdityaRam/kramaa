const User = require('../models/User');

// Badge Definitions
const BADGE_DEFS = {
    // Streak badges
    streak_7: { name: '7-Day Streak', description: 'Maintain a 7-day coding streak', icon: '🔥', tier: 'bronze' },
    streak_30: { name: '30-Day Streak', description: 'Maintain a 30-day coding streak', icon: '🔥', tier: 'silver' },
    streak_100: { name: '100-Day Streak', description: 'Maintain a 100-day coding streak', icon: '🔥', tier: 'gold' },

    // Solved counts
    solved_1: { name: 'First Blood', description: 'Solve your first problem', icon: '🎯', tier: 'bronze' },
    solved_10: { name: 'Getting Serious', description: 'Solve 10 problems', icon: '💯', tier: 'bronze' },
    solved_50: { name: 'Problem Crusher', description: 'Solve 50 problems', icon: '💯', tier: 'silver' },
    solved_100: { name: 'Century Club', description: 'Solve 100 problems', icon: '💯', tier: 'gold' },
    solved_500: { name: 'Legend', description: 'Solve 500 problems', icon: '💯', tier: 'platinum' },

    // Difficulty
    first_easy: { name: 'Easy Peasy', description: 'Solve your first Easy problem', icon: '🟢', tier: 'bronze' },
    first_medium: { name: 'Stepping Up', description: 'Solve your first Medium problem', icon: '🟡', tier: 'bronze' },
    first_hard: { name: 'Brain Buster', description: 'Solve your first Hard problem', icon: '🧠', tier: 'silver' },
    hard_10: { name: 'Hard Mode Master', description: 'Solve 10 Hard problems', icon: '🧠', tier: 'gold' },

    // Submissions
    submissions_50: { name: 'Persistent', description: 'Make 50 submissions', icon: '🚀', tier: 'bronze' },
    submissions_200: { name: 'Relentless', description: 'Make 200 submissions', icon: '🚀', tier: 'silver' },
    submissions_1000: { name: 'Machine', description: 'Make 1000 submissions', icon: '🚀', tier: 'gold' },

    // Performance
    speed_demon: { name: 'Speed Demon', description: 'Solve a problem in under 10ms runtime', icon: '⚡', tier: 'silver' },
    perfect_first: { name: 'First Try', description: 'Solve a problem on your first submission', icon: '🎯', tier: 'silver' },

    // Contest
    contest_first: { name: 'Competitor', description: 'Participate in your first contest', icon: '🏅', tier: 'bronze' },
    contest_top3: { name: 'Podium Finish', description: 'Finish top 3 in a contest', icon: '🏆', tier: 'gold' },
    contest_winner: { name: 'Champion', description: 'Win a contest', icon: '🏆', tier: 'platinum' },

    // Acceptance rate
    acc_rate_80: { name: 'Sharpshooter', description: 'Achieve 80% acceptance rate (min 20 subs)', icon: '🎯', tier: 'silver' },
    acc_rate_95: { name: 'Perfectionist', description: 'Achieve 95% acceptance rate (min 50 subs)', icon: '🎯', tier: 'gold' },

    // Language mastery
    polyglot: { name: 'Polyglot', description: 'Solve problems in 3+ languages', icon: '🌐', tier: 'silver' },
};

class BadgeService {

    /**
     * Check all badge conditions and award any newly earned ones.
     * Called after each submission from analyticsService.
     */
    async checkAndAward(userId, submission) {
        try {
            const user = await User.findById(userId);
            if (!user) return [];

            const earnedIds = new Set(user.badges.map(b => b.id));
            const newBadges = [];

            const award = (badgeId) => {
                if (!earnedIds.has(badgeId) && BADGE_DEFS[badgeId]) {
                    const def = BADGE_DEFS[badgeId];
                    newBadges.push({
                        id: badgeId,
                        name: def.name,
                        description: def.description,
                        icon: def.icon,
                        tier: def.tier,
                        earnedAt: new Date()
                    });
                    earnedIds.add(badgeId);
                }
            };

            const stats = user.stats;
            const totalSolved = stats.totalProblems;

            // --- Streak Badges ---
            if (user.streak.current >= 7) award('streak_7');
            if (user.streak.current >= 30) award('streak_30');
            if (user.streak.current >= 100) award('streak_100');

            // --- Solved Count Badges ---
            if (totalSolved >= 1) award('solved_1');
            if (totalSolved >= 10) award('solved_10');
            if (totalSolved >= 50) award('solved_50');
            if (totalSolved >= 100) award('solved_100');
            if (totalSolved >= 500) award('solved_500');

            // --- Difficulty Badges ---
            if (stats.easySolved >= 1) award('first_easy');
            if (stats.mediumSolved >= 1) award('first_medium');
            if (stats.hardSolved >= 1) award('first_hard');
            if (stats.hardSolved >= 10) award('hard_10');

            // --- Submission Count Badges ---
            if (stats.totalSubmissions >= 50) award('submissions_50');
            if (stats.totalSubmissions >= 200) award('submissions_200');
            if (stats.totalSubmissions >= 1000) award('submissions_1000');

            // --- Performance Badges ---
            if (submission && submission.status === 'accepted') {
                if (submission.runtime && submission.runtime < 10) {
                    award('speed_demon');
                }

                // First try: check if no previous submissions exist for this problem
                const Submission = require('../models/Submission');
                const prevCount = await Submission.countDocuments({
                    user: userId,
                    problem: submission.problem._id || submission.problem,
                    _id: { $ne: submission._id }
                });
                if (prevCount === 0) {
                    award('perfect_first');
                }
            }

            // --- Acceptance Rate Badges ---
            if (stats.totalSubmissions >= 20) {
                const rate = stats.acceptedSubmissions / stats.totalSubmissions;
                if (rate >= 0.80) award('acc_rate_80');
                if (stats.totalSubmissions >= 50 && rate >= 0.95) award('acc_rate_95');
            }

            // --- Save if new badges earned ---
            if (newBadges.length > 0) {
                await User.findByIdAndUpdate(userId, {
                    $push: { badges: { $each: newBadges } }
                });
            }

            return newBadges;

        } catch (error) {
            console.error('Badge Service Error:', error);
            return [];
        }
    }

    /**
     * Check contest-related badges after a contest ends.
     */
    async checkContestBadges(userId, rank, totalParticipants) {
        try {
            const user = await User.findById(userId);
            if (!user) return;

            const earnedIds = new Set(user.badges.map(b => b.id));
            const newBadges = [];

            const award = (badgeId) => {
                if (!earnedIds.has(badgeId) && BADGE_DEFS[badgeId]) {
                    const def = BADGE_DEFS[badgeId];
                    newBadges.push({ id: badgeId, name: def.name, description: def.description, icon: def.icon, tier: def.tier, earnedAt: new Date() });
                }
            };

            award('contest_first');
            if (rank <= 3) award('contest_top3');
            if (rank === 1) award('contest_winner');

            if (newBadges.length > 0) {
                await User.findByIdAndUpdate(userId, {
                    $push: { badges: { $each: newBadges } }
                });
            }
        } catch (error) {
            console.error('Contest Badge Error:', error);
        }
    }

    /**
     * Check polyglot badge (3+ languages)
     */
    async checkLanguageBadge(userId, languageStats) {
        try {
            if (!languageStats) return;
            const langsUsed = Object.keys(languageStats).filter(l => languageStats[l].solved > 0);
            if (langsUsed.length >= 3) {
                const user = await User.findById(userId);
                if (!user) return;
                const hasIt = user.badges.some(b => b.id === 'polyglot');
                if (!hasIt) {
                    await User.findByIdAndUpdate(userId, {
                        $push: { badges: { id: 'polyglot', ...BADGE_DEFS.polyglot, earnedAt: new Date() } }
                    });
                }
            }
        } catch (error) {
            console.error('Language Badge Error:', error);
        }
    }

    /**
     * Get all badge definitions (for showing locked badges on frontend)
     */
    getAllDefinitions() {
        return Object.entries(BADGE_DEFS).map(([id, def]) => ({ id, ...def }));
    }
}

module.exports = new BadgeService();
