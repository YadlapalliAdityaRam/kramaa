const mongoose = require('mongoose');
const Contest = require('../models/Contest');
const ContestParticipant = require('../models/ContestParticipant');
const Problem = require('../models/Problem');
const User = require('../models/User');
const notificationService = require('../services/notificationService');
const {
    computeContestStatus,
    sortByLeaderboardRules,
    syncAllContestStatuses,
    syncContestStatus
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

const normalizeRole = (role) => String(role || '').trim().toUpperCase();

const canViewNonApprovedContest = (role) => ['ADMIN', 'SUPER_ADMIN'].includes(normalizeRole(role));

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
        action: buildActionLabel(status),
        createdAt: contestDoc.createdAt
    };
};

const getUserRating = (user) => {
    if (!user) return 0;
    const rating = Number(user?.rating?.current ?? user?.rating ?? 0);
    return Number.isFinite(rating) ? rating : 0;
};

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
    score: Number(participant.score || 0),
    solved: Number(participant.solvedCount || 0),
    penalty: Number(participant.penalty || 0),
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
            wrongSubmissionPenalty
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

        // Normalize problems: frontend sends [{problem, points, order}] objects
        const problemIds = (problems || []).map(p => typeof p === 'object' ? (p.problem || p.id || p._id) : p);
        const problemValidation = await ensureValidProblemIds(problemIds);
        if (!problemValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: problemValidation.message
            });
        }

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
            wrongSubmissionPenalty: wrongSubmissionPenalty || { enabled: false, minutes: 10 },
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
        if (req.user?._id) {
            isRegistered = Boolean(await ContestParticipant.exists({
                contestId: contest._id,
                userId: req.user._id
            }));
        }

        const contestStatus = computeContestStatus(contest);
        const isRegistrationOpen = isContestRegistrationOpen(contest, contestStatus);

        const durationMs = new Date(contest.endTime).getTime() - new Date(contest.startTime).getTime();
        const durationMinutes = Math.max(0, Math.floor(durationMs / (1000 * 60)));

        const problems = (contest.problems || []).map((problem) => ({
            id: problem?._id,
            title: problem?.title || 'Untitled Problem',
            difficulty: problem?.difficulty || 'Unknown'
        }));

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
                participantsCount: toParticipantCount(contest.participantsCount),
                participantCount: toParticipantCount(contest.participantsCount),
                createdAt: contest.createdAt,
                problems
            },
            overview: {
                description: contest.description,
                durationMinutes,
                rules: Array.isArray(contest.rules) && contest.rules.length > 0
                    ? contest.rules
                    : [
                        'Score is based on solved problems and difficulty.',
                        'Penalty adds 10 minutes per wrong attempt before accepted solution.',
                        'Leaderboard ranking uses score, then penalty, then earliest last submission.'
                    ],
                totalProblems: problems.length
            },
            problems
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Failed to fetch contest details' });
    }
};

exports.registerForContest = async (req, res) => {
    const session = await mongoose.startSession();

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
                    registeredAt: new Date()
                }
            ], { session });

            contest.participantsCount = toParticipantCount(contest.participantsCount) + 1;
            await contest.save({ session });
        });

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

        const rows = sorted.map((participant, index) => {
            const base = {
                username: participant.userId?.username || 'Unknown',
                rating: getUserRating(participant.userId),
                registrationTime: participant.registeredAt,
                score: Number(participant.score || 0),
                solvedCount: Number(participant.solvedCount || 0),
                penalty: Number(participant.penalty || 0)
            };

            if (contest.status === 'completed') {
                base.rank = index + 1;
            }

            return base;
        });

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

        const participants = await ContestParticipant.find({ contestId: contest._id })
            .populate('userId', 'username rating')
            .lean();

        const sorted = sortByLeaderboardRules(participants);
        const leaderboard = sorted.map(mapLeaderboardRow);

        const winners = contest.status === 'completed'
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
                status: contest.status
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
        await Contest.findByIdAndDelete(contest._id);

        return res.json({ success: true, message: 'Contest deleted successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Failed to delete contest' });
    }
};
