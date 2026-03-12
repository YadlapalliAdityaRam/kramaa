const mongoose = require('mongoose');
const Contest = require('../models/Contest');
const ContestParticipant = require('../models/ContestParticipant');
const ContestResult = require('../models/ContestResult');
const Submission = require('../models/Submission');
const User = require('../models/User');
const badgeService = require('./badgeService');
const { getFollowingIds } = require('./social/followService');

const DIFFICULTY_POINTS = Object.freeze({
    easy: 5,
    medium: 7,
    hard: 10
});

const DEFAULT_SCORING_CONFIG = Object.freeze({
    easyBaseScore: 5,
    mediumBaseScore: 7,
    hardBaseScore: 10,
    timePenaltyPerMinute: 0.02,
    wrongAttemptPenalty: 0.05
});

const EXTRA_CONTEST_BADGES = Object.freeze({
    contest_top_100: {
        id: 'contest_top_100',
        name: 'Top 100 Finisher',
        description: 'Finished in top 100 in a contest',
        icon: 'badge',
        tier: 'gold'
    },
    contest_all_solved: {
        id: 'contest_all_solved',
        name: 'Master Solver',
        description: 'Solved all problems in a contest',
        icon: 'badge',
        tier: 'platinum'
    }
});

const normalizeDifficulty = (difficulty) => String(difficulty || '').trim().toLowerCase();

const toObjectId = (value) => {
    if (!value) return null;
    if (value instanceof mongoose.Types.ObjectId) return value;
    if (!mongoose.Types.ObjectId.isValid(value)) return null;
    return new mongoose.Types.ObjectId(value);
};

const getDifficultyPoints = (difficulty) => {
    const normalized = normalizeDifficulty(difficulty);
    return DIFFICULTY_POINTS[normalized] || 0;
};

const toFiniteNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const getContestScoringConfig = (contestDoc = null) => {
    const config = contestDoc?.scoringConfig || {};
    return {
        easyBaseScore: Math.max(0, toFiniteNumber(config.easyBaseScore, DEFAULT_SCORING_CONFIG.easyBaseScore)),
        mediumBaseScore: Math.max(0, toFiniteNumber(config.mediumBaseScore, DEFAULT_SCORING_CONFIG.mediumBaseScore)),
        hardBaseScore: Math.max(0, toFiniteNumber(config.hardBaseScore, DEFAULT_SCORING_CONFIG.hardBaseScore)),
        timePenaltyPerMinute: Math.max(0, toFiniteNumber(config.timePenaltyPerMinute, DEFAULT_SCORING_CONFIG.timePenaltyPerMinute)),
        wrongAttemptPenalty: Math.max(0, toFiniteNumber(config.wrongAttemptPenalty, DEFAULT_SCORING_CONFIG.wrongAttemptPenalty))
    };
};

const resolveBaseScoreForProblem = (contestDoc, problemId, difficulty) => {
    const scoringConfig = getContestScoringConfig(contestDoc);
    const normalizedProblemId = String(problemId || '');
    const scoringRows = Array.isArray(contestDoc?.problemScoring) ? contestDoc.problemScoring : [];
    const row = scoringRows.find((entry) => String(entry?.problemId || '') === normalizedProblemId);
    if (row && Number.isFinite(Number(row.baseScore))) {
        return Math.max(0, Number(row.baseScore));
    }

    const normalizedDifficulty = normalizeDifficulty(difficulty);
    if (normalizedDifficulty === 'hard') return scoringConfig.hardBaseScore;
    if (normalizedDifficulty === 'medium') return scoringConfig.mediumBaseScore;
    return scoringConfig.easyBaseScore;
};

const computeContestSolveScore = ({
    baseScore,
    minutesTaken,
    attemptsBeforeAC,
    contestDoc
}) => {
    const scoringConfig = getContestScoringConfig(contestDoc);
    const cleanBaseScore = Math.max(0, toFiniteNumber(baseScore, 0));
    const cleanMinutes = Math.max(0, toFiniteNumber(minutesTaken, 0));
    const cleanAttempts = Math.max(0, Math.floor(toFiniteNumber(attemptsBeforeAC, 0)));

    const timePenalty = cleanMinutes * scoringConfig.timePenaltyPerMinute;
    const wrongSubmissionPenalty = cleanAttempts * scoringConfig.wrongAttemptPenalty;
    const finalScore = Math.max(0, cleanBaseScore - timePenalty - wrongSubmissionPenalty);

    return {
        baseScore: cleanBaseScore,
        minutesTaken: cleanMinutes,
        attemptsBeforeAC: cleanAttempts,
        timePenalty,
        wrongSubmissionPenalty,
        finalScore: Number(finalScore.toFixed(4))
    };
};

const computeContestStatus = (contestLike, referenceTime = new Date()) => {
    if (!contestLike) return 'upcoming';
    return Contest.computeStatus(contestLike, referenceTime);
};

const syncAllContestStatuses = async (referenceTime = new Date()) => {
    await Contest.syncStatuses(referenceTime);
};

const syncContestStatus = async (contestDoc, session = null) => {
    if (!contestDoc) return null;
    const computedStatus = computeContestStatus(contestDoc);
    if (contestDoc.status === computedStatus) return contestDoc;
    contestDoc.status = computedStatus;
    await contestDoc.save({ session });
    return contestDoc;
};

const isProblemInContest = (contestDoc, problemId) => {
    if (!contestDoc || !Array.isArray(contestDoc.problems)) return false;
    const targetId = String(problemId);
    return contestDoc.problems.some((entry) => {
        if (!entry) return false;
        if (entry.problem) return String(entry.problem) === targetId;
        return String(entry) === targetId;
    });
};

const sortByLeaderboardRules = (participants) => {
    return [...participants].sort((a, b) => {
        const scoreDiff = Number(b.score || 0) - Number(a.score || 0);
        if (scoreDiff !== 0) return scoreDiff;

        const aTotalTime = Number(a.totalTime ?? a.penalty ?? 0);
        const bTotalTime = Number(b.totalTime ?? b.penalty ?? 0);
        const timeDiff = aTotalTime - bTotalTime;
        if (timeDiff !== 0) return timeDiff;

        const aWrong = Number(a.wrongSubmissions || 0);
        const bWrong = Number(b.wrongSubmissions || 0);
        const wrongDiff = aWrong - bWrong;
        if (wrongDiff !== 0) return wrongDiff;

        const aLast = a.lastSubmissionTime ? new Date(a.lastSubmissionTime).getTime() : Number.MAX_SAFE_INTEGER;
        const bLast = b.lastSubmissionTime ? new Date(b.lastSubmissionTime).getTime() : Number.MAX_SAFE_INTEGER;
        if (aLast !== bLast) return aLast - bLast;

        const aRegistered = a.registeredAt ? new Date(a.registeredAt).getTime() : Number.MAX_SAFE_INTEGER;
        const bRegistered = b.registeredAt ? new Date(b.registeredAt).getTime() : Number.MAX_SAFE_INTEGER;
        return aRegistered - bRegistered;
    });
};

const upsertContestResultSnapshot = async ({
    contestId,
    userId,
    rank = null,
    score = 0,
    solvedCount = 0,
    totalTime = 0,
    penalty = 0,
    wrongSubmissions = 0,
    submissionCount = 0,
    status = 'active',
    source = 'system',
    ratingChange = 0,
    exitTime = null,
    finalizedAt = null,
    session = null
}) => {
    const normalizedContestId = toObjectId(contestId);
    const normalizedUserId = toObjectId(userId);
    if (!normalizedContestId || !normalizedUserId) return null;

    const now = new Date();
    const update = {
        contestId: normalizedContestId,
        userId: normalizedUserId,
        rank: Number.isFinite(Number(rank)) ? Number(rank) : null,
        score: Math.max(0, Number(score || 0)),
        problemsSolved: Math.max(0, Number(solvedCount || 0)),
        totalTime: Math.max(0, Number(totalTime || penalty || 0)),
        penaltyTime: Math.max(0, Number(totalTime || penalty || 0)),
        wrongSubmissions: Math.max(0, Number(wrongSubmissions || 0)),
        submissionCount: Math.max(0, Number(submissionCount || 0)),
        status,
        source,
        ratingChange: Number.isFinite(Number(ratingChange)) ? Number(ratingChange) : 0,
        exitTime: exitTime ? new Date(exitTime) : null,
        finalizedAt: finalizedAt ? new Date(finalizedAt) : null,
        updatedAt: now
    };

    return ContestResult.findOneAndUpdate(
        { contestId: normalizedContestId, userId: normalizedUserId },
        { $set: update, $setOnInsert: { createdAt: now } },
        { new: true, upsert: true, session }
    );
};

const touchParticipantActivity = async ({ contestId, userId, session = null }) => {
    const normalizedContestId = toObjectId(contestId);
    const normalizedUserId = toObjectId(userId);
    if (!normalizedContestId || !normalizedUserId) return null;
    const now = new Date();
    await ContestParticipant.updateOne(
        { contestId: normalizedContestId, userId: normalizedUserId },
        { $set: { lastActiveAt: now } },
        { session }
    );
    return now;
};

const validateParticipantSubmissionAccess = async ({
    contestDoc,
    participantDoc,
    session = null
}) => {
    if (!contestDoc) {
        return { allowed: false, reason: 'Contest not found', code: 'CONTEST_NOT_FOUND' };
    }
    if (!participantDoc) {
        return { allowed: false, reason: 'You are not registered for this contest', code: 'NOT_REGISTERED' };
    }

    const contestStatus = computeContestStatus(contestDoc);
    if (contestStatus !== 'running') {
        return { allowed: false, reason: 'Contest is not running', code: 'CONTEST_NOT_RUNNING' };
    }

    const participantStatus = String(participantDoc.status || 'active').toLowerCase();
    if (participantStatus === 'exited' || participantDoc.lockNewSubmissions) {
        const isFinished = participantStatus === 'finished';
        return {
            allowed: false,
            reason: isFinished
                ? 'You already submitted this contest. Further submissions are locked.'
                : 'You have exited the contest. Rejoin (if allowed) to continue.',
            code: isFinished ? 'PARTICIPANT_FINISHED' : 'PARTICIPANT_EXITED'
        };
    }

    const shouldAutoExit = Boolean(contestDoc?.exitRules?.autoExitOnInactivity);
    const timeoutMinutes = Math.max(5, Number(contestDoc?.exitRules?.inactivityTimeoutMinutes || 20));
    const lastActiveAt = participantDoc.lastActiveAt || participantDoc.lastSubmissionTime || participantDoc.registeredAt || new Date();
    const inactiveForMs = Date.now() - new Date(lastActiveAt).getTime();
    const inactiveThresholdMs = timeoutMinutes * 60 * 1000;

    if (shouldAutoExit && participantStatus === 'active' && inactiveForMs >= inactiveThresholdMs) {
        const now = new Date();
        await ContestParticipant.updateOne(
            { _id: participantDoc._id },
            {
                $set: {
                    status: 'exited',
                    lockNewSubmissions: true,
                    exitTime: now,
                    exitReason: 'inactivity_timeout',
                    lastActiveAt: now
                }
            },
            { session }
        );

        await upsertContestResultSnapshot({
            contestId: participantDoc.contestId,
            userId: participantDoc.userId,
            score: participantDoc.score,
            solvedCount: participantDoc.solvedCount,
            totalTime: participantDoc.totalTime ?? participantDoc.penalty,
            penalty: participantDoc.penalty,
            wrongSubmissions: participantDoc.wrongSubmissions,
            submissionCount: participantDoc.submissionCount,
            status: 'exited',
            exitTime: now,
            source: 'system',
            finalizedAt: null,
            session
        });

        return {
            allowed: false,
            reason: `You were auto-exited due to inactivity (${timeoutMinutes} min).`,
            code: 'AUTO_EXITED_INACTIVE',
            autoExited: true
        };
    }

    const touchedAt = await touchParticipantActivity({
        contestId: participantDoc.contestId,
        userId: participantDoc.userId,
        session
    });

    return { allowed: true, participant: participantDoc, touchedAt };
};

const markParticipantExited = async ({
    contestId,
    userId,
    reason = 'manual_exit',
    session = null
}) => {
    const normalizedContestId = toObjectId(contestId);
    const normalizedUserId = toObjectId(userId);
    if (!normalizedContestId || !normalizedUserId) {
        const error = new Error('Invalid contest or user id');
        error.code = 'INVALID_CONTEST_OR_USER';
        throw error;
    }

    const [contestDoc, participantDoc] = await Promise.all([
        Contest.findById(normalizedContestId).session(session),
        ContestParticipant.findOne({ contestId: normalizedContestId, userId: normalizedUserId }).session(session)
    ]);

    if (!contestDoc) {
        const error = new Error('Contest not found');
        error.code = 'CONTEST_NOT_FOUND';
        throw error;
    }
    if (!participantDoc) {
        const error = new Error('You are not registered for this contest');
        error.code = 'NOT_REGISTERED';
        throw error;
    }

    await syncContestStatus(contestDoc, session);
    if (computeContestStatus(contestDoc) !== 'running') {
        const error = new Error('Contest is not running');
        error.code = 'CONTEST_NOT_RUNNING';
        throw error;
    }

    const now = new Date();
    if (String(participantDoc.status || 'active').toLowerCase() !== 'exited') {
        participantDoc.status = 'exited';
        participantDoc.lockNewSubmissions = true;
        participantDoc.exitTime = now;
        participantDoc.exitReason = String(reason || 'manual_exit').trim();
        participantDoc.lastActiveAt = now;
        await participantDoc.save({ session });
    }

    const snapshot = await upsertContestResultSnapshot({
        contestId: normalizedContestId,
        userId: normalizedUserId,
        score: participantDoc.score,
        solvedCount: participantDoc.solvedCount,
        totalTime: participantDoc.totalTime ?? participantDoc.penalty,
        penalty: participantDoc.penalty,
        wrongSubmissions: participantDoc.wrongSubmissions,
        submissionCount: participantDoc.submissionCount,
        status: 'exited',
        exitTime: participantDoc.exitTime || now,
        source: 'system',
        finalizedAt: null,
        session
    });

    return { contest: contestDoc, participant: participantDoc, snapshot };
};

const markParticipantFinished = async ({
    contestId,
    userId,
    reason = 'manual_submit',
    session = null
}) => {
    const normalizedContestId = toObjectId(contestId);
    const normalizedUserId = toObjectId(userId);
    if (!normalizedContestId || !normalizedUserId) {
        const error = new Error('Invalid contest or user id');
        error.code = 'INVALID_CONTEST_OR_USER';
        throw error;
    }

    const [contestDoc, participantDoc] = await Promise.all([
        Contest.findById(normalizedContestId).session(session),
        ContestParticipant.findOne({ contestId: normalizedContestId, userId: normalizedUserId }).session(session)
    ]);

    if (!contestDoc) {
        const error = new Error('Contest not found');
        error.code = 'CONTEST_NOT_FOUND';
        throw error;
    }
    if (!participantDoc) {
        const error = new Error('You are not registered for this contest');
        error.code = 'NOT_REGISTERED';
        throw error;
    }

    await syncContestStatus(contestDoc, session);
    if (computeContestStatus(contestDoc) !== 'running') {
        const error = new Error('Contest is not running');
        error.code = 'CONTEST_NOT_RUNNING';
        throw error;
    }

    const currentStatus = String(participantDoc.status || 'active').toLowerCase();
    if (currentStatus === 'exited') {
        const error = new Error('You already exited this contest. Rejoin (if allowed) to continue.');
        error.code = 'PARTICIPANT_EXITED';
        throw error;
    }

    const now = new Date();
    if (currentStatus !== 'finished') {
        participantDoc.status = 'finished';
        participantDoc.lockNewSubmissions = true;
        participantDoc.finishedAt = now;
        participantDoc.lastActiveAt = now;
        participantDoc.exitReason = String(reason || 'manual_submit').trim();
        await participantDoc.save({ session });
    }

    const snapshot = await upsertContestResultSnapshot({
        contestId: normalizedContestId,
        userId: normalizedUserId,
        score: participantDoc.score,
        solvedCount: participantDoc.solvedCount,
        totalTime: participantDoc.totalTime ?? participantDoc.penalty,
        penalty: participantDoc.penalty,
        wrongSubmissions: participantDoc.wrongSubmissions,
        submissionCount: participantDoc.submissionCount,
        status: 'finished',
        source: 'system',
        finalizedAt: null,
        session
    });

    return { contest: contestDoc, participant: participantDoc, snapshot };
};

const rejoinParticipant = async ({ contestId, userId, session = null }) => {
    const normalizedContestId = toObjectId(contestId);
    const normalizedUserId = toObjectId(userId);
    if (!normalizedContestId || !normalizedUserId) {
        const error = new Error('Invalid contest or user id');
        error.code = 'INVALID_CONTEST_OR_USER';
        throw error;
    }

    const [contestDoc, participantDoc] = await Promise.all([
        Contest.findById(normalizedContestId).session(session),
        ContestParticipant.findOne({ contestId: normalizedContestId, userId: normalizedUserId }).session(session)
    ]);

    if (!contestDoc) {
        const error = new Error('Contest not found');
        error.code = 'CONTEST_NOT_FOUND';
        throw error;
    }
    if (!participantDoc) {
        const error = new Error('You are not registered for this contest');
        error.code = 'NOT_REGISTERED';
        throw error;
    }

    await syncContestStatus(contestDoc, session);
    if (computeContestStatus(contestDoc) !== 'running') {
        const error = new Error('Contest is not running');
        error.code = 'CONTEST_NOT_RUNNING';
        throw error;
    }

    if (!contestDoc?.exitRules?.allowRejoin) {
        const error = new Error('Rejoin is disabled for this contest');
        error.code = 'REJOIN_DISABLED';
        throw error;
    }

    const now = new Date();
    if (String(participantDoc.status || 'active').toLowerCase() === 'exited') {
        participantDoc.status = 'active';
        participantDoc.lockNewSubmissions = false;
        participantDoc.lastActiveAt = now;
        participantDoc.rejoinCount = Math.max(0, Number(participantDoc.rejoinCount || 0)) + 1;
        participantDoc.exitReason = '';
        await participantDoc.save({ session });
    }

    await upsertContestResultSnapshot({
        contestId: normalizedContestId,
        userId: normalizedUserId,
        score: participantDoc.score,
        solvedCount: participantDoc.solvedCount,
        totalTime: participantDoc.totalTime ?? participantDoc.penalty,
        penalty: participantDoc.penalty,
        wrongSubmissions: participantDoc.wrongSubmissions,
        submissionCount: participantDoc.submissionCount,
        status: participantDoc.status || 'active',
        source: 'system',
        finalizedAt: null,
        session
    });

    return { contest: contestDoc, participant: participantDoc };
};

const applyContestSubmissionResult = async ({
    session,
    contestId,
    contestDoc = null,
    userId,
    problemId,
    submissionId,
    submissionStatus,
    problemDifficulty,
    submissionTime
}) => {
    if (!contestId) return null;

    const participant = await ContestParticipant.findOne({ contestId, userId }).session(session);
    if (!participant) {
        throw new Error('You are not registered for this contest');
    }

    const participantStatus = String(participant.status || 'active').toLowerCase();
    if (participantStatus !== 'active' || participant.lockNewSubmissions) {
        const error = new Error('Contest submissions are locked for this participant');
        error.code = 'PARTICIPANT_SUBMISSIONS_LOCKED';
        throw error;
    }

    const now = submissionTime ? new Date(submissionTime) : new Date();
    const contestContext = contestDoc || await Contest.findById(contestId)
        .select('startTime problemScoring scoringConfig')
        .session(session);
    const contestStartAt = contestContext?.startTime ? new Date(contestContext.startTime) : null;
    const minutesTaken = contestStartAt
        ? Math.max(0, (now.getTime() - contestStartAt.getTime()) / (1000 * 60))
        : 0;
    await ContestParticipant.updateOne(
        { contestId, userId },
        { $inc: { submissionCount: 1 }, $set: { lastActiveAt: now } },
        { session }
    );

    if (submissionStatus !== 'accepted') {
        await ContestParticipant.updateOne(
            { contestId, userId },
            { $inc: { wrongSubmissions: 1 } },
            { session }
        );
        const updated = await ContestParticipant.findOne({ contestId, userId }).session(session).lean();
        if (updated) {
            await upsertContestResultSnapshot({
                contestId,
                userId,
                score: updated.score,
                solvedCount: updated.solvedCount,
                totalTime: updated.totalTime ?? updated.penalty,
                penalty: updated.penalty,
                wrongSubmissions: updated.wrongSubmissions,
                submissionCount: updated.submissionCount,
                status: updated.status || 'active',
                source: 'system',
                finalizedAt: null,
                session
            });
        }
        return { awardedPoints: 0, penaltyAdded: 0, firstSolve: false };
    }

    const hasSolvedBefore = await Submission.exists({
        contest: contestId,
        user: userId,
        problem: problemId,
        status: 'accepted',
        _id: { $ne: submissionId }
    }).session(session);

    if (hasSolvedBefore) {
        return { awardedPoints: 0, penaltyAdded: 0, firstSolve: false };
    }

    const wrongAttemptsBeforeCorrect = await Submission.countDocuments({
        contest: contestId,
        user: userId,
        problem: problemId,
        status: { $ne: 'accepted' },
        createdAt: { $lte: now }
    }).session(session);

    const baseScore = resolveBaseScoreForProblem(contestContext, problemId, problemDifficulty);
    const scoring = computeContestSolveScore({
        baseScore,
        minutesTaken,
        attemptsBeforeAC: wrongAttemptsBeforeCorrect,
        contestDoc: contestContext
    });
    const awardedPoints = scoring.finalScore;
    const totalTimeAdded = scoring.minutesTaken;

    await ContestParticipant.updateOne(
        { contestId, userId },
        {
            $inc: {
                score: awardedPoints,
                solvedCount: 1,
                totalTime: totalTimeAdded,
                penalty: totalTimeAdded
            },
            $set: { lastSubmissionTime: now, lastActiveAt: now },
            $addToSet: { solvedProblemIds: problemId }
        },
        { session }
    );

    const updated = await ContestParticipant.findOne({ contestId, userId }).session(session).lean();
    if (updated) {
        await upsertContestResultSnapshot({
            contestId,
            userId,
            score: updated.score,
            solvedCount: updated.solvedCount,
            totalTime: updated.totalTime ?? updated.penalty,
            penalty: updated.penalty,
            wrongSubmissions: updated.wrongSubmissions,
            submissionCount: updated.submissionCount,
            status: updated.status || 'active',
            source: 'system',
            finalizedAt: null,
            session
        });
    }

    return {
        awardedPoints,
        totalTimeAdded,
        scoring,
        firstSolve: true
    };
};

const awardBadgeIfMissing = async (userId, badge) => {
    if (!badge?.id) return;
    await User.updateOne(
        { _id: userId, 'badges.id': { $ne: badge.id } },
        {
            $push: {
                badges: {
                    id: badge.id,
                    name: badge.name,
                    description: badge.description,
                    icon: badge.icon,
                    tier: badge.tier || 'bronze',
                    earnedAt: new Date()
                }
            }
        }
    );
};

const syncUserStatsFromResult = async ({
    result,
    participantCount = 0,
    totalProblems = 0,
    averageOpponentRating = 1200
}) => {
    if (!result || result.profileSyncedAt) return false;
    const user = await User.findById(result.userId).select('contestStats rating');
    if (!user) return false;

    const rank = Number(result.rank || 0);
    const currentBestRank = user?.contestStats?.bestRank;
    const hasRank = Number.isFinite(rank) && rank > 0;

    const currentRating = Number(user?.rating?.current || 1200);
    const denominator = Math.max(1, participantCount - 1);
    const normalizedRank = hasRank ? (rank - 1) / denominator : 1;
    const actualScore = Math.max(0, Math.min(1, 1 - normalizedRank));
    const expectedScore = 1 / (1 + (10 ** ((averageOpponentRating - currentRating) / 400)));
    const kFactor = participantCount >= 200 ? 72 : 64;
    let ratingChange = participantCount > 1 ? Math.round(kFactor * (actualScore - expectedScore)) : 0;

    const topFiveCutoff = Math.max(1, Math.ceil(participantCount * 0.05));
    if (hasRank && rank <= topFiveCutoff) {
        ratingChange = Math.max(80, ratingChange);
    } else if (actualScore >= 0.45) {
        ratingChange = Math.max(10, ratingChange);
    } else {
        ratingChange = Math.min(-10, ratingChange);
    }

    ratingChange = Math.max(-50, Math.min(120, ratingChange));
    const newRating = Math.max(0, currentRating + ratingChange);
    const highestRating = Math.max(Number(user?.rating?.highest || 1200), newRating);

    const update = {
        $inc: {
            'contestStats.participated': 1,
            'contestStats.totalScore': Number(result.score || 0)
        },
        $set: {
            'rating.current': newRating,
            'rating.highest': highestRating
        },
        $push: {
            'rating.history': {
                date: new Date(),
                rating: newRating,
                contestId: result.contestId,
                change: ratingChange
            }
        }
    };

    if (hasRank && (!currentBestRank || rank < Number(currentBestRank))) {
        update.$set['contestStats.bestRank'] = rank;
    }

    await User.findByIdAndUpdate(result.userId, update);

    await badgeService.checkContestBadges(result.userId, hasRank ? rank : participantCount + 1, participantCount);
    if (hasRank && rank <= 100) {
        await awardBadgeIfMissing(result.userId, EXTRA_CONTEST_BADGES.contest_top_100);
    }
    if (totalProblems > 0 && Number(result.problemsSolved || 0) >= totalProblems) {
        await awardBadgeIfMissing(result.userId, EXTRA_CONTEST_BADGES.contest_all_solved);
    }

    await ContestResult.updateOne(
        { _id: result._id, profileSyncedAt: null },
        { $set: { profileSyncedAt: new Date(), ratingChange } }
    );

    return true;
};

const finalizeContest = async ({ contestId, source = 'system', force = false }) => {
    const normalizedContestId = toObjectId(contestId);
    if (!normalizedContestId) {
        const error = new Error('Invalid contest id');
        error.code = 'INVALID_CONTEST_ID';
        throw error;
    }

    const contest = await Contest.findById(normalizedContestId);
    if (!contest) {
        const error = new Error('Contest not found');
        error.code = 'CONTEST_NOT_FOUND';
        throw error;
    }

    await syncContestStatus(contest);
    const status = computeContestStatus(contest);
    if (status !== 'completed' && !force) {
        const error = new Error('Contest is not completed yet');
        error.code = 'CONTEST_NOT_COMPLETED';
        throw error;
    }

    const participants = await ContestParticipant.find({ contestId: normalizedContestId }).lean();
    const sorted = sortByLeaderboardRules(participants);
    const finalizedAt = new Date();
    const totalProblems = Array.isArray(contest.problems) ? contest.problems.length : 0;

    const resultOps = [];
    const participantOps = [];
    const leaderboardRows = [];

    sorted.forEach((participant, index) => {
        const rank = index + 1;
        const participantStatus = String(participant.status || 'active').toLowerCase();
        const resultStatus = participantStatus === 'exited' ? 'exited' : 'finished';
        const solvedCount = Number(participant.solvedCount || 0);
        const score = Number(participant.score || 0);
        const totalTime = Number(participant.totalTime ?? participant.penalty ?? 0);
        const wrongSubmissions = Number(participant.wrongSubmissions || 0);
        const submissionCount = Number(participant.submissionCount || 0);

        leaderboardRows.push({
            rank,
            userId: participant.userId,
            score,
            solvedCount,
            totalTime,
            penalty: totalTime,
            wrongSubmissions,
            submissionCount,
            status: resultStatus
        });

        resultOps.push({
            updateOne: {
                filter: { contestId: normalizedContestId, userId: participant.userId },
                update: {
                    $set: {
                        contestId: normalizedContestId,
                        userId: participant.userId,
                        rank,
                        score,
                        problemsSolved: solvedCount,
                        totalTime,
                        penaltyTime: totalTime,
                        wrongSubmissions,
                        submissionCount,
                        status: resultStatus,
                        source: source === 'admin' ? 'admin' : 'system',
                        exitTime: participant.exitTime || null,
                        finalizedAt,
                        updatedAt: finalizedAt
                    },
                    $setOnInsert: {
                        createdAt: participant.registeredAt || finalizedAt
                    }
                },
                upsert: true
            }
        });

        participantOps.push({
            updateOne: {
                filter: { _id: participant._id },
                update: {
                    $set: {
                        status: resultStatus,
                        lockNewSubmissions: true,
                        finishedAt: resultStatus === 'finished' ? finalizedAt : (participant.finishedAt || null)
                    }
                }
            }
        });
    });

    if (resultOps.length > 0) {
        await ContestResult.bulkWrite(resultOps, { ordered: false });
    }
    if (participantOps.length > 0) {
        await ContestParticipant.bulkWrite(participantOps, { ordered: false });
    }

    contest.status = 'completed';
    contest.leaderboardLocked = true;
    contest.resultsFinalizedAt = finalizedAt;
    await contest.save();

    const finalizedResults = await ContestResult.find({
        contestId: normalizedContestId,
        finalizedAt: { $ne: null }
    }).lean();
    const participantCount = finalizedResults.length;
    const userIds = finalizedResults.map((row) => row.userId).filter(Boolean);
    const ratingRows = userIds.length > 0
        ? await User.find({ _id: { $in: userIds } }).select('_id rating.current').lean()
        : [];
    const ratingMap = new Map(ratingRows.map((row) => [String(row._id), Number(row?.rating?.current || 1200)]));
    const ratingSum = ratingRows.reduce((acc, row) => acc + Number(row?.rating?.current || 1200), 0);
    const averageAllRating = ratingRows.length > 0 ? (ratingSum / ratingRows.length) : 1200;

    let syncedUsers = 0;
    for (const result of finalizedResults) {
        const ownRating = Number(ratingMap.get(String(result.userId)) || averageAllRating);
        const averageOpponentRating = ratingRows.length > 1
            ? (ratingSum - ownRating) / (ratingRows.length - 1)
            : ownRating;

        // eslint-disable-next-line no-await-in-loop
        const synced = await syncUserStatsFromResult({
            result,
            participantCount,
            totalProblems,
            averageOpponentRating
        });
        if (synced) syncedUsers += 1;
    }

    return {
        contest,
        leaderboardRows,
        winners: leaderboardRows.slice(0, 3),
        participantCount,
        totalProblems,
        syncedUsers,
        finalizedAt
    };
};

const getContestProgressSummary = async ({ contestId, userId }) => {
    const normalizedContestId = toObjectId(contestId);
    const normalizedUserId = toObjectId(userId);
    if (!normalizedContestId || !normalizedUserId) return null;

    const [contest, participant, result] = await Promise.all([
        Contest.findById(normalizedContestId).select('title status startTime endTime leaderboardLocked resultsFinalizedAt'),
        ContestParticipant.findOne({ contestId: normalizedContestId, userId: normalizedUserId }).lean(),
        ContestResult.findOne({ contestId: normalizedContestId, userId: normalizedUserId }).lean()
    ]);
    if (!contest || !participant) return null;

    let rank = result?.rank || null;
    if (!rank) {
        const participants = await ContestParticipant.find({ contestId: normalizedContestId }).lean();
        const sorted = sortByLeaderboardRules(participants);
        const idx = sorted.findIndex((entry) => String(entry.userId) === String(normalizedUserId));
        rank = idx >= 0 ? idx + 1 : null;
    }

    return {
        contest: {
            _id: contest._id,
            title: contest.title,
            status: computeContestStatus(contest),
            startTime: contest.startTime,
            endTime: contest.endTime,
            leaderboardLocked: Boolean(contest.leaderboardLocked),
            resultsFinalizedAt: contest.resultsFinalizedAt || null
        },
        result: {
            rank,
            score: Number((result?.score ?? participant.score) || 0),
            problemsSolved: Number((result?.problemsSolved ?? participant.solvedCount) || 0),
            totalTime: Number((result?.totalTime ?? participant.totalTime ?? participant.penalty) || 0),
            penaltyTime: Number((result?.totalTime ?? result?.penaltyTime ?? participant.totalTime ?? participant.penalty) || 0),
            wrongSubmissions: Number((result?.wrongSubmissions ?? participant.wrongSubmissions) || 0),
            submissionCount: Number((result?.submissionCount ?? participant.submissionCount) || 0),
            status: result?.status || participant.status || 'active',
            exitTime: result?.exitTime || participant.exitTime || null
        }
    };
};

const getContestHistoryForUser = async ({ userId, limit = 25 }) => {
    const normalizedUserId = toObjectId(userId);
    if (!normalizedUserId) return [];

    const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
    const rows = await ContestResult.find({ userId: normalizedUserId })
        .populate('contestId', 'title startTime endTime')
        .sort({ createdAt: -1, updatedAt: -1 })
        .limit(safeLimit)
        .lean();

    return rows.map((row) => ({
        _id: row._id,
        contestId: row.contestId?._id || row.contestId,
        title: row.contestId?.title || 'Contest',
        date: row.finalizedAt || row.updatedAt || row.createdAt || null,
        startTime: row.contestId?.startTime || null,
        endTime: row.contestId?.endTime || null,
        rank: row.rank || null,
        score: Number(row.score || 0),
        problemsSolved: Number(row.problemsSolved || 0),
        totalTime: Number(row.totalTime || row.penaltyTime || 0),
        penaltyTime: Number(row.totalTime || row.penaltyTime || 0),
        wrongSubmissions: Number(row.wrongSubmissions || 0),
        submissionCount: Number(row.submissionCount || 0),
        ratingChange: Number(row.ratingChange || 0),
        status: row.status || 'active',
        source: row.source || 'system'
    }));
};

const getFriendsContestLeaderboard = async ({ contestId, userId, includeSelf = true, limit = 50 }) => {
    const normalizedContestId = toObjectId(contestId);
    const normalizedUserId = toObjectId(userId);
    if (!normalizedContestId || !normalizedUserId) return [];

    const followingIds = await getFollowingIds(normalizedUserId);
    const candidateIds = includeSelf
        ? [String(normalizedUserId), ...followingIds.map((id) => String(id))]
        : followingIds.map((id) => String(id));
    const uniqueCandidateIds = [...new Set(candidateIds)]
        .map((id) => toObjectId(id))
        .filter(Boolean);
    if (uniqueCandidateIds.length === 0) return [];

    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const rows = await ContestResult.find({
        contestId: normalizedContestId,
        userId: { $in: uniqueCandidateIds }
    })
        .populate('userId', 'username avatar')
        .sort({ rank: 1, score: -1, totalTime: 1, wrongSubmissions: 1 })
        .limit(safeLimit)
        .lean();

    let fallbackRank = 1;
    return rows.map((row) => ({
        rank: Number(row.rank || fallbackRank++),
        userId: row.userId?._id || row.userId,
        username: row.userId?.username || 'Unknown',
        avatar: row.userId?.avatar || '',
        score: Number(row.score || 0),
        problemsSolved: Number(row.problemsSolved || 0),
        totalTime: Number(row.totalTime || row.penaltyTime || 0),
        penaltyTime: Number(row.totalTime || row.penaltyTime || 0),
        wrongSubmissions: Number(row.wrongSubmissions || 0),
        status: row.status || 'active'
    }));
};

const getContestAnalyticsSnapshot = async ({ contestId }) => {
    const normalizedContestId = toObjectId(contestId);
    if (!normalizedContestId) return null;

    const [contest, participants, finalizedRows] = await Promise.all([
        Contest.findById(normalizedContestId).select('title status leaderboardLocked resultsFinalizedAt'),
        ContestParticipant.find({ contestId: normalizedContestId }).populate('userId', 'username').lean(),
        ContestResult.find({ contestId: normalizedContestId, finalizedAt: { $ne: null } })
            .populate('userId', 'username')
            .sort({ rank: 1 })
            .limit(10)
            .lean()
    ]);
    if (!contest) return null;

    const participantCount = participants.length;
    const totalScore = participants.reduce((acc, entry) => acc + Number(entry.score || 0), 0);
    const avgScore = participantCount > 0 ? Number((totalScore / participantCount).toFixed(2)) : 0;
    const topPerformers = (finalizedRows.length > 0 ? finalizedRows : sortByLeaderboardRules(participants).slice(0, 10))
        .map((entry, idx) => ({
            rank: Number(entry.rank || idx + 1),
            userId: entry.userId?._id || entry.userId,
            username: entry.userId?.username || 'Unknown',
            score: Number(entry.score || 0),
            problemsSolved: Number(entry.problemsSolved || entry.solvedCount || 0),
            totalTime: Number(entry.totalTime || entry.penaltyTime || entry.penalty || 0),
            penaltyTime: Number(entry.totalTime || entry.penaltyTime || entry.penalty || 0),
            wrongSubmissions: Number(entry.wrongSubmissions || 0),
            status: entry.status || 'active'
        }));

    const suspiciousSubmissions = participants
        .filter((entry) => Number(entry.wrongSubmissions || 0) >= 30 || Number(entry.submissionCount || 0) >= 200)
        .map((entry) => ({
            userId: entry.userId?._id || entry.userId,
            username: entry.userId?.username || 'Unknown',
            wrongSubmissions: Number(entry.wrongSubmissions || 0),
            submissionCount: Number(entry.submissionCount || 0),
            solvedCount: Number(entry.solvedCount || 0)
        }))
        .sort((a, b) => b.wrongSubmissions - a.wrongSubmissions || b.submissionCount - a.submissionCount)
        .slice(0, 20);

    return {
        contest: {
            _id: contest._id,
            title: contest.title,
            status: computeContestStatus(contest),
            leaderboardLocked: Boolean(contest.leaderboardLocked),
            resultsFinalizedAt: contest.resultsFinalizedAt || null
        },
        totals: {
            participants: participantCount,
            averageScore: avgScore
        },
        topPerformers,
        suspiciousSubmissions
    };
};

module.exports = {
    DIFFICULTY_POINTS,
    getDifficultyPoints,
    computeContestStatus,
    syncAllContestStatuses,
    syncContestStatus,
    isProblemInContest,
    sortByLeaderboardRules,
    applyContestSubmissionResult,
    validateParticipantSubmissionAccess,
    markParticipantExited,
    markParticipantFinished,
    rejoinParticipant,
    touchParticipantActivity,
    finalizeContest,
    getContestProgressSummary,
    getContestHistoryForUser,
    getFriendsContestLeaderboard,
    getContestAnalyticsSnapshot
};
