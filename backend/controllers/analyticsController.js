const User = require('../models/User');
const Problem = require('../models/Problem');
const Contest = require('../models/Contest');
const { buildPublishedProblemMatch } = require('../utils/problemPublication');

const normalizeContestStatus = (status) => String(status || '').trim().toLowerCase();

const mapContestStatusToBucket = (status) => {
    const normalized = normalizeContestStatus(status);
    if (normalized === 'running' || normalized === 'active') return 'active';
    if (normalized === 'completed') return 'completed';
    if (normalized === 'upcoming' || normalized === 'scheduled') return 'scheduled';
    if (normalized === 'cancelled' || normalized === 'canceled' || normalized === 'rejected') return 'cancelled';
    return 'scheduled';
};

// Get list of admins with summary stats
exports.getAdminList = async (req, res) => {
    try {
        // 1. Find all users with role 'ADMIN'
        const admins = await User.find({ role: 'ADMIN' })
            .select('username email role createdAt isActive');

        // 2. Aggregate stats for each admin
        const adminStats = await Promise.all(admins.map(async (admin) => {
            const problemCount = await Problem.countDocuments(buildPublishedProblemMatch({ createdBy: admin._id }));
            const contestCount = await Contest.countDocuments({
                createdBy: admin._id,
                status: { $in: ['completed', 'COMPLETED'] }
            });

            return {
                _id: admin._id,
                username: admin.username,
                email: admin.email,
                createdAt: admin.createdAt,
                isActive: admin.isActive,
                totalProblems: problemCount,
                totalContests: contestCount
            };
        }));

        res.json({ success: true, admins: adminStats });
    } catch (error) {
        console.error('getAdminList error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch admin list' });
    }
};

// Get detailed analytics for a specific admin
exports.getAdminAnalytics = async (req, res) => {
    try {
        const { id } = req.params;
        const admin = await User.findById(id).select('username email role createdAt');

        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        // --- Problem Statistics ---
        const problems = await Problem.find(buildPublishedProblemMatch({ createdBy: id }))
            .select('title difficulty status isPublished approvalStatus createdAt');

        const problemStats = {
            total: problems.length,
            statusDistribution: {
                active: problems.length,
                pending: 0
            },
            difficultyDistribution: {
                easy: problems.filter(p => p.difficulty === 'Easy').length,
                medium: problems.filter(p => p.difficulty === 'Medium').length,
                hard: problems.filter(p => p.difficulty === 'Hard').length
            },
            list: problems
        };

        // --- Contest Statistics ---
        const contests = await Contest.find({ createdBy: id })
            .select('title startTime endTime status participantsCount approvalStatus createdAt')
            .lean();

        const statusDistribution = {
            active: 0,
            completed: 0,
            cancelled: 0,
            scheduled: 0
        };
        contests.forEach((contest) => {
            const bucket = mapContestStatusToBucket(contest.status);
            statusDistribution[bucket] += 1;
        });
        const completedContests = statusDistribution.completed;

        const contestStats = {
            total: contests.length,
            completed: completedContests,
            totalParticipants: contests.reduce((sum, c) => sum + Number(c.participantsCount || 0), 0),
            statusDistribution,
            list: contests.map((contest) => ({
                ...contest,
                participantCount: Number(contest.participantsCount || 0)
            }))
        };

        res.json({
            success: true,
            admin,
            problemStats,
            contestStats
        });

    } catch (error) {
        console.error('getAdminAnalytics error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch admin analytics' });
    }
};
