const mongoose = require('mongoose');
const Follow = require('../../models/Follow');
const User = require('../../models/User');
const { getSocialConfig } = require('./socialConfigService');

const PUBLIC_USER_SELECT = '_id username avatar stats.totalProblems finalScore totalSolvedEasy totalSolvedMedium totalSolvedHard';

const toObjectId = (value) => {
    if (!value) return null;
    if (value instanceof mongoose.Types.ObjectId) return value;
    if (!mongoose.Types.ObjectId.isValid(value)) return null;
    return new mongoose.Types.ObjectId(value);
};

const ensureUserExists = async (userId) => {
    const user = await User.findById(userId).select('_id accountStatus').lean();
    if (!user || user.accountStatus === 'Deleted') {
        const error = new Error('User not found');
        error.code = 'USER_NOT_FOUND';
        throw error;
    }
    return user;
};

const getUtcDayStart = (reference = new Date()) => {
    return new Date(Date.UTC(
        reference.getUTCFullYear(),
        reference.getUTCMonth(),
        reference.getUTCDate(),
        0,
        0,
        0,
        0
    ));
};

const getUserFollowCounts = async (userId) => {
    const normalizedUserId = toObjectId(userId);
    if (!normalizedUserId) {
        return { followersCount: 0, followingCount: 0 };
    }

    const [followersCount, followingCount] = await Promise.all([
        Follow.countDocuments({ following: normalizedUserId }),
        Follow.countDocuments({ follower: normalizedUserId })
    ]);

    return { followersCount, followingCount };
};

const getRelationship = async ({ followerId, followingId }) => {
    const normalizedFollowerId = toObjectId(followerId);
    const normalizedFollowingId = toObjectId(followingId);
    if (!normalizedFollowerId || !normalizedFollowingId) return { isFollowing: false };

    const existing = await Follow.findOne({
        follower: normalizedFollowerId,
        following: normalizedFollowingId
    }).select('_id').lean();

    return { isFollowing: Boolean(existing) };
};

const followUser = async ({ followerId, followingId }) => {
    const normalizedFollowerId = toObjectId(followerId);
    const normalizedFollowingId = toObjectId(followingId);

    if (!normalizedFollowerId || !normalizedFollowingId) {
        const error = new Error('Invalid user id');
        error.code = 'INVALID_USER_ID';
        throw error;
    }

    if (String(normalizedFollowerId) === String(normalizedFollowingId)) {
        const error = new Error('Users cannot follow themselves');
        error.code = 'SELF_FOLLOW_NOT_ALLOWED';
        throw error;
    }

    const socialConfig = await getSocialConfig();
    if (!socialConfig.followSystemEnabled) {
        const error = new Error('Follow system is currently disabled');
        error.code = 'FOLLOW_SYSTEM_DISABLED';
        throw error;
    }

    await Promise.all([
        ensureUserExists(normalizedFollowerId),
        ensureUserExists(normalizedFollowingId)
    ]);

    const followCountToday = await Follow.countDocuments({
        follower: normalizedFollowerId,
        createdAt: { $gte: getUtcDayStart() }
    });

    if (followCountToday >= socialConfig.maxFollowsPerDay) {
        const error = new Error(`Follow limit reached for today (${socialConfig.maxFollowsPerDay})`);
        error.code = 'FOLLOW_LIMIT_REACHED';
        throw error;
    }

    try {
        const follow = await Follow.create({
            follower: normalizedFollowerId,
            following: normalizedFollowingId
        });
        return follow;
    } catch (error) {
        if (error?.code === 11000) {
            const duplicateError = new Error('Already following this user');
            duplicateError.code = 'DUPLICATE_FOLLOW';
            throw duplicateError;
        }
        throw error;
    }
};

const unfollowUser = async ({ followerId, followingId }) => {
    const normalizedFollowerId = toObjectId(followerId);
    const normalizedFollowingId = toObjectId(followingId);

    if (!normalizedFollowerId || !normalizedFollowingId) {
        const error = new Error('Invalid user id');
        error.code = 'INVALID_USER_ID';
        throw error;
    }

    const deleted = await Follow.findOneAndDelete({
        follower: normalizedFollowerId,
        following: normalizedFollowingId
    });

    return Boolean(deleted);
};

const listFollowers = async ({ userId, viewerId = null, page = 1, limit = 20 }) => {
    const normalizedUserId = toObjectId(userId);
    if (!normalizedUserId) {
        const error = new Error('Invalid user id');
        error.code = 'INVALID_USER_ID';
        throw error;
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const safePage = Math.max(Number(page) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const [total, rows] = await Promise.all([
        Follow.countDocuments({ following: normalizedUserId }),
        Follow.find({ following: normalizedUserId })
            .populate('follower', PUBLIC_USER_SELECT)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(safeLimit)
            .lean()
    ]);

    const candidateIds = rows
        .map((row) => row.follower?._id)
        .filter(Boolean)
        .map((id) => String(id));

    let viewerFollowingSet = new Set();
    const normalizedViewerId = toObjectId(viewerId);
    if (normalizedViewerId && candidateIds.length > 0) {
        const followingRows = await Follow.find({
            follower: normalizedViewerId,
            following: { $in: candidateIds }
        }).select('following').lean();
        viewerFollowingSet = new Set(followingRows.map((entry) => String(entry.following)));
    }

    const users = rows
        .map((row) => row.follower)
        .filter(Boolean)
        .map((user) => {
            const uid = String(user._id);
            return {
                _id: uid,
                username: user.username || 'Unknown',
                avatar: user.avatar || '',
                problemsSolved: Number(user?.stats?.totalProblems || 0),
                finalScore: Number(user?.finalScore || 0),
                isFollowing: viewerFollowingSet.has(uid),
                isSelf: normalizedViewerId ? uid === String(normalizedViewerId) : false
            };
        });

    return {
        users,
        pagination: {
            page: safePage,
            limit: safeLimit,
            total,
            pages: Math.ceil(total / safeLimit)
        }
    };
};

const listFollowing = async ({ userId, viewerId = null, page = 1, limit = 20 }) => {
    const normalizedUserId = toObjectId(userId);
    if (!normalizedUserId) {
        const error = new Error('Invalid user id');
        error.code = 'INVALID_USER_ID';
        throw error;
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const safePage = Math.max(Number(page) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const [total, rows] = await Promise.all([
        Follow.countDocuments({ follower: normalizedUserId }),
        Follow.find({ follower: normalizedUserId })
            .populate('following', PUBLIC_USER_SELECT)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(safeLimit)
            .lean()
    ]);

    const candidateIds = rows
        .map((row) => row.following?._id)
        .filter(Boolean)
        .map((id) => String(id));

    let viewerFollowingSet = new Set();
    const normalizedViewerId = toObjectId(viewerId);
    if (normalizedViewerId && candidateIds.length > 0) {
        const followingRows = await Follow.find({
            follower: normalizedViewerId,
            following: { $in: candidateIds }
        }).select('following').lean();
        viewerFollowingSet = new Set(followingRows.map((entry) => String(entry.following)));
    }

    const users = rows
        .map((row) => row.following)
        .filter(Boolean)
        .map((user) => {
            const uid = String(user._id);
            return {
                _id: uid,
                username: user.username || 'Unknown',
                avatar: user.avatar || '',
                problemsSolved: Number(user?.stats?.totalProblems || 0),
                finalScore: Number(user?.finalScore || 0),
                isFollowing: viewerFollowingSet.has(uid),
                isSelf: normalizedViewerId ? uid === String(normalizedViewerId) : false
            };
        });

    return {
        users,
        pagination: {
            page: safePage,
            limit: safeLimit,
            total,
            pages: Math.ceil(total / safeLimit)
        }
    };
};

const getFollowingIds = async (userId) => {
    const normalizedUserId = toObjectId(userId);
    if (!normalizedUserId) return [];

    const rows = await Follow.find({ follower: normalizedUserId }).select('following').lean();
    return rows.map((row) => row.following).filter(Boolean);
};

const getSuggestedUsers = async ({ userId, limit = 10 }) => {
    const normalizedUserId = toObjectId(userId);
    if (!normalizedUserId) return [];

    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
    const followedIds = await getFollowingIds(normalizedUserId);
    const excludedIds = [...new Set([String(normalizedUserId), ...followedIds.map((id) => String(id))])];

    const users = await User.find({
        _id: { $nin: excludedIds },
        role: 'USER',
        accountStatus: { $ne: 'Deleted' }
    })
        .select(PUBLIC_USER_SELECT)
        .sort({
            finalScore: -1,
            'stats.totalProblems': -1,
            createdAt: 1
        })
        .limit(safeLimit)
        .lean();

    return users.map((user) => ({
        _id: String(user._id),
        username: user.username || 'Unknown',
        avatar: user.avatar || '',
        problemsSolved: Number(user?.stats?.totalProblems || 0),
        finalScore: Number(user?.finalScore || 0),
        reason: 'Top performer'
    }));
};

const getFriendsLeaderboard = async ({ userId, includeSelf = true, limit = 50 }) => {
    const normalizedUserId = toObjectId(userId);
    if (!normalizedUserId) return [];

    const followingIds = await getFollowingIds(normalizedUserId);
    const leaderboardIds = includeSelf
        ? [...new Set([String(normalizedUserId), ...followingIds.map((id) => String(id))])]
        : [...new Set(followingIds.map((id) => String(id)))];

    if (leaderboardIds.length === 0) return [];

    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const users = await User.find({
        _id: { $in: leaderboardIds },
        role: 'USER',
        accountStatus: { $ne: 'Deleted' }
    })
        .select('_id username avatar stats.totalProblems finalScore')
        .sort({
            'stats.totalProblems': -1,
            finalScore: -1,
            createdAt: 1
        })
        .limit(safeLimit)
        .lean();

    return users.map((user, index) => ({
        rank: index + 1,
        _id: String(user._id),
        username: user.username || 'Unknown',
        avatar: user.avatar || '',
        problemsSolved: Number(user?.stats?.totalProblems || 0),
        finalScore: Number(user?.finalScore || 0),
        isCurrentUser: String(user._id) === String(normalizedUserId)
    }));
};

const removeFollowById = async (followId) => {
    if (!mongoose.Types.ObjectId.isValid(followId)) {
        const error = new Error('Invalid follow id');
        error.code = 'INVALID_FOLLOW_ID';
        throw error;
    }

    const deleted = await Follow.findByIdAndDelete(followId);
    return deleted;
};

const removeFollowsByFollower = async (followerId) => {
    const normalizedFollowerId = toObjectId(followerId);
    if (!normalizedFollowerId) {
        const error = new Error('Invalid user id');
        error.code = 'INVALID_USER_ID';
        throw error;
    }

    const result = await Follow.deleteMany({ follower: normalizedFollowerId });
    return Number(result?.deletedCount || 0);
};

module.exports = {
    followUser,
    unfollowUser,
    getRelationship,
    getUserFollowCounts,
    listFollowers,
    listFollowing,
    getFollowingIds,
    getSuggestedUsers,
    getFriendsLeaderboard,
    removeFollowById,
    removeFollowsByFollower
};
