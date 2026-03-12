const mongoose = require('mongoose');
const Contest = require('../models/Contest');
const ContestParticipant = require('../models/ContestParticipant');
const ContestResult = require('../models/ContestResult');
const Problem = require('../models/Problem');
const User = require('../models/User');
const notificationService = require('../services/notificationService');
const { recordActivity } = require('../services/social/activityService');
const {
    computeContestStatus,
    sortByLeaderboardRules,
    syncAllContestStatuses,
    syncContestStatus,
    markParticipantExited,
    markParticipantFinished,
    rejoinParticipant,
    touchParticipantActivity,
    finalizeContest,
    getContestProgressSummary,
    getContestHistoryForUser,
    getFriendsContestLeaderboard,
    getContestAnalyticsSnapshot
} = require('../services/contestService');

const buildActionLabel = (status) => {
    if (status === 'upcoming') return 'Register';
    if (status === 'running') return 'Enter Contest';
    return 'View Results';
};

const toParticipantCount = (value) => {
    const parsed = Number(value || 0);
    return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeDifficultyLabel = (difficulty) => {
    const normalized = String(difficulty || '').trim().toLowerCase();
    if (normalized === 'hard') return 'Hard';
    if (normalized === 'medium') return 'Medium';
    return 'Easy';
};

const normalizeScoringConfig = (scoringConfig = {}) => ({
    easyBaseScore: Math.max(0, Number(scoringConfig?.easyBaseScore ?? 5)),
    mediumBaseScore: Math.max(0, Number(scoringConfig?.mediumBaseScore ?? 7)),
    hardBaseScore: Math.max(0, Number(scoringConfig?.hardBaseScore ?? 10)),
    timePenaltyPerMinute: Math.max(0, Number(scoringConfig?.timePenaltyPerMinute ?? 0.02)),
    wrongAttemptPenalty: Math.max(0, Number(scoringConfig?.wrongAttemptPenalty ?? 0.05))
});

const getDifficultyBaseScore = (difficultyLabel, scoringConfig) => {
    const label = normalizeDifficultyLabel(difficultyLabel);
    if (label === 'Hard') return Number(scoringConfig.hardBaseScore || 10);
    if (label === 'Medium') return Number(scoringConfig.mediumBaseScore || 7);
    return Number(scoringConfig.easyBaseScore || 5);
};

const normalizeRole = (role) => String(role || '').trim().toUpperCase();

const canViewNonApprovedContest = (role) => ['ADMIN', 'SUPER_ADMIN'].includes(normalizeRole(role));

const mapContestServiceErrorToHttp = (error) => {
    const code = String(error?.code || '').toUpperCase();
    if (code === 'INVALID_CONTEST_ID' || code === 'INVALID_CONTEST_OR_USER') return 400;
    if (code === 'CONTEST_NOT_FOUND' || code === 'NOT_FOUND') return 404;
    if (code === 'NOT_REGISTERED') return 403;
    if (code === 'CONTEST_NOT_RUNNING' || code === 'CONTEST_NOT_COMPLETED') return 400;
    if (code === 'REJOIN_DISABLED') return 403;
    if (code === 'PARTICIPANT_EXITED') return 400;
    if (code === 'PARTICIPANT_FINISHED') return 409;
    if (code === 'ALREADY_FINISHED') return 409;
    return Number(error?.httpStatus || 500);
};

const isContestRegistrationOpen = (contestLike, status) => {
    if (!contestLike) return false;
    const approvalStatus = contestLike.approvalStatus || 'APPROVED';
    if (approvalStatus !== 'APPROVED') return false;
    if (status !== 'upcoming') return false;

    if (!contestLike.registrationOpenDate) {
        return true;
    }

    const openAt = new Date(contestLike.registrationOpenDate);
    if (Number.isNaN(openAt.getTime())) return true;
    return Date.now() >= openAt.getTime();
};

const mapContestCard = (contestDoc, options = {}) => {
    const status = computeContestStatus(contestDoc);
    const participantsCount = toParticipantCount(contestDoc.participantsCount);
    const isRegistrationOpen = isContestRegistrationOpen(contestDoc, status);
    const exitRules = contestDoc.exitRules || {};

    return {
        _id: contestDoc._id,
        id: contestDoc._id,
        title: contestDoc.title,
        description: contestDoc.description,
        startTime: contestDoc.startTime,
        endTime: contestDoc.endTime,
        registrationOpenDate: contestDoc.registrationOpenDate || null,
        participantsCount,
        participantCount: participantsCount,
        problems: contestDoc.problems,
        status,
        statusBadge: status,
        approvalStatus: contestDoc.approvalStatus || 'APPROVED',
        isRegistrationOpen,
        isRegistered: Boolean(options.isRegistered),
        leaderboardLocked: Boolean(contestDoc.leaderboardLocked),
        resultsFinalizedAt: contestDoc.resultsFinalizedAt || null,
        exitRules: {
            allowRejoin: exitRules.allowRejoin !== false,
            autoExitOnInactivity: Boolean(exitRules.autoExitOnInactivity),
            inactivityTimeoutMinutes: Number(exitRules.inactivityTimeoutMinutes || 20)
        },
        scoringConfig: normalizeScoringConfig(contestDoc?.scoringConfig || {}),
        action: buildActionLabel(status),
        createdAt: contestDoc.createdAt
    };
};

const getUserRating = (user) => {
    if (!user) return 0;
    const rating = Number(user?.rating?.current ?? user?.rating ?? 0);
    return Number.isFinite(rating) ? rating : 0;
};

const mapParticipantRow = (participant, rank = null) => ({
    userId: participant.userId?._id || participant.userId,
    username: participant.userId?.username || 'Unknown',
    rating: getUserRating(participant.userId),
    registrationTime: participant.registeredAt || null,
    score: Number(participant.score || 0),
    solvedCount: Number(participant.solvedCount || 0),
    totalTime: Number(participant.totalTime ?? participant.penalty ?? 0),
    penalty: Number(participant.totalTime ?? participant.penalty ?? 0),
    wrongSubmissions: Number(participant.wrongSubmissions || 0),
    submissionCount: Number(participant.submissionCount || 0),
    status: participant.status || 'active',
    exitTime: participant.exitTime || null,
    rank
});

const ensureValidProblemIds = async (problemIds) => {
    const normalized = [...new Set((problemIds || []).map((id) => String(id)))];
    if (normalized.length === 0) {
        return { isValid: false, message: 'problems must contain at least one problem id' };
    }

    const validObjectIds = normalized.filter((id) => mongoose.Types.ObjectId.isValid(id));

    if (validObjectIds.length !== normalized.length) {
        return { isValid: false, message: 'problems array contains invalid ObjectId values' };
    }

    const existingCount = await Problem.countDocuments({ _id: { $in: validObjectIds } });
    if (existingCount !== validObjectIds.length) {
        return { isValid: false, message: 'one or more problems were not found' };
    }

    return {
        isValid: true,
        problemIds: validObjectIds.map((id) => new mongoose.Types.ObjectId(id))
    };
};

const mapLeaderboardRow = (participant, index) => ({
    rank: index + 1,
    userId: participant.userId?._id || participant.userId,
    username: participant.userId?.username || 'Unknown',
    rating: getUserRating(participant.userId),
    score: Number(participant.score || 0),
    solvedCount: Number(participant.solvedCount || 0),
    totalTime: Number(participant.totalTime ?? participant.penalty ?? 0),
    penalty: Number(participant.totalTime ?? participant.penalty ?? 0),
    wrongSubmissions: Number(participant.wrongSubmissions || 0),
    submissionCount: Number(participant.submissionCount || 0),
    status: participant.status || 'active',
    lastSubmissionTime: participant.lastSubmissionTime || null
});

const getContestByIdOr404 = async (contestId, populateProblems = false) => {
    let query = Contest.findById(contestId);
    if (populateProblems) {
        query = query.populate('problems', 'title difficulty');
    }

    const contest = await query;
    if (!contest) {
        return null;
    }

    await syncContestStatus(contest);
    return contest;
};

exports.createContest = async (req, res) => {
    try {
        const {
            title,
            description = '',
            startTime,
            endTime,
            registrationOpenDate,
            problems,
            rules = [],
            wrongSubmissionPenalty,
            exitRules,
            scoringConfig
        } = req.body;

        // Validate dates
        const start = new Date(startTime);
        const end = new Date(endTime);
        if (isNaN(start.getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid start time' });
        }
        if (isNaN(end.getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid end time' });
        }
        if (end <= start) {
            return res.status(400).json({ success: false, message: 'End time must be after start time' });
        }

        let registrationOpen = null;
        if (registrationOpenDate) {
            registrationOpen = new Date(registrationOpenDate);
            if (Number.isNaN(registrationOpen.getTime())) {
                return res.status(400).json({ success: false, message: 'Invalid registration open date' });
            }
            if (registrationOpen > start) {
                return res.status(400).json({ success: false, message: 'registrationOpenDate must be before contest startTime' });
            }
        }

        const normalizedScoringConfig = normalizeScoringConfig(scoringConfig || {});

        // Normalize problems: frontend may send [{problem, points/baseScore, order, difficulty}] objects.
        const rawProblems = Array.isArray(problems) ? problems : [];
        const problemIds = rawProblems.map((p) => (typeof p === 'object' ? (p.problem || p.id || p._id) : p));
        const problemValidation = await ensureValidProblemIds(problemIds);
        if (!problemValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: problemValidation.message
            });
        }

        const problemDocs = await Problem.find({ _id: { $in: problemValidation.problemIds } })
            .select('_id difficulty')
            .lean();
        const difficultyById = new Map(
            problemDocs.map((entry) => [String(entry._id), normalizeDifficultyLabel(entry?.difficulty)])
        );

        const scoringByProblemId = new Map();
        rawProblems.forEach((entry) => {
            const row = entry && typeof entry === 'object' ? entry : { problem: entry };
            const problemId = String(row.problem || row.id || row._id || '').trim();
            if (!problemId || !mongoose.Types.ObjectId.isValid(problemId)) return;

            const difficulty = normalizeDifficultyLabel(row.difficulty || difficultyById.get(problemId));
            const providedBaseScore = Number(row.baseScore ?? row.points);
            const baseScore = Number.isFinite(providedBaseScore)
                ? Math.max(0, providedBaseScore)
                : getDifficultyBaseScore(difficulty, normalizedScoringConfig);

            scoringByProblemId.set(problemId, {
                problemId: new mongoose.Types.ObjectId(problemId),
                difficulty,
                baseScore
            });
        });

        problemValidation.problemIds.forEach((problemObjectId) => {
            const key = String(problemObjectId);
            if (scoringByProblemId.has(key)) return;
            const difficulty = normalizeDifficultyLabel(difficultyById.get(key));
            scoringByProblemId.set(key, {
                problemId: new mongoose.Types.ObjectId(key),
                difficulty,
                baseScore: getDifficultyBaseScore(difficulty, normalizedScoringConfig)
            });
        });

        const normalizedProblemScoring = [...scoringByProblemId.values()];

        // Super admins auto-approve, regular admins go to pending
        const userRole = String(req.user.role || '').toUpperCase();
        const approvalStatus = userRole === 'SUPER_ADMIN' ? 'APPROVED' : 'PENDING';

        const contest = await Contest.create({
            title: title?.trim(),
            description,
            startTime: start,
            endTime: end,
            registrationOpenDate: registrationOpen,
            problems: problemValidation.problemIds,
            rules,
            scoringConfig: normalizedScoringConfig,
            problemScoring: normalizedProblemScoring,
            wrongSubmissionPenalty: wrongSubmissionPenalty || { enabled: false, minutes: 10 },
            exitRules: {
                allowRejoin: exitRules?.allowRejoin !== false,
                autoExitOnInactivity: Boolean(exitRules?.autoExitOnInactivity),
                inactivityTimeoutMinutes: Math.max(5, Number(exitRules?.inactivityTimeoutMinutes || 20))
            },
            participantsCount: 0,
            status: computeContestStatus({ startTime: start, endTime: end }),
            approvalStatus,
            createdBy: req.user._id
        });

        const io = req?.app?.get?.('io');
        if (io) {
            io.emit('newContestAdded', { contestId: contest._id });
        }

        return res.status(201).json({
            success: true,
            message: 'Contest created successfully',
            contest: mapContestCard(contest)
        });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({ success: false, message: 'Contest with this title already exists' });
        }
        // Extract Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors || {}).map(e => e.message).join(', ');
            return res.status(400).json({ success: false, message: messages || 'Validation failed' });
        }

        return res.status(500).json({ success: false, message: error.message || 'Failed to create contest' });
    }
};

exports.getAllContests = async (req, res) => {
    try {
        await syncAllContestStatuses();

        const userRole = normalizeRole(req.user?.role);
        const canViewPending = canViewNonApprovedContest(userRole);
        const filters = canViewPending ? {} : { approvalStatus: 'APPROVED' };

        const contests = await Contest.find(filters)
            .populate('createdBy', 'username')
            .sort({ startTime: 1, createdAt: -1 })
            .lean();

        const contestIds = contests.map((contest) => contest._id);
        let registeredContestIds = new Set();

        if (req.user?._id && contestIds.length > 0) {
            const registrations = await ContestParticipant.find({
                userId: req.user._id,
                contestId: { $in: contestIds }
            })
                .select('contestId')
                .lean();

            registeredContestIds = new Set(registrations.map((entry) => String(entry.contestId)));
        }

        const mapped = contests.map(c => ({
            ...mapContestCard(c, {
                isRegistered: registeredContestIds.has(String(c._id))
            }),
            creatorName: c.createdBy?.username || 'Unknown'
        }));

        // Return both flat list and grouped for different consumers
        const grouped = { upcoming: [], running: [], completed: [] };
        for (const contest of mapped) {
            if (grouped[contest.status]) {
                grouped[contest.status].push(contest);
            }
        }

        return res.json({
            success: true,
            contests: mapped,
            grouped
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Failed to fetch contests' });
    }
};

exports.getContest = async (req, res) => {
    try {
        const contest = await getContestByIdOr404(req.params.id, true);
        if (!contest) {
            return res.status(404).json({ success: false, message: 'Contest not found' });
        }

        const userRole = normalizeRole(req.user?.role);
        if ((contest.approvalStatus || 'APPROVED') !== 'APPROVED' && !canViewNonApprovedContest(userRole)) {
            return res.status(404).json({ success: false, message: 'Contest not found' });
        }

        let isRegistered = false;
        let currentParticipant = null;
        const currentUserId = req.user?._id || req.user?.id;

        const participantDocs = await ContestParticipant.find({ contestId: contest._id })
            .populate('userId', 'username rating')
            .lean();
        const sortedParticipants = sortByLeaderboardRules(participantDocs);
        const participants = sortedParticipants.map((participant, index) => mapParticipantRow(
            participant,
            computeContestStatus(contest) === 'completed' ? index + 1 : null
        ));

        if (currentUserId) {
            currentParticipant = sortedParticipants.find((entry) => String(entry.userId?._id || entry.userId) === String(currentUserId)) || null;
            isRegistered = Boolean(currentParticipant);
        }

        const contestStatus = computeContestStatus(contest);
        const isRegistrationOpen = isContestRegistrationOpen(contest, contestStatus);

        const durationMs = new Date(contest.endTime).getTime() - new Date(contest.startTime).getTime();
        const durationMinutes = Math.max(0, Math.floor(durationMs / (1000 * 60)));

        const scoringByProblemId = new Map(
            (contest.problemScoring || []).map((entry) => [
                String(entry.problemId),
                {
                    baseScore: Number(entry.baseScore || 0),
                    difficulty: normalizeDifficultyLabel(entry.difficulty)
                }
            ])
        );

        const problems = (contest.problems || []).map((problem) => {
            const pid = String(problem?._id || '');
            const scoring = scoringByProblemId.get(pid);
            const resolvedDifficulty = scoring?.difficulty || normalizeDifficultyLabel(problem?.difficulty);
            return {
                id: problem?._id,
                title: problem?.title || 'Untitled Problem',
                difficulty: resolvedDifficulty,
                baseScore: Number(scoring?.baseScore ?? getDifficultyBaseScore(resolvedDifficulty, contest?.scoringConfig || {}))
            };
        });

        const progressSummary = currentUserId
            ? await getContestProgressSummary({ contestId: contest._id, userId: currentUserId })
            : null;

        return res.json({
            success: true,
            contest: {
                id: contest._id,
                title: contest.title,
                description: contest.description,
                startTime: contest.startTime,
                endTime: contest.endTime,
                registrationOpenDate: contest.registrationOpenDate || null,
                status: contestStatus,
                approvalStatus: contest.approvalStatus || 'APPROVED',
                isRegistrationOpen,
                isRegistered,
                participantsCount: Math.max(toParticipantCount(contest.participantsCount), participants.length),
                participantCount: Math.max(toParticipantCount(contest.participantsCount), participants.length),
                leaderboardLocked: Boolean(contest.leaderboardLocked),
                resultsFinalizedAt: contest.resultsFinalizedAt || null,
                scoringConfig: normalizeScoringConfig(contest?.scoringConfig || {}),
                exitRules: {
                    allowRejoin: contest?.exitRules?.allowRejoin !== false,
                    autoExitOnInactivity: Boolean(contest?.exitRules?.autoExitOnInactivity),
                    inactivityTimeoutMinutes: Number(contest?.exitRules?.inactivityTimeoutMinutes || 20)
                },
                createdAt: contest.createdAt,
                problems,
                participants
            },
            overview: {
                description: contest.description,
                durationMinutes,
                rules: Array.isArray(contest.rules) && contest.rules.length > 0
                    ? contest.rules
                    : [
                        'Score uses baseScore - time penalty - wrong submission penalty for each solved problem.',
                        'Total time is the sum of solve time (minutes from contest start) for solved problems.',
                        'Leaderboard ranking uses total score, then total time, then fewer wrong submissions.'
                ],
                totalProblems: problems.length
            },
            problems,
            participation: progressSummary?.result || (currentParticipant ? {
                rank: null,
                score: Number(currentParticipant.score || 0),
                problemsSolved: Number(currentParticipant.solvedCount || 0),
                totalTime: Number(currentParticipant.totalTime ?? currentParticipant.penalty ?? 0),
                penaltyTime: Number(currentParticipant.totalTime ?? currentParticipant.penalty ?? 0),
                wrongSubmissions: Number(currentParticipant.wrongSubmissions || 0),
                submissionCount: Number(currentParticipant.submissionCount || 0),
                status: currentParticipant.status || 'active',
                exitTime: currentParticipant.exitTime || null
            } : null)
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Failed to fetch contest details' });
    }
};

exports.registerForContest = async (req, res) => {
    const session = await mongoose.startSession();
    let registeredContestId = null;

    try {
        await session.withTransaction(async () => {
            const contest = await Contest.findById(req.params.id).session(session);
            if (!contest) {
                const notFoundError = new Error('Contest not found');
                notFoundError.httpStatus = 404;
                throw notFoundError;
            }

            await syncContestStatus(contest, session);

            if ((contest.approvalStatus || 'APPROVED') !== 'APPROVED') {
                const approvalError = new Error('Contest is not open for registration');
                approvalError.httpStatus = 400;
                throw approvalError;
            }

            if (contest.status !== 'upcoming') {
                const statusError = new Error('Registration is allowed only for upcoming contests');
                statusError.httpStatus = 400;
                throw statusError;
            }

            if (contest.registrationOpenDate) {
                const openAt = new Date(contest.registrationOpenDate);
                if (!Number.isNaN(openAt.getTime()) && Date.now() < openAt.getTime()) {
                    const timingError = new Error('Registration has not opened yet');
                    timingError.httpStatus = 400;
                    throw timingError;
                }
            }

            const existing = await ContestParticipant.findOne({
                contestId: contest._id,
                userId: req.user.id
            }).session(session);

            if (existing) {
                const duplicateError = new Error('Already registered for this contest');
                duplicateError.httpStatus = 409;
                throw duplicateError;
            }

            await ContestParticipant.create([
                {
                    contestId: contest._id,
                    userId: req.user.id,
                    registeredAt: new Date(),
                    status: 'active',
                    lockNewSubmissions: false,
                    lastActiveAt: new Date(),
                    submissionCount: 0
                }
            ], { session });

            contest.participantsCount = toParticipantCount(contest.participantsCount) + 1;
            await contest.save({ session });
            registeredContestId = contest._id;
        });

        if (registeredContestId) {
            try {
                const contestForActivity = await Contest.findById(registeredContestId)
                    .select('_id title')
                    .lean();
                await recordActivity(req, {
                    userId: req.user.id,
                    activityType: 'contest_joined',
                    contestId: registeredContestId,
                    metadata: {
                        contestTitle: contestForActivity?.title || '',
                        link: `/contest/${registeredContestId}`
                    },
                    dedupeKey: `contest_joined:${registeredContestId}`,
                    dedupeWindowMinutes: 60 * 24
                });
            } catch (activityError) {
                console.error('Activity event create failed (contest_joined):', activityError.message);
            }
        }

        return res.status(201).json({
            success: true,
            message: 'Registered successfully'
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'Already registered for this contest' });
        }

        const statusCode = error.httpStatus || 500;
        return res.status(statusCode).json({ success: false, message: error.message || 'Registration failed' });
    } finally {
        session.endSession();
    }
};

exports.getContestParticipants = async (req, res) => {
    try {
        const contest = await getContestByIdOr404(req.params.id, false);
        if (!contest) {
            return res.status(404).json({ success: false, message: 'Contest not found' });
        }

        const participants = await ContestParticipant.find({ contestId: contest._id })
            .populate('userId', 'username rating')
            .lean();

        const sorted = sortByLeaderboardRules(participants);

        const rows = sorted.map((participant, index) => mapParticipantRow(
            participant,
            contest.status === 'completed' ? index + 1 : null
        ));

        return res.json({
            success: true,
            contest: {
                id: contest._id,
                title: contest.title,
                status: contest.status
            },
            participants: rows
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Failed to fetch participants' });
    }
};

exports.getLeaderboard = async (req, res) => {
    try {
        const contest = await getContestByIdOr404(req.params.id, false);
        if (!contest) {
            return res.status(404).json({ success: false, message: 'Contest not found' });
        }

        const contestStatus = computeContestStatus(contest);
        let leaderboard = [];
        let participantCount = 0;

        if (contestStatus === 'completed') {
            // Auto-finalize once after contest completion so rankings are locked and profile stats are synced.
            try {
                await finalizeContest({ contestId: contest._id, source: 'system', force: false });
            } catch (finalizeError) {
                if (finalizeError?.code !== 'CONTEST_NOT_COMPLETED') {
                    console.error('Contest auto-finalize failed:', finalizeError.message);
                }
            }

            const finalizedRows = await ContestResult.find({ contestId: contest._id })
                .populate('userId', 'username rating')
                .sort({ rank: 1, score: -1, totalTime: 1, wrongSubmissions: 1 })
                .lean();
            participantCount = finalizedRows.length;
            leaderboard = finalizedRows.map((row, index) => ({
                rank: Number(row.rank || index + 1),
                userId: row.userId?._id || row.userId,
                username: row.userId?.username || 'Unknown',
                rating: getUserRating(row.userId),
                score: Number(row.score || 0),
                solvedCount: Number(row.problemsSolved || 0),
                totalTime: Number(row.totalTime || row.penaltyTime || 0),
                penalty: Number(row.totalTime || row.penaltyTime || 0),
                wrongSubmissions: Number(row.wrongSubmissions || 0),
                submissionCount: Number(row.submissionCount || 0),
                status: row.status || 'finished',
                lastSubmissionTime: row.updatedAt || null,
                registrationTime: row.createdAt || null
            }));
        } else {
            const participants = await ContestParticipant.find({ contestId: contest._id })
                .populate('userId', 'username rating')
                .lean();
            const sorted = sortByLeaderboardRules(participants);
            participantCount = sorted.length;
            leaderboard = sorted.map(mapLeaderboardRow);
        }

        const winners = contestStatus === 'completed'
            ? leaderboard.slice(0, 3).map((entry, index) => ({
                ...entry,
                medal: index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze'
            }))
            : [];

        return res.json({
            success: true,
            contest: {
                id: contest._id,
                title: contest.title,
                status: contestStatus
            },
            contestMeta: {
                contestId: contest._id,
                title: contest.title,
                participantCount,
                isCompleted: contestStatus === 'completed',
                leaderboardLocked: Boolean(contest.leaderboardLocked || contestStatus === 'completed'),
                resultsFinalizedAt: contest.resultsFinalizedAt || null
            },
            winners,
            leaderboard
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Failed to fetch leaderboard' });
    }
};

// ── Pending Contests (Super Admin) ──
exports.getPendingContests = async (req, res) => {
    try {
        const contests = await Contest.find({ approvalStatus: 'PENDING' })
            .populate('createdBy', 'username')
            .sort({ createdAt: -1 })
            .lean();

        const mapped = contests.map(c => ({
            ...mapContestCard(c),
            approvalStatus: c.approvalStatus,
            creatorName: c.createdBy?.username || 'Unknown',
            problems: c.problems
        }));

        return res.json({ success: true, contests: mapped });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Failed to fetch pending contests' });
    }
};

// ── Approve / Reject Contest (Super Admin) ──
exports.approveContest = async (req, res) => {
    try {
        const { action, note } = req.body;
        const contest = await getContestByIdOr404(req.params.id);

        if (action === 'approve') {
            contest.approvalStatus = 'APPROVED';
            contest.rejectionNote = '';
        } else if (action === 'reject') {
            contest.approvalStatus = 'REJECTED';
            contest.rejectionNote = note || '';
        } else {
            return res.status(400).json({ success: false, message: 'action must be "approve" or "reject"' });
        }

        await contest.save();

        // Broadcast notification to all users when contest is approved
        if (action === 'approve') {
            const users = await User.find({ role: { $in: ['user', 'USER'] } }).select('_id').lean();
            const userIds = users.map(u => u._id);
            notificationService.broadcastNotification(req, userIds, {
                type: 'contest',
                title: 'New Contest Announced 🏆',
                message: `"${contest.title}" is now live! Register and compete.`,
                link: `/contests`,
                icon: '🏆'
            }).catch(err => console.error('Contest broadcast notification failed:', err));
        }

        return res.json({ success: true, message: `Contest ${action}d successfully`, contest: mapContestCard(contest) });
    } catch (error) {
        if (error.status === 404) {
            return res.status(404).json({ success: false, message: error.message });
        }
        return res.status(500).json({ success: false, message: error.message || 'Failed to update contest' });
    }
};

// ── Delete Contest (Super Admin) ──
exports.deleteContest = async (req, res) => {
    try {
        const contest = await Contest.findById(req.params.id);
        if (!contest) {
            return res.status(404).json({ success: false, message: 'Contest not found' });
        }

        await ContestParticipant.deleteMany({ contestId: contest._id });
        await ContestResult.deleteMany({ contestId: contest._id });
        await Contest.findByIdAndDelete(contest._id);

        return res.json({ success: true, message: 'Contest deleted successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Failed to delete contest' });
    }
};

exports.exitContest = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const reason = String(req.body?.reason || 'manual_exit').trim() || 'manual_exit';
        let resultPayload = null;
        await session.withTransaction(async () => {
            resultPayload = await markParticipantExited({
                contestId: req.params.id,
                userId: req.user.id,
                reason,
                session
            });
        });

        try {
            await recordActivity(req, {
                userId: req.user.id,
                activityType: 'contest_exited',
                contestId: req.params.id,
                metadata: {
                    reason,
                    score: Number(resultPayload?.participant?.score || 0),
                    problemsSolved: Number(resultPayload?.participant?.solvedCount || 0),
                    totalTime: Number(resultPayload?.participant?.totalTime ?? resultPayload?.participant?.penalty ?? 0),
                    wrongSubmissions: Number(resultPayload?.participant?.wrongSubmissions || 0),
                    link: `/contest/${req.params.id}`
                },
                dedupeKey: `contest_exited:${req.params.id}`,
                dedupeWindowMinutes: 5
            });
        } catch (activityError) {
            console.error('Activity event create failed (contest_exited):', activityError.message);
        }

        return res.json({
            success: true,
            message: 'You have exited the contest. Your current progress has been saved.',
            progress: {
                contestId: req.params.id,
                status: 'exited',
                score: Number(resultPayload?.participant?.score || 0),
                problemsSolved: Number(resultPayload?.participant?.solvedCount || 0),
                totalTime: Number(resultPayload?.participant?.totalTime ?? resultPayload?.participant?.penalty ?? 0),
                penaltyTime: Number(resultPayload?.participant?.totalTime ?? resultPayload?.participant?.penalty ?? 0),
                wrongSubmissions: Number(resultPayload?.participant?.wrongSubmissions || 0),
                submissionCount: Number(resultPayload?.participant?.submissionCount || 0),
                exitTime: resultPayload?.participant?.exitTime || new Date()
            }
        });
    } catch (error) {
        const status = mapContestServiceErrorToHttp(error);
        return res.status(status).json({ success: false, message: error.message || 'Failed to exit contest' });
    } finally {
        session.endSession();
    }
};

exports.submitContest = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const reason = String(req.body?.reason || 'manual_submit').trim() || 'manual_submit';
        let resultPayload = null;
        await session.withTransaction(async () => {
            resultPayload = await markParticipantFinished({
                contestId: req.params.id,
                userId: req.user.id,
                reason,
                session
            });
        });

        try {
            await recordActivity(req, {
                userId: req.user.id,
                activityType: 'contest_finished',
                contestId: req.params.id,
                metadata: {
                    reason,
                    score: Number(resultPayload?.participant?.score || 0),
                    problemsSolved: Number(resultPayload?.participant?.solvedCount || 0),
                    totalTime: Number(resultPayload?.participant?.totalTime ?? resultPayload?.participant?.penalty ?? 0),
                    wrongSubmissions: Number(resultPayload?.participant?.wrongSubmissions || 0),
                    link: `/contest/${req.params.id}/leaderboard`
                },
                dedupeKey: `contest_submitted:${req.params.id}`,
                dedupeWindowMinutes: 60
            });
        } catch (activityError) {
            console.error('Activity event create failed (contest_finished):', activityError.message);
        }

        return res.json({
            success: true,
            message: 'Contest submitted successfully. Your progress is locked and saved.',
            progress: {
                contestId: req.params.id,
                status: 'finished',
                score: Number(resultPayload?.participant?.score || 0),
                problemsSolved: Number(resultPayload?.participant?.solvedCount || 0),
                totalTime: Number(resultPayload?.participant?.totalTime ?? resultPayload?.participant?.penalty ?? 0),
                penaltyTime: Number(resultPayload?.participant?.totalTime ?? resultPayload?.participant?.penalty ?? 0),
                wrongSubmissions: Number(resultPayload?.participant?.wrongSubmissions || 0),
                submissionCount: Number(resultPayload?.participant?.submissionCount || 0),
                finishedAt: resultPayload?.participant?.finishedAt || new Date()
            }
        });
    } catch (error) {
        const status = mapContestServiceErrorToHttp(error);
        return res.status(status).json({ success: false, message: error.message || 'Failed to submit contest' });
    } finally {
        session.endSession();
    }
};

exports.rejoinContest = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        let rejoinResult = null;
        await session.withTransaction(async () => {
            rejoinResult = await rejoinParticipant({
                contestId: req.params.id,
                userId: req.user.id,
                session
            });
        });

        return res.json({
            success: true,
            message: 'Rejoined contest successfully',
            status: rejoinResult?.participant?.status || 'active'
        });
    } catch (error) {
        const status = mapContestServiceErrorToHttp(error);
        return res.status(status).json({ success: false, message: error.message || 'Failed to rejoin contest' });
    } finally {
        session.endSession();
    }
};

exports.heartbeatContest = async (req, res) => {
    try {
        const touchedAt = await touchParticipantActivity({
            contestId: req.params.id,
            userId: req.user.id
        });
        return res.json({ success: true, touchedAt: touchedAt || new Date() });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Failed to update contest activity' });
    }
};

exports.getMyContestSummary = async (req, res) => {
    try {
        const contest = await Contest.findById(req.params.id).select('startTime endTime status');
        if (contest && computeContestStatus(contest) === 'completed') {
            try {
                await finalizeContest({ contestId: req.params.id, source: 'system', force: false });
            } catch (finalizeError) {
                if (finalizeError?.code !== 'CONTEST_NOT_COMPLETED') {
                    console.error('Contest finalize on summary failed:', finalizeError.message);
                }
            }
        }

        const summary = await getContestProgressSummary({
            contestId: req.params.id,
            userId: req.user.id
        });
        if (!summary) {
            return res.status(404).json({ success: false, message: 'Contest participation not found' });
        }
        return res.json({ success: true, summary });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Failed to load contest summary' });
    }
};

exports.getMyContestHistory = async (req, res) => {
    try {
        const limit = Number(req.query.limit || 25);
        const history = await getContestHistoryForUser({ userId: req.user.id, limit });
        return res.json({ success: true, history });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Failed to load contest history' });
    }
};

exports.getFriendsContestResults = async (req, res) => {
    try {
        const limit = Number(req.query.limit || 50);
        const includeSelf = String(req.query.includeSelf || 'true').toLowerCase() !== 'false';
        const leaderboard = await getFriendsContestLeaderboard({
            contestId: req.params.id,
            userId: req.user.id,
            includeSelf,
            limit
        });
        return res.json({ success: true, leaderboard });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Failed to fetch friends contest leaderboard' });
    }
};

exports.finalizeContestResults = async (req, res) => {
    try {
        const finalized = await finalizeContest({
            contestId: req.params.id,
            source: normalizeRole(req.user?.role) === 'SUPER_ADMIN' ? 'admin' : 'system',
            force: false
        });

        // Contest-level activity for top users
        const leaderboardRows = finalized?.leaderboardRows || [];
        const candidateUserIds = leaderboardRows.map((row) => row.userId).filter(Boolean);
        const users = candidateUserIds.length > 0
            ? await User.find({ _id: { $in: candidateUserIds } })
                .select('_id contestStats.participated')
                .lean()
            : [];
        const participatedMap = new Map(
            users.map((entry) => [String(entry._id), Number(entry?.contestStats?.participated || 0)])
        );

        const topRows = leaderboardRows.filter((row) => {
            const rank = Number(row.rank || 0);
            const solvedCount = Number(row.solvedCount || 0);
            const participated = Number(participatedMap.get(String(row.userId)) || 0);
            return rank > 0 && (rank <= 100 || solvedCount > 3 || participated <= 1);
        });
        const contestTitle = finalized?.contest?.title || '';
        await Promise.all(topRows.map(async (row) => {
            try {
                await recordActivity(req, {
                    userId: row.userId,
                    activityType: 'contest_finished',
                    contestId: req.params.id,
                    metadata: {
                        rank: Number(row.rank || 0),
                        score: Number(row.score || 0),
                        problemsSolved: Number(row.solvedCount || 0),
                        contestTitle,
                        link: `/contest/${req.params.id}/leaderboard`
                    },
                    dedupeKey: `contest_finished:${req.params.id}:${row.userId}`,
                    dedupeWindowMinutes: 60 * 24 * 365
                });
            } catch (activityError) {
                console.error('Activity event create failed (contest_finished):', activityError.message);
            }
        }));

        return res.json({
            success: true,
            message: 'Contest results finalized',
            contest: {
                id: finalized?.contest?._id || req.params.id,
                title: finalized?.contest?.title || '',
                finalizedAt: finalized?.finalizedAt || new Date(),
                leaderboardLocked: true
            },
            participantCount: Number(finalized?.participantCount || 0),
            syncedUsers: Number(finalized?.syncedUsers || 0)
        });
    } catch (error) {
        const status = mapContestServiceErrorToHttp(error);
        return res.status(status).json({ success: false, message: error.message || 'Failed to finalize contest results' });
    }
};

exports.recalculateContestResults = async (req, res) => {
    try {
        const finalized = await finalizeContest({
            contestId: req.params.id,
            source: 'admin',
            force: true
        });
        return res.json({
            success: true,
            message: 'Contest rankings recalculated',
            participantCount: Number(finalized?.participantCount || 0),
            syncedUsers: Number(finalized?.syncedUsers || 0),
            finalizedAt: finalized?.finalizedAt || new Date()
        });
    } catch (error) {
        const status = mapContestServiceErrorToHttp(error);
        return res.status(status).json({ success: false, message: error.message || 'Failed to recalculate contest results' });
    }
};

exports.getContestAnalytics = async (req, res) => {
    try {
        const analytics = await getContestAnalyticsSnapshot({ contestId: req.params.id });
        if (!analytics) {
            return res.status(404).json({ success: false, message: 'Contest not found' });
        }
        return res.json({ success: true, analytics });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Failed to fetch contest analytics' });
    }
};
