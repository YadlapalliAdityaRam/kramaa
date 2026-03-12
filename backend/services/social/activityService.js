const mongoose = require('mongoose');
const ActivityEvent = require('../../models/ActivityEvent');
const DailyChallenge = require('../../models/DailyChallenge');
const Submission = require('../../models/Submission');
const Notification = require('../../models/Notification');
const notificationService = require('../notificationService');
const { getSocialConfig } = require('./socialConfigService');
const { getFollowingIds } = require('./followService');

const toObjectId = (value) => {
    if (!value) return null;
    if (value instanceof mongoose.Types.ObjectId) return value;
    if (!mongoose.Types.ObjectId.isValid(value)) return null;
    return new mongoose.Types.ObjectId(value);
};

const formatUtcDateKey = (value) => {
    const date = new Date(value || Date.now());
    if (Number.isNaN(date.getTime())) return null;
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const buildNotificationForEvent = (activity, actor) => {
    const actorName = actor?.username || 'Someone';
    const problem = activity.problemId;
    const contest = activity.contestId;
    const defaultLink = activity?.metadata?.link || '/';

    switch (activity.activityType) {
        case 'problem_solved':
            return {
                type: 'system',
                title: 'Problem Solved',
                message: `${actorName} solved ${problem?.title ? `"${problem.title}"` : 'a problem'}.`,
                link: problem?.slug ? `/coding-platform/${problem.slug}` : defaultLink,
                icon: '✅',
                shouldNotify: false // Feed only by default to reduce noise.
            };
        case 'daily_challenge_completed':
            return {
                type: 'system',
                title: 'Daily Challenge Completed',
                message: `${actorName} solved today's Daily Challenge.`,
                link: problem?.slug ? `/coding-platform/${problem.slug}` : defaultLink,
                icon: '🔥',
                shouldNotify: true
            };
        case 'solution_posted':
            return {
                type: 'system',
                title: 'New Solution Posted',
                message: `${actorName} posted a new solution.`,
                link: problem?.slug ? `/coding-platform/${problem.slug}` : defaultLink,
                icon: '💡',
                shouldNotify: true
            };
        case 'discussion_created':
            return {
                type: 'system',
                title: 'New Discussion Started',
                message: `${actorName} started a discussion.`,
                link: activity?.metadata?.threadLink || '/community',
                icon: '💬',
                shouldNotify: true
            };
        case 'contest_joined':
            return {
                type: 'system',
                title: 'Contest Participation',
                message: `${actorName} joined ${contest?.title ? `"${contest.title}"` : 'a contest'}.`,
                link: contest?._id ? `/contest/${contest._id}` : defaultLink,
                icon: '🏁',
                shouldNotify: false
            };
        case 'contest_ranked':
            return {
                type: 'system',
                title: 'Contest Rank Update',
                message: `${actorName} ranked ${activity?.metadata?.rank ? `#${activity.metadata.rank}` : 'in'} ${contest?.title ? `"${contest.title}"` : 'a contest'}.`,
                link: contest?._id ? `/contest/${contest._id}/leaderboard` : defaultLink,
                icon: '🏆',
                shouldNotify: true
            };
        case 'contest_finished':
            return {
                type: 'system',
                title: 'Contest Finished',
                message: `${actorName} finished ${contest?.title ? `"${contest.title}"` : 'a contest'}${activity?.metadata?.rank ? ` at rank #${activity.metadata.rank}` : ''}.`,
                link: contest?._id ? `/contest/${contest._id}/leaderboard` : defaultLink,
                icon: 'ðŸ',
                shouldNotify: true
            };
        case 'contest_exited':
            return {
                type: 'system',
                title: 'Contest Exit',
                message: `${actorName} exited ${contest?.title ? `"${contest.title}"` : 'a contest'} after solving ${Number(activity?.metadata?.problemsSolved || 0)} problem(s).`,
                link: contest?._id ? `/contest/${contest._id}` : defaultLink,
                icon: 'â¹ï¸',
                shouldNotify: false
            };
        default:
            return {
                type: 'system',
                title: 'New Activity',
                message: `${actorName} has a new activity.`,
                link: defaultLink,
                icon: '🔔',
                shouldNotify: false
            };
    }
};

const createActivityEvent = async ({
    userId,
    activityType,
    problemId = null,
    contestId = null,
    doubtId = null,
    solutionId = null,
    metadata = {},
    dedupeKey = null,
    dedupeWindowMinutes = 0
}) => {
    const normalizedUserId = toObjectId(userId);
    if (!normalizedUserId) return null;

    if (dedupeKey && dedupeWindowMinutes > 0) {
        const since = new Date(Date.now() - dedupeWindowMinutes * 60 * 1000);
        const existing = await ActivityEvent.findOne({
            userId: normalizedUserId,
            activityType,
            'metadata.dedupeKey': dedupeKey,
            createdAt: { $gte: since }
        })
            .sort({ createdAt: -1 })
            .lean();

        if (existing) return existing;
    }

    const payload = {
        userId: normalizedUserId,
        activityType,
        problemId: toObjectId(problemId),
        contestId: toObjectId(contestId),
        doubtId: toObjectId(doubtId),
        solutionId: toObjectId(solutionId),
        metadata: {
            ...(metadata || {}),
            ...(dedupeKey ? { dedupeKey } : {})
        },
        createdAt: new Date()
    };

    return ActivityEvent.create(payload);
};

const notifyFollowersForEvent = async (req, activityEvent) => {
    if (!activityEvent) return;

    const socialConfig = await getSocialConfig();
    const actor = await require('../../models/User')
        .findById(activityEvent.userId)
        .select('_id username avatar')
        .lean();

    const hydratedEvent = await ActivityEvent.findById(activityEvent._id)
        .populate('problemId', 'title slug')
        .populate('contestId', 'title')
        .lean();
    if (!hydratedEvent) return;

    const notificationPayload = buildNotificationForEvent(hydratedEvent, actor);
    if (!notificationPayload.shouldNotify) return;

    const followerRows = await require('../../models/Follow')
        .find({ following: hydratedEvent.userId })
        .select('follower')
        .lean();
    const followerIds = followerRows
        .map((row) => row.follower)
        .filter(Boolean)
        .map((id) => String(id))
        .filter((id) => id !== String(hydratedEvent.userId));

    if (followerIds.length === 0) return;

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    await Promise.all(followerIds.map(async (followerId) => {
        const sentCount = await Notification.countDocuments({
            userId: followerId,
            createdAt: { $gte: oneHourAgo }
        });
        if (sentCount >= socialConfig.maxNotificationsPerHour) return;

        await notificationService.createNotification(req, followerId, {
            type: notificationPayload.type,
            title: notificationPayload.title,
            message: notificationPayload.message,
            link: notificationPayload.link,
            icon: notificationPayload.icon
        });
    }));
};

const recordActivity = async (req, eventInput) => {
    const event = await createActivityEvent(eventInput);
    if (event) {
        await notifyFollowersForEvent(req, event);
    }
    return event;
};

const mapFeedItem = (eventDoc) => {
    const actor = eventDoc?.userId || {};
    const problem = eventDoc?.problemId || null;
    const contest = eventDoc?.contestId || null;
    const metadata = eventDoc?.metadata || {};

    return {
        _id: String(eventDoc?._id || ''),
        activityType: eventDoc?.activityType || '',
        createdAt: eventDoc?.createdAt || null,
        user: {
            _id: String(actor?._id || ''),
            username: actor?.username || 'Unknown',
            avatar: actor?.avatar || ''
        },
        problem: problem ? {
            _id: String(problem._id),
            title: problem.title || '',
            slug: problem.slug || '',
            difficulty: problem.difficulty || ''
        } : null,
        contest: contest ? {
            _id: String(contest._id),
            title: contest.title || ''
        } : null,
        metadata
    };
};

const getFollowingActivityFeed = async ({ userId, page = 1, limit = 20 }) => {
    const socialConfig = await getSocialConfig();
    const safeLimit = Math.min(
        socialConfig.feedLimit || 50,
        Math.max(1, Number(limit) || 20),
        50
    );
    const safePage = Math.max(1, Number(page) || 1);
    const skip = (safePage - 1) * safeLimit;

    const followingIds = await getFollowingIds(userId);
    const normalizedFollowingIds = followingIds
        .map((id) => toObjectId(id))
        .filter(Boolean);

    if (normalizedFollowingIds.length === 0) {
        return {
            items: [],
            pagination: {
                page: safePage,
                limit: safeLimit,
                total: 0,
                pages: 0
            }
        };
    }

    const [total, events] = await Promise.all([
        ActivityEvent.countDocuments({ userId: { $in: normalizedFollowingIds } }),
        ActivityEvent.find({ userId: { $in: normalizedFollowingIds } })
            .populate('userId', 'username avatar')
            .populate('problemId', 'title slug difficulty')
            .populate('contestId', 'title')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(safeLimit)
            .lean()
    ]);

    return {
        items: events.map(mapFeedItem),
        pagination: {
            page: safePage,
            limit: safeLimit,
            total,
            pages: Math.ceil(total / safeLimit)
        }
    };
};

const getDailyChallengeActivityForFollowing = async ({ userId, limit = 20 }) => {
    const followingIds = await getFollowingIds(userId);
    const normalizedFollowingIds = followingIds
        .map((id) => toObjectId(id))
        .filter(Boolean);
    if (normalizedFollowingIds.length === 0) {
        return { challenge: null, users: [] };
    }

    const dateKey = formatUtcDateKey(new Date());
    const challenge = await DailyChallenge.findOne({ dateKey })
        .populate('problem', 'title slug difficulty')
        .lean();
    if (!challenge?.problem?._id) {
        return { challenge: null, users: [] };
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const users = await require('../../models/User')
        .find({ _id: { $in: normalizedFollowingIds }, accountStatus: { $ne: 'Deleted' } })
        .select('_id username avatar stats.totalProblems')
        .sort({ 'stats.totalProblems': -1 })
        .limit(safeLimit)
        .lean();

    const solvedRows = await Submission.aggregate([
        {
            $match: {
                user: { $in: users.map((user) => user._id) },
                problem: toObjectId(challenge.problem._id),
                status: 'accepted'
            }
        },
        { $sort: { createdAt: 1 } },
        {
            $group: {
                _id: '$user',
                solvedAt: { $first: '$createdAt' }
            }
        }
    ]);
    const solvedMap = new Map(solvedRows.map((row) => [String(row._id), row.solvedAt]));

    return {
        challenge: {
            date: challenge.dateKey,
            problemId: String(challenge.problem._id),
            title: challenge.problem.title || '',
            slug: challenge.problem.slug || '',
            difficulty: challenge.problem.difficulty || challenge.difficulty || ''
        },
        users: users.map((user) => {
            const uid = String(user._id);
            const solvedAt = solvedMap.get(uid) || null;
            return {
                _id: uid,
                username: user.username || 'Unknown',
                avatar: user.avatar || '',
                problemsSolved: Number(user?.stats?.totalProblems || 0),
                solved: Boolean(solvedAt),
                solvedAt
            };
        })
    };
};

module.exports = {
    formatUtcDateKey,
    createActivityEvent,
    recordActivity,
    getFollowingActivityFeed,
    getDailyChallengeActivityForFollowing
};
