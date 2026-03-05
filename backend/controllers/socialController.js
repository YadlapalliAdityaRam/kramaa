const mongoose = require('mongoose');
const Follow = require('../models/Follow');
const Report = require('../models/Report');
const User = require('../models/User');
const {
    followUser,
    unfollowUser,
    getRelationship,
    getUserFollowCounts,
    listFollowers,
    listFollowing,
    getSuggestedUsers,
    getFriendsLeaderboard,
    removeFollowById,
    removeFollowsByFollower
} = require('../services/social/followService');
const {
    getFollowingActivityFeed,
    getDailyChallengeActivityForFollowing
} = require('../services/social/activityService');
const { getSocialConfig, updateSocialConfig } = require('../services/social/socialConfigService');

const toObjectId = (value) => {
    if (!value) return null;
    if (value instanceof mongoose.Types.ObjectId) return value;
    if (!mongoose.Types.ObjectId.isValid(value)) return null;
    return new mongoose.Types.ObjectId(value);
};

const mapSocialError = (error) => {
    const code = error?.code;
    if (code === 'INVALID_USER_ID') return { status: 400, message: 'Invalid user id' };
    if (code === 'USER_NOT_FOUND') return { status: 404, message: 'User not found' };
    if (code === 'SELF_FOLLOW_NOT_ALLOWED') return { status: 400, message: 'You cannot follow yourself' };
    if (code === 'DUPLICATE_FOLLOW') return { status: 409, message: 'Already following this user' };
    if (code === 'FOLLOW_LIMIT_REACHED') return { status: 429, message: error.message };
    if (code === 'FOLLOW_SYSTEM_DISABLED') return { status: 403, message: 'Follow system is disabled' };
    if (code === 'INVALID_FOLLOW_ID') return { status: 400, message: 'Invalid follow id' };
    return { status: 500, message: error?.message || 'Server error' };
};

exports.follow = async (req, res) => {
    try {
        const followingId = req.body.followingId || req.body.userId;
        if (!followingId) {
            return res.status(400).json({ success: false, message: 'followingId is required' });
        }

        const created = await followUser({
            followerId: req.user.id,
            followingId
        });

        const [targetCounts, currentCounts] = await Promise.all([
            getUserFollowCounts(followingId),
            getUserFollowCounts(req.user.id)
        ]);

        return res.status(201).json({
            success: true,
            message: 'Followed successfully',
            follow: created,
            targetCounts,
            currentCounts
        });
    } catch (error) {
        const mapped = mapSocialError(error);
        return res.status(mapped.status).json({ success: false, message: mapped.message });
    }
};

exports.unfollow = async (req, res) => {
    try {
        const followingId = req.body.followingId || req.body.userId;
        if (!followingId) {
            return res.status(400).json({ success: false, message: 'followingId is required' });
        }

        const deleted = await unfollowUser({
            followerId: req.user.id,
            followingId
        });

        const [targetCounts, currentCounts] = await Promise.all([
            getUserFollowCounts(followingId),
            getUserFollowCounts(req.user.id)
        ]);

        return res.status(200).json({
            success: true,
            message: deleted ? 'Unfollowed successfully' : 'Follow relationship not found',
            targetCounts,
            currentCounts
        });
    } catch (error) {
        const mapped = mapSocialError(error);
        return res.status(mapped.status).json({ success: false, message: mapped.message });
    }
};

exports.getFollowers = async (req, res) => {
    try {
        const { userId } = req.params;
        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 20);
        const viewerId = req.user?._id || null;

        const payload = await listFollowers({
            userId,
            viewerId,
            page,
            limit
        });

        return res.json({ success: true, ...payload });
    } catch (error) {
        const mapped = mapSocialError(error);
        return res.status(mapped.status).json({ success: false, message: mapped.message });
    }
};

exports.getFollowing = async (req, res) => {
    try {
        const { userId } = req.params;
        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 20);
        const viewerId = req.user?._id || null;

        const payload = await listFollowing({
            userId,
            viewerId,
            page,
            limit
        });

        return res.json({ success: true, ...payload });
    } catch (error) {
        const mapped = mapSocialError(error);
        return res.status(mapped.status).json({ success: false, message: mapped.message });
    }
};

exports.getFollowRelationship = async (req, res) => {
    try {
        const { userId } = req.params;
        const payload = await getRelationship({
            followerId: req.user.id,
            followingId: userId
        });
        return res.json({ success: true, ...payload });
    } catch (error) {
        const mapped = mapSocialError(error);
        return res.status(mapped.status).json({ success: false, message: mapped.message });
    }
};

exports.getActivityFeed = async (req, res) => {
    try {
        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 20);
        const payload = await getFollowingActivityFeed({
            userId: req.user.id,
            page,
            limit
        });
        return res.json({ success: true, ...payload });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Failed to load activity feed' });
    }
};

exports.getSuggested = async (req, res) => {
    try {
        const limit = Number(req.query.limit || 10);
        const users = await getSuggestedUsers({
            userId: req.user.id,
            limit
        });
        return res.json({ success: true, users });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Failed to fetch suggestions' });
    }
};

exports.getFriendsLeaderboard = async (req, res) => {
    try {
        const limit = Number(req.query.limit || 50);
        const rows = await getFriendsLeaderboard({
            userId: req.user.id,
            includeSelf: true,
            limit
        });
        return res.json({ success: true, users: rows });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Failed to fetch friends leaderboard' });
    }
};

exports.getDailyChallengeActivity = async (req, res) => {
    try {
        const limit = Number(req.query.limit || 20);
        const payload = await getDailyChallengeActivityForFollowing({
            userId: req.user.id,
            limit
        });
        return res.json({ success: true, ...payload });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Failed to fetch daily challenge activity' });
    }
};

exports.reportUser = async (req, res) => {
    try {
        const { reportedUserId, reason, description } = req.body;
        const normalizedReportedUserId = toObjectId(reportedUserId);
        if (!normalizedReportedUserId) {
            return res.status(400).json({ success: false, message: 'Invalid reportedUserId' });
        }

        if (String(normalizedReportedUserId) === String(req.user.id)) {
            return res.status(400).json({ success: false, message: 'You cannot report your own profile' });
        }

        const exists = await User.findById(normalizedReportedUserId).select('_id').lean();
        if (!exists) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const normalizedReason = String(reason || '').trim() || 'Other';
        const allowedReasons = new Set(['Spam', 'Harassment', 'Inappropriate Content', 'Plagiarism', 'Other']);
        if (!allowedReasons.has(normalizedReason)) {
            return res.status(400).json({ success: false, message: 'Invalid report reason' });
        }

        await Report.create({
            reporterId: req.user.id,
            reportedUserId: normalizedReportedUserId,
            contentId: normalizedReportedUserId,
            contentType: 'Profile',
            reason: normalizedReason,
            description: String(description || '').trim().slice(0, 1000)
        });

        return res.status(201).json({ success: true, message: 'Report submitted successfully' });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({ success: false, message: 'You have already reported this user' });
        }
        return res.status(500).json({ success: false, message: error.message || 'Failed to submit report' });
    }
};

exports.getAdminSocialOverview = async (req, res) => {
    try {
        const [socialConfig, totalRelationships, pendingProfileReports, dailyFollowActivity] = await Promise.all([
            getSocialConfig(),
            Follow.countDocuments({}),
            Report.countDocuments({ contentType: 'Profile', status: 'pending' }),
            Follow.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: '%Y-%m-%d',
                                date: '$createdAt'
                            }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ])
        ]);

        const todayStart = new Date();
        todayStart.setUTCHours(0, 0, 0, 0);
        const spamAgg = await Follow.aggregate([
            { $match: { createdAt: { $gte: todayStart } } },
            {
                $group: {
                    _id: '$follower',
                    followsToday: { $sum: 1 }
                }
            },
            { $match: { followsToday: { $gte: Math.max(10, Math.floor(socialConfig.maxFollowsPerDay * 0.8)) } } },
            { $sort: { followsToday: -1 } },
            { $limit: 20 }
        ]);
        const suspiciousUserIds = spamAgg.map((row) => row._id).filter(Boolean);
        const suspiciousUsers = await User.find({ _id: { $in: suspiciousUserIds } })
            .select('_id username email')
            .lean();
        const userMap = new Map(suspiciousUsers.map((user) => [String(user._id), user]));

        return res.json({
            success: true,
            overview: {
                totalRelationships,
                pendingProfileReports,
                socialConfig,
                dailyFollowActivity: dailyFollowActivity.map((entry) => ({
                    date: entry._id,
                    count: Number(entry.count || 0)
                })),
                spamAlerts: spamAgg.map((entry) => {
                    const user = userMap.get(String(entry._id));
                    return {
                        userId: String(entry._id),
                        username: user?.username || 'Unknown',
                        email: user?.email || '',
                        followsToday: Number(entry.followsToday || 0)
                    };
                })
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Failed to fetch social overview' });
    }
};

exports.getAdminProfileReports = async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page || 1));
        const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
        const skip = (page - 1) * limit;
        const statusFilter = String(req.query.status || '').trim().toLowerCase();
        const query = { contentType: 'Profile' };
        if (statusFilter && statusFilter !== 'all') {
            query.status = statusFilter;
        }

        const [total, reports] = await Promise.all([
            Report.countDocuments(query),
            Report.find(query)
                .populate('reporterId', 'username avatar')
                .populate('reportedUserId', 'username avatar email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
        ]);

        return res.json({
            success: true,
            reports,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Failed to fetch profile reports' });
    }
};

exports.removeSpamFollow = async (req, res) => {
    try {
        const deleted = await removeFollowById(req.params.followId);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Follow relationship not found' });
        }
        return res.json({ success: true, message: 'Follow relationship removed' });
    } catch (error) {
        const mapped = mapSocialError(error);
        return res.status(mapped.status).json({ success: false, message: mapped.message });
    }
};

exports.removeSpamUserFollows = async (req, res) => {
    try {
        const deletedCount = await removeFollowsByFollower(req.params.userId);
        return res.json({
            success: true,
            message: deletedCount > 0
                ? `Removed ${deletedCount} follow relationship${deletedCount > 1 ? 's' : ''}`
                : 'No follow relationships found for this user',
            deletedCount
        });
    } catch (error) {
        const mapped = mapSocialError(error);
        return res.status(mapped.status).json({ success: false, message: mapped.message });
    }
};

exports.getSuperAdminSocialConfig = async (req, res) => {
    try {
        const config = await getSocialConfig();
        return res.json({ success: true, config });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Failed to fetch social config' });
    }
};

exports.updateSuperAdminSocialConfig = async (req, res) => {
    try {
        const payload = {
            ...(Object.prototype.hasOwnProperty.call(req.body || {}, 'followSystemEnabled')
                ? { followSystemEnabled: req.body.followSystemEnabled }
                : {}),
            ...(Object.prototype.hasOwnProperty.call(req.body || {}, 'maxFollowsPerDay')
                ? { maxFollowsPerDay: req.body.maxFollowsPerDay }
                : {}),
            ...(Object.prototype.hasOwnProperty.call(req.body || {}, 'maxNotificationsPerHour')
                ? { maxNotificationsPerHour: req.body.maxNotificationsPerHour }
                : {}),
            ...(Object.prototype.hasOwnProperty.call(req.body || {}, 'feedLimit')
                ? { feedLimit: req.body.feedLimit }
                : {})
        };

        if (Object.keys(payload).length === 0) {
            return res.status(400).json({ success: false, message: 'No social config values provided' });
        }

        const config = await updateSocialConfig(payload, req.user.id);
        return res.json({
            success: true,
            message: 'Social config updated',
            config
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Failed to update social config' });
    }
};
