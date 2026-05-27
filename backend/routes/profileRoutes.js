const express = require('express');
const router = express.Router();
const { protect, optionalProtect } = require('../middleware/auth');
const User = require('../models/User');
const Profile = require('../models/Profile');
const UserAnalytics = require('../models/UserAnalytics');
const Submission = require('../models/Submission');
const ActivityEvent = require('../models/ActivityEvent');
const Contest = require('../models/Contest');
const ContestResult = require('../models/ContestResult');
const Problem = require('../models/Problem');
const badgeService = require('../services/badgeService');
const RatingService = require('../services/ratingService');
const globalRankService = require('../services/globalRankService');
const analyticsService = require('../services/analyticsService');
const {
    ensureChallengesForRange,
    getChallengesInRange,
    serializeChallenge
} = require('../services/dailyChallengeService');
const mongoose = require('mongoose');
const { buildPublishedProblemMatch } = require('../utils/problemPublication');

const roundTo2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

const toPlainMap = (mapLike) => {
    if (!mapLike) return {};
    if (mapLike instanceof Map) return Object.fromEntries(mapLike);
    if (typeof mapLike.toObject === 'function') return mapLike.toObject();
    return mapLike;
};

const normalizeTopic = (value) => {
    if (!value || typeof value !== 'string') return null;
    return value.trim();
};

const formatUtcDateKey = (dateValue) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return null;
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const extractProblemTopics = (problemDoc) => {
    if (!problemDoc) return [];
    const source = Array.isArray(problemDoc.topics) && problemDoc.topics.length > 0
        ? problemDoc.topics
        : (problemDoc.topic ? [problemDoc.topic] : []);
    const unique = new Set();
    source.forEach((rawTopic) => {
        const topic = normalizeTopic(rawTopic);
        if (topic) unique.add(topic);
    });
    return Array.from(unique);
};

const syncUserSolvedAndSubmissionStats = async (userId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [solvedProblemIdsRaw, totalSubmissions, acceptedSubmissions] = await Promise.all([
        Submission.distinct('problem', { user: userObjectId, status: 'accepted' }),
        Submission.countDocuments({ user: userObjectId }),
        Submission.countDocuments({ user: userObjectId, status: 'accepted' })
    ]);

    const solvedProblemIds = (solvedProblemIdsRaw || []).filter(Boolean).map((id) => (
        mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id
    ));

    const difficultyAgg = solvedProblemIds.length > 0
        ? await Problem.aggregate([
            { $match: { _id: { $in: solvedProblemIds } } },
            { $group: { _id: '$difficulty', count: { $sum: 1 } } }
        ])
        : [];

    const countsByDifficulty = { Easy: 0, Medium: 0, Hard: 0 };
    difficultyAgg.forEach((entry) => {
        if (entry?._id && countsByDifficulty[entry._id] !== undefined) {
            countsByDifficulty[entry._id] = Number(entry.count || 0);
        }
    });

    const totalSolved = countsByDifficulty.Easy + countsByDifficulty.Medium + countsByDifficulty.Hard;
    const acceptanceRate = totalSubmissions > 0
        ? roundTo2((acceptedSubmissions / totalSubmissions) * 100)
        : 0;

    const update = {
        $set: {
            solvedProblems: solvedProblemIds,
            'stats.easySolved': countsByDifficulty.Easy,
            'stats.mediumSolved': countsByDifficulty.Medium,
            'stats.hardSolved': countsByDifficulty.Hard,
            'stats.totalProblems': totalSolved,
            'stats.totalSubmissions': totalSubmissions,
            'stats.acceptedSubmissions': acceptedSubmissions,
            totalSolvedEasy: countsByDifficulty.Easy,
            totalSolvedMedium: countsByDifficulty.Medium,
            totalSolvedHard: countsByDifficulty.Hard,
            problemAcceptanceRate: acceptanceRate
        }
    };

    await User.findByIdAndUpdate(userObjectId, update);
    return {
        totalSolvedEasy: countsByDifficulty.Easy,
        totalSolvedMedium: countsByDifficulty.Medium,
        totalSolvedHard: countsByDifficulty.Hard,
        totalSolved,
        totalSubmissions,
        acceptedSubmissions,
        problemAcceptanceRate: acceptanceRate
    };
};

// =============================================
// CORE PROFILE ROUTES
// =============================================

// @route   GET /api/profiles/me
// @desc    Get current user's profile (with full stats)
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        await syncUserSolvedAndSubmissionStats(req.user.id);
        await globalRankService.recalculateUserMetrics(req.user.id);
        try {
            await analyticsService.recalculateDeepAnalytics(req.user.id);
        } catch (analyticsError) {
            console.error('Analytics sync failed for /profiles/me:', analyticsError.message);
        }

        const populateFields = 'username email avatar level xp streak badges stats totalSolvedEasy totalSolvedMedium totalSolvedHard problemAcceptanceRate finalScore globalRank solvedProblems rating contestStats performanceStats bookmarkedProblems fullName phoneNumber accountStatus lastLogin createdAt';

        let profile = await Profile.findOne({ user: req.user.id })
            .populate('user', populateFields);

        if (!profile) {
            profile = new Profile({ user: req.user._id });
            await profile.save();
            profile = await Profile.findOne({ user: req.user._id })
                .populate('user', populateFields);
        }

        // Update lastLogin
        await User.findByIdAndUpdate(req.user.id, { lastLogin: new Date() });

        res.json(profile);
    } catch (err) {
        console.error('Profile Route Error:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// @route   GET /api/profiles/user/:username
// @desc    Get profile by username (Public)
// @access  Public
router.get('/user/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) return res.status(404).json({ message: 'User not found' });

        await syncUserSolvedAndSubmissionStats(user._id);
        await globalRankService.recalculateUserMetrics(user._id);
        if (user.accountStatus !== 'Deleted') {
            try {
                await analyticsService.recalculateDeepAnalytics(user._id);
            } catch (analyticsError) {
                console.error('Analytics sync failed for /profiles/user/:username:', analyticsError.message);
            }
        }

        const profile = await Profile.findOne({ user: user._id })
            .populate('user', 'username avatar level xp streak badges stats totalSolvedEasy totalSolvedMedium totalSolvedHard problemAcceptanceRate finalScore globalRank solvedProblems rating contestStats performanceStats createdAt');

        if (!profile) return res.status(404).json({ message: 'Profile not found' });

        // Privacy check
        if (!profile.preferences.isPublic && (!req.user || req.user.id !== user.id)) {
            return res.status(403).json({ message: 'This profile is private' });
        }

        // Fetch Analytics Summary (if user allows)
        let analytics = null;
        if (profile.preferences.showActivity) {
            analytics = await UserAnalytics.findOne({ user: user._id })
                .select('languageStats tagStats heatmap insights');
        }

        res.json({ profile, analytics });

    } catch (err) {
        console.error(err.message);
        if (err.kind == 'ObjectId') {
            return res.status(404).json({ message: 'Profile not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/profiles/me
// @desc    Create or update user profile
// @access  Private
router.put('/me', protect, async (req, res) => {
    const {
        fullName, phoneNumber,
        bio, title, website, location, coverPhoto,
        social, education, educationDetails, skills, preferences, experienceLevel
    } = req.body;

    const profileFields = {};
    profileFields.user = req.user.id;
    if (bio !== undefined) profileFields.bio = bio;
    if (title !== undefined) profileFields.title = title;
    if (website !== undefined) profileFields.website = website;
    if (coverPhoto !== undefined) profileFields.coverPhoto = coverPhoto;
    if (experienceLevel !== undefined) profileFields.experienceLevel = experienceLevel;

    if (location) profileFields.location = location;
    if (social) profileFields.social = social;
    if (educationDetails) profileFields.educationDetails = educationDetails;
    if (education) profileFields.education = education;
    if (preferences) profileFields.preferences = preferences;
    if (skills) profileFields.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());

    try {
        if (fullName || phoneNumber) {
            const userFields = {};
            if (fullName !== undefined) userFields.fullName = fullName;
            if (phoneNumber !== undefined) userFields.phoneNumber = phoneNumber;
            await User.findByIdAndUpdate(req.user.id, { $set: userFields });
        }

        let profile = await Profile.findOne({ user: req.user.id });

        if (profile) {
            profile = await Profile.findOneAndUpdate(
                { user: req.user.id },
                { $set: profileFields },
                { new: true }
            );
        } else {
            profile = new Profile(profileFields);
            await profile.save();
        }

        const populatedProfile = await Profile.findOne({ user: req.user.id })
            .populate('user', 'username email avatar level xp streak badges fullName phoneNumber rating contestStats performanceStats');

        res.json(populatedProfile);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// =============================================
// ANALYTICS & PERFORMANCE ROUTES
// =============================================

// @route   GET /api/profiles/analytics
// @desc    Get detailed analytics for current user
// @access  Private
router.get('/analytics', protect, async (req, res) => {
    try {
        try {
            await analyticsService.recalculateDeepAnalytics(req.user.id);
        } catch (analyticsError) {
            console.error('Analytics sync failed for /profiles/analytics:', analyticsError.message);
        }
        const analytics = await UserAnalytics.findOne({ user: req.user.id });

        if (!analytics) {
            return res.json({
                languageStats: {},
                tagStats: {},
                insights: {},
                heatmap: {}
            });
        }

        res.json(analytics);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/profiles/performance
// @desc    Get performance insights (acceptance rate, runtime/memory stats, rank)
// @access  Private
router.get('/performance', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('stats performanceStats rating totalSolvedEasy totalSolvedMedium totalSolvedHard problemAcceptanceRate finalScore globalRank');

        if (!user) return res.status(404).json({ message: 'User not found' });

        const [totalSubmissions, acceptedSubmissions, acceptedRuns] = await Promise.all([
            Submission.countDocuments({ user: req.user.id }),
            Submission.countDocuments({ user: req.user.id, status: 'accepted' }),
            Submission.find({ user: req.user.id, status: 'accepted' })
                .select('runtime memory')
                .sort({ runtime: 1 })
        ]);

        const runtimeEntries = acceptedRuns.filter(
            (s) => typeof s.runtime === 'number' && Number.isFinite(s.runtime) && s.runtime > 0
        );
        const memoryEntries = acceptedRuns.filter(
            (s) => typeof s.memory === 'number' && Number.isFinite(s.memory) && s.memory > 0
        );

        const avgRuntime = runtimeEntries.length > 0
            ? Math.round((runtimeEntries.reduce((sum, s) => sum + s.runtime, 0) / runtimeEntries.length) * 100) / 100
            : 0;
        const avgMemory = memoryEntries.length > 0
            ? Math.round((memoryEntries.reduce((sum, s) => sum + s.memory, 0) / memoryEntries.length) * 100) / 100
            : 0;
        const fastestSubmission = runtimeEntries.length > 0 ? runtimeEntries[0] : null;
        const fastestRuntime = fastestSubmission ? fastestSubmission.runtime : null;

        // Keep persisted profile metrics in sync with real submission data.
        await User.findByIdAndUpdate(req.user.id, {
            $set: {
                'stats.totalSubmissions': totalSubmissions,
                'stats.acceptedSubmissions': acceptedSubmissions,
                'performanceStats.avgRuntime': avgRuntime,
                'performanceStats.avgMemory': avgMemory,
                'performanceStats.fastestRuntime': fastestRuntime,
                'performanceStats.fastestSubmission': fastestSubmission?._id || null
            }
        });

        await globalRankService.recalculateUserMetrics(req.user.id);

        let rankedUser = await User.findById(req.user.id)
            .select('rating stats totalSolvedEasy totalSolvedMedium totalSolvedHard problemAcceptanceRate finalScore globalRank');

        if (!Number.isFinite(rankedUser?.globalRank) || rankedUser.globalRank <= 0) {
            await globalRankService.recomputeGlobalRanks();
            rankedUser = await User.findById(req.user.id)
                .select('rating stats totalSolvedEasy totalSolvedMedium totalSolvedHard problemAcceptanceRate finalScore globalRank');
        }

        const totalUsers = await User.countDocuments({ role: 'USER', accountStatus: { $ne: 'Deleted' } });

        const acceptanceRate = Number(rankedUser?.problemAcceptanceRate || 0);
        const totalSolvedEasy = Number(rankedUser?.totalSolvedEasy || 0);
        const totalSolvedMedium = Number(rankedUser?.totalSolvedMedium || 0);
        const totalSolvedHard = Number(rankedUser?.totalSolvedHard || 0);
        const baseScore = totalSolvedEasy + (totalSolvedMedium * 3) + (totalSolvedHard * 5);
        const globalRank = Number.isFinite(rankedUser?.globalRank) ? rankedUser.globalRank : null;

        // Rating tier (helper function)
        const getTier = (rating) => {
            if (rating >= 2400) return { name: 'Grandmaster', color: '#ff0000' };
            if (rating >= 2100) return { name: 'Master', color: '#ff8c00' };
            if (rating >= 1900) return { name: 'Candidate Master', color: '#aa00aa' };
            if (rating >= 1600) return { name: 'Expert', color: '#0000ff' };
            if (rating >= 1400) return { name: 'Specialist', color: '#03a89e' };
            if (rating >= 1200) return { name: 'Pupil', color: '#008000' };
            return { name: 'Newbie', color: '#808080' };
        };
        const tier = getTier(rankedUser.rating.current);

        res.json({
            acceptanceRate,
            totalSubmissions,
            acceptedSubmissions,
            baseScore,
            finalScore: Number(rankedUser.finalScore || 0),
            totalSolvedEasy,
            totalSolvedMedium,
            totalSolvedHard,
            avgRuntime,
            avgMemory,
            fastestRuntime,
            rating: rankedUser.rating.current,
            ratingHighest: rankedUser.rating.highest,
            ratingHistory: rankedUser.rating.history,
            ratingTier: tier,
            globalRank,
            totalUsers,
            percentile: (totalUsers > 0 && globalRank)
                ? Math.round(((totalUsers - globalRank) / totalUsers) * 100)
                : 0
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/profiles/contest-stats
// @desc    Get contest statistics for current user
// @access  Private
router.get('/contest-stats', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('contestStats rating');

        if (!user) return res.status(404).json({ message: 'User not found' });

        const contestResults = await ContestResult.find({ userId: req.user.id })
            .populate('contestId', 'title startTime endTime')
            .sort({ finalizedAt: -1, updatedAt: -1 })
            .limit(50)
            .lean();

        const contestHistory = contestResults.map((entry) => ({
            contestId: entry.contestId?._id || entry.contestId,
            title: entry.contestId?.title || 'Contest',
            date: entry.finalizedAt || entry.updatedAt || entry.createdAt || null,
            rank: entry.rank || null,
            totalParticipants: null,
            score: Number(entry.score || 0),
            problemsSolved: Number(entry.problemsSolved || 0),
            penaltyTime: Number(entry.penaltyTime || 0),
            submissionCount: Number(entry.submissionCount || 0),
            status: entry.status || 'active',
            source: entry.source || 'system'
        }));

        res.json({
            participated: user.contestStats.participated,
            bestRank: user.contestStats.bestRank,
            totalScore: user.contestStats.totalScore,
            ratingCurrent: user.rating.current,
            ratingHighest: user.rating.highest,
            ratingHistory: user.rating.history,
            contestHistory
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// =============================================
// BADGES ROUTES
// =============================================

// @route   GET /api/profiles/badges
// @desc    Get all badges (earned + definitions for locked display)
// @access  Private
router.get('/badges', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('badges');
        if (!user) return res.status(404).json({ message: 'User not found' });

        const allDefinitions = badgeService.getAllDefinitions();
        const earnedIds = new Set(user.badges.map(b => b.id));

        const badges = allDefinitions.map(def => ({
            ...def,
            earned: earnedIds.has(def.id),
            earnedAt: earnedIds.has(def.id) ? user.badges.find(b => b.id === def.id)?.earnedAt : null
        }));

        res.json({
            earned: user.badges.length,
            total: allDefinitions.length,
            badges
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// =============================================
// BOOKMARK ROUTES
// =============================================

// @route   POST /api/profiles/bookmark/:problemId
// @desc    Toggle bookmark on a problem
// @access  Private
router.post('/bookmark/:problemId', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('bookmarkedProblems');
        if (!user) return res.status(404).json({ message: 'User not found' });

        const problemId = req.params.problemId;
        const idx = user.bookmarkedProblems.findIndex(id => id.toString() === problemId);

        if (idx > -1) {
            // Remove bookmark
            user.bookmarkedProblems.splice(idx, 1);
            await user.save();
            res.json({ bookmarked: false, bookmarkedProblems: user.bookmarkedProblems });
        } else {
            // Add bookmark
            user.bookmarkedProblems.push(problemId);
            await user.save();
            res.json({ bookmarked: true, bookmarkedProblems: user.bookmarkedProblems });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/profiles/bookmarks
// @desc    Get bookmarked problems
// @access  Private
router.get('/bookmarks', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('bookmarkedProblems')
            .populate({
                path: 'bookmarkedProblems',
                select: 'title difficulty slug topics totalSubmissions totalAcceptedSubmissions'
            });

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json(user.bookmarkedProblems);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// =============================================
// SUBMISSIONS & PROGRESS ROUTES
// =============================================

// @route   GET /api/profiles/submissions
// @desc    Get recent submissions for the current user's profile
// @access  Private
router.get('/submissions', protect, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const skip = (page - 1) * limit;

        // Optional filters
        const filter = { user: req.user.id };
        if (req.query.language) filter.language = req.query.language;
        if (req.query.status) filter.status = req.query.status;

        const [submissions, total] = await Promise.all([
            Submission.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('problem', 'title difficulty slug topics')
                .select('problem language status runtime memory testCasesPassed totalTestCases createdAt'),
            Submission.countDocuments(filter)
        ]);

        res.json({
            submissions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/profiles/solved-problems
// @desc    Get solved problems for current user (paginated, newest solved first)
// @access  Private
router.get('/solved-problems', protect, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const skip = (page - 1) * limit;
        const userObjectId = new mongoose.Types.ObjectId(req.user.id);

        const [countResult, solvedAgg] = await Promise.all([
            Submission.aggregate([
                { $match: { user: userObjectId, status: 'accepted' } },
                { $group: { _id: '$problem' } },
                { $count: 'total' }
            ]),
            Submission.aggregate([
                { $match: { user: userObjectId, status: 'accepted' } },
                {
                    $group: {
                        _id: '$problem',
                        lastSolvedAt: { $max: '$createdAt' },
                        acceptedCount: { $sum: 1 }
                    }
                },
                { $sort: { lastSolvedAt: -1 } },
                { $skip: skip },
                { $limit: limit }
            ])
        ]);

        const total = countResult[0]?.total || 0;
        const problemIds = solvedAgg.map(item => item._id);

        const problems = await Problem.find({ _id: { $in: problemIds } })
            .select('title difficulty slug topics companies submissionAcceptanceRate')
            .lean();
        const problemMap = new Map(problems.map(p => [p._id.toString(), p]));

        const solvedProblems = solvedAgg
            .map((entry) => {
                const problem = problemMap.get(entry._id.toString());
                if (!problem) return null;
                return {
                    ...problem,
                    lastSolvedAt: entry.lastSolvedAt,
                    acceptedCount: entry.acceptedCount
                };
            })
            .filter(Boolean);

        res.json({
            solvedProblems,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
                hasMore: page * limit < total
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/profiles/progress
// @desc    Get comprehensive progress summary
// @access  Private
router.get('/progress', protect, async (req, res) => {
    try {
        const historyPage = Math.max(parseInt(req.query.historyPage, 10) || 1, 1);
        const historyLimit = Math.min(Math.max(parseInt(req.query.historyLimit, 10) || 20, 5), 100);

        const user = await User.findById(req.user.id)
            .select('stats solvedProblems streak level xp badges rating contestStats performanceStats totalSolvedEasy totalSolvedMedium totalSolvedHard problemAcceptanceRate finalScore globalRank');

        if (!user) return res.status(404).json({ message: 'User not found' });

        const [analytics, allProblems, allSubmissions] = await Promise.all([
            UserAnalytics.findOne({ user: req.user.id }),
            Problem.find(buildPublishedProblemMatch({}))
                .select('topics topic')
                .lean(),
            Submission.find({ user: req.user.id })
                .sort({ createdAt: -1 })
                .populate('problem', 'title difficulty slug topics topic')
                .select('problem language status runtime memory createdAt')
                .lean()
        ]);

        // Recent submissions (last 10)
        const recentSubmissions = allSubmissions.slice(0, 10);

        // Acceptance rate from actual submission table
        const totalSubmissions = allSubmissions.length;
        const acceptedSubmissions = allSubmissions.filter((submission) => submission.status === 'accepted').length;
        const acceptanceRate = totalSubmissions > 0
            ? roundTo2((acceptedSubmissions / totalSubmissions) * 100)
            : 0;

        await globalRankService.recalculateUserMetrics(req.user.id);
        let rankedUser = await User.findById(req.user.id).select('totalSolvedEasy totalSolvedMedium totalSolvedHard problemAcceptanceRate finalScore globalRank');

        if (!Number.isFinite(rankedUser?.globalRank) || rankedUser.globalRank <= 0) {
            await globalRankService.recomputeGlobalRanks();
            rankedUser = await User.findById(req.user.id).select('totalSolvedEasy totalSolvedMedium totalSolvedHard problemAcceptanceRate finalScore globalRank');
        }
        const globalRank = rankedUser?.globalRank || null;

        const totalProblemsByTopic = new Map();
        allProblems.forEach((problem) => {
            const topics = extractProblemTopics(problem);
            topics.forEach((topic) => {
                totalProblemsByTopic.set(topic, (totalProblemsByTopic.get(topic) || 0) + 1);
            });
        });

        const topicStatsMap = new Map();
        const practiceHistoryMap = new Map();

        const getTopicStats = (topic) => {
            if (!topicStatsMap.has(topic)) {
                topicStatsMap.set(topic, {
                    topic,
                    totalProblems: totalProblemsByTopic.get(topic) || 0,
                    totalSubmissions: 0,
                    acceptedSubmissions: 0,
                    attemptedProblemSet: new Set(),
                    solvedProblemSet: new Set(),
                    lastSubmittedAt: null
                });
            }
            return topicStatsMap.get(topic);
        };

        allSubmissions.forEach((submission) => {
            const problem = submission.problem;
            if (!problem || !problem._id) return;

            const problemId = problem._id.toString();
            const submittedAt = submission.createdAt ? new Date(submission.createdAt) : null;

            if (!practiceHistoryMap.has(problemId)) {
                practiceHistoryMap.set(problemId, {
                    id: problemId,
                    problem: {
                        _id: problem._id,
                        title: problem.title,
                        difficulty: problem.difficulty,
                        slug: problem.slug,
                        topics: extractProblemTopics(problem)
                    },
                    lastSubmittedAt: submission.createdAt,
                    lastResult: submission.status,
                    submissionsCount: 0,
                    acceptedCount: 0,
                    isSolved: false,
                    submissions: [],
                    statusBreakdown: {}
                });
            }

            const historyEntry = practiceHistoryMap.get(problemId);
            historyEntry.submissionsCount += 1;
            historyEntry.statusBreakdown[submission.status] = (historyEntry.statusBreakdown[submission.status] || 0) + 1;
            historyEntry.submissions.push({
                _id: submission._id,
                problem: {
                    _id: problem._id,
                    title: problem.title,
                    difficulty: problem.difficulty,
                    slug: problem.slug
                },
                language: submission.language,
                runtime: submission.runtime,
                memory: submission.memory,
                status: submission.status,
                createdAt: submission.createdAt
            });
            if (submission.status === 'accepted') {
                historyEntry.acceptedCount += 1;
                historyEntry.isSolved = true;
            }

            const currentLastTime = historyEntry.lastSubmittedAt ? new Date(historyEntry.lastSubmittedAt) : null;
            if (!currentLastTime || (submittedAt && submittedAt > currentLastTime)) {
                historyEntry.lastSubmittedAt = submission.createdAt;
                historyEntry.lastResult = submission.status;
            }

            const topics = extractProblemTopics(problem);
            topics.forEach((topic) => {
                const topicStats = getTopicStats(topic);
                topicStats.totalSubmissions += 1;
                topicStats.attemptedProblemSet.add(problemId);
                if (submission.status === 'accepted') {
                    topicStats.acceptedSubmissions += 1;
                    topicStats.solvedProblemSet.add(problemId);
                }
                if (!topicStats.lastSubmittedAt || (submittedAt && submittedAt > topicStats.lastSubmittedAt)) {
                    topicStats.lastSubmittedAt = submittedAt;
                }
            });
        });

        totalProblemsByTopic.forEach((totalProblems, topic) => {
            if (!topicStatsMap.has(topic)) {
                topicStatsMap.set(topic, {
                    topic,
                    totalProblems,
                    totalSubmissions: 0,
                    acceptedSubmissions: 0,
                    attemptedProblemSet: new Set(),
                    solvedProblemSet: new Set(),
                    lastSubmittedAt: null
                });
            }
        });

        const topicProgress = Array.from(topicStatsMap.values())
            .map((topicStats) => {
                const attemptedProblems = topicStats.attemptedProblemSet.size;
                const solvedProblems = topicStats.solvedProblemSet.size;
                const topicAcceptanceRate = topicStats.totalSubmissions > 0
                    ? roundTo2((topicStats.acceptedSubmissions / topicStats.totalSubmissions) * 100)
                    : 0;
                const coverageRate = topicStats.totalProblems > 0
                    ? roundTo2((solvedProblems / topicStats.totalProblems) * 100)
                    : 0;
                const activityBoost = Math.min(12, Math.log2(topicStats.totalSubmissions + 1) * 4);
                const masteryScore = Math.round(Math.min(
                    100,
                    (coverageRate * 0.55) + (topicAcceptanceRate * 0.35) + activityBoost
                ));

                return {
                    topic: topicStats.topic,
                    totalProblems: topicStats.totalProblems,
                    attemptedProblems,
                    solvedProblems,
                    totalSubmissions: topicStats.totalSubmissions,
                    acceptedSubmissions: topicStats.acceptedSubmissions,
                    acceptanceRate: topicAcceptanceRate,
                    coverageRate,
                    masteryScore,
                    lastSubmittedAt: topicStats.lastSubmittedAt
                };
            })
            .sort((a, b) => {
                if (b.solvedProblems !== a.solvedProblems) return b.solvedProblems - a.solvedProblems;
                if (b.totalSubmissions !== a.totalSubmissions) return b.totalSubmissions - a.totalSubmissions;
                if (b.coverageRate !== a.coverageRate) return b.coverageRate - a.coverageRate;
                return a.topic.localeCompare(b.topic);
            });

        const allPracticeHistory = Array.from(practiceHistoryMap.values())
            .map((entry) => ({
                ...entry,
                submissions: (entry.submissions || [])
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            }))
            .sort((a, b) => new Date(b.lastSubmittedAt) - new Date(a.lastSubmittedAt));
        const practiceHistoryTotal = allPracticeHistory.length;
        const practiceHistoryPages = Math.max(1, Math.ceil(practiceHistoryTotal / historyLimit));
        const practiceHistoryStart = (historyPage - 1) * historyLimit;
        const practiceHistory = allPracticeHistory.slice(practiceHistoryStart, practiceHistoryStart + historyLimit);

        const attemptedTopics = topicProgress.filter((topic) => topic.attemptedProblems > 0).length;
        const masteredTopics = topicProgress.filter((topic) => topic.masteryScore >= 70 && topic.solvedProblems > 0).length;
        const mergedStats = {
            ...(user.stats?.toObject ? user.stats.toObject() : user.stats),
            totalSubmissions,
            acceptedSubmissions,
            totalSolved: user.solvedProblems?.length || 0,
            totalSolvedEasy: rankedUser?.totalSolvedEasy || user.totalSolvedEasy || user.stats?.easySolved || 0,
            totalSolvedMedium: rankedUser?.totalSolvedMedium || user.totalSolvedMedium || user.stats?.mediumSolved || 0,
            totalSolvedHard: rankedUser?.totalSolvedHard || user.totalSolvedHard || user.stats?.hardSolved || 0,
            problemAcceptanceRate: rankedUser?.problemAcceptanceRate ?? user.problemAcceptanceRate ?? acceptanceRate,
            finalScore: rankedUser?.finalScore ?? user.finalScore ?? 0,
            globalRank
        };

        res.json({
            stats: mergedStats,
            streak: user.streak,
            level: user.level,
            xp: user.xp,
            badges: user.badges,
            totalSolved: user.solvedProblems.length,
            rating: user.rating,
            contestStats: user.contestStats,
            performanceStats: user.performanceStats,
            acceptanceRate,
            globalRank,
            finalScore: rankedUser?.finalScore ?? 0,
            problemAcceptanceRate: rankedUser?.problemAcceptanceRate ?? acceptanceRate,
            recentSubmissions,
            practiceHistory,
            practiceHistoryPagination: {
                page: historyPage,
                limit: historyLimit,
                total: practiceHistoryTotal,
                pages: practiceHistoryPages,
                hasMore: historyPage < practiceHistoryPages
            },
            topicSummary: {
                totalTopics: topicProgress.length,
                attemptedTopics,
                masteredTopics
            },
            topicProgress,
            analytics: analytics ? {
                languageStats: toPlainMap(analytics.languageStats),
                tagStats: toPlainMap(analytics.tagStats),
                heatmap: toPlainMap(analytics.heatmap),
                insights: analytics.insights,
                lastCalculated: analytics.lastCalculated
            } : null
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/profiles/daily-challenge-calendar
// @desc    Get month-wise daily challenge solve tracker
// @access  Private
router.get('/daily-challenge-calendar', protect, async (req, res) => {
    try {
        const now = new Date();
        const requestedYear = parseInt(req.query.year, 10);
        const requestedMonth = parseInt(req.query.month, 10); // 1-12

        const year = Number.isInteger(requestedYear)
            ? Math.max(2020, Math.min(2100, requestedYear))
            : now.getUTCFullYear();
        const month = Number.isInteger(requestedMonth)
            ? Math.max(1, Math.min(12, requestedMonth))
            : (now.getUTCMonth() + 1);

        const monthStartUtc = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
        const monthEndUtc = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
        const todayDateKey = formatUtcDateKey(now);

        await ensureChallengesForRange({
            startDate: monthStartUtc,
            endDate: monthEndUtc
        });

        const scheduledChallenges = await getChallengesInRange({
            startDate: monthStartUtc,
            endDate: monthEndUtc,
            populateProblem: true
        });

        if (!scheduledChallenges.length) {
            return res.json({
                year,
                month,
                monthLabel: monthStartUtc.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
                today: todayDateKey,
                totalDays: 0,
                solvedDays: 0,
                missedDays: 0,
                completionRate: 0,
                challenges: [],
                todayChallenge: null
            });
        }

        const challengeDays = scheduledChallenges
            .map((entry) => serializeChallenge(entry, now))
            .filter((entry) => entry?.date && entry?.problem?._id)
            .map((entry) => ({
                date: entry.date,
                problemId: String(entry.problem._id),
                source: entry.source,
                difficulty: entry.difficulty,
                expectedDifficulty: entry.expectedDifficulty,
                problem: entry.problem
            }));

        const trackedProblemIds = [...new Set(challengeDays.map((entry) => entry.problemId))];

        const completionEvents = await ActivityEvent.find({
            userId: req.user.id,
            activityType: 'daily_challenge_completed',
            createdAt: { $gte: monthStartUtc, $lte: monthEndUtc }
        })
            .select('problemId createdAt metadata')
            .sort({ createdAt: 1 })
            .lean();

        const completionEventsByDateKey = new Map();
        completionEvents.forEach((eventDoc) => {
            const metadataDateKey = String(eventDoc?.metadata?.dateKey || '').trim();
            const dateKey = metadataDateKey || formatUtcDateKey(eventDoc?.createdAt);
            if (!dateKey) return;
            if (!completionEventsByDateKey.has(dateKey)) {
                completionEventsByDateKey.set(dateKey, []);
            }
            completionEventsByDateKey.get(dateKey).push(eventDoc);
        });

        const acceptedSubmissions = await Submission.find({
            user: req.user.id,
            status: 'accepted',
            problem: { $in: trackedProblemIds },
            createdAt: { $gte: monthStartUtc, $lte: monthEndUtc }
        })
            .select('problem createdAt')
            .sort({ createdAt: 1 })
            .lean();

        const acceptedByDateKey = new Map();
        acceptedSubmissions.forEach((submission) => {
            const dateKey = formatUtcDateKey(submission.createdAt);
            if (!dateKey) return;
            if (!acceptedByDateKey.has(dateKey)) {
                acceptedByDateKey.set(dateKey, []);
            }
            acceptedByDateKey.get(dateKey).push(submission);
        });

        const challenges = challengeDays.map((entry) => {
            let solvedAt = null;
            const sameDayCompletionEvents = completionEventsByDateKey.get(entry.date) || [];

            for (const eventDoc of sameDayCompletionEvents) {
                const completedProblemId = eventDoc?.problemId
                    ? String(eventDoc.problemId)
                    : String(eventDoc?.metadata?.problemId || '').trim();
                if (!completedProblemId || completedProblemId === entry.problemId) {
                    solvedAt = eventDoc.createdAt;
                    break;
                }
            }

            if (!solvedAt) {
                const sameDayAccepted = acceptedByDateKey.get(entry.date) || [];

                for (const submission of sameDayAccepted) {
                    if (String(submission.problem) === entry.problemId) {
                        solvedAt = submission.createdAt;
                        break;
                    }
                }
            }

            const problemTopics = extractProblemTopics(entry.problem);

            return {
                date: entry.date,
                solved: Boolean(solvedAt),
                solvedAt,
                source: entry.source,
                difficulty: entry.difficulty,
                expectedDifficulty: entry.expectedDifficulty,
                problem: {
                    _id: entry.problem._id,
                    title: entry.problem.title,
                    slug: entry.problem.slug,
                    difficulty: entry.problem.difficulty,
                    topics: problemTopics,
                    topic: problemTopics[0] || null
                }
            };
        });

        const solvedDays = challenges.filter((entry) => entry.solved).length;
        const totalDays = challenges.length;
        const completionRate = totalDays > 0 ? roundTo2((solvedDays / totalDays) * 100) : 0;
        const todayChallenge = challenges.find((entry) => entry.date === todayDateKey) || null;

        res.json({
            year,
            month,
            monthLabel: monthStartUtc.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
            today: todayDateKey,
            totalDays,
            solvedDays,
            missedDays: Math.max(0, totalDays - solvedDays),
            completionRate,
            challenges,
            todayChallenge
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
