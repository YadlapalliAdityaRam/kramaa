const Contest = require('../models/Contest');
const ContestParticipant = require('../models/ContestParticipant');
const Submission = require('../models/Submission');

const DIFFICULTY_POINTS = Object.freeze({
    easy: 100,
    medium: 200,
    hard: 300
});

const normalizeDifficulty = (difficulty) => String(difficulty || '').trim().toLowerCase();

const getDifficultyPoints = (difficulty) => {
    const normalized = normalizeDifficulty(difficulty);
    return DIFFICULTY_POINTS[normalized] || 0;
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
    if (contestDoc.status === computedStatus) {
        return contestDoc;
    }

    contestDoc.status = computedStatus;
    await contestDoc.save({ session });
    return contestDoc;
};

const isProblemInContest = (contestDoc, problemId) => {
    if (!contestDoc || !Array.isArray(contestDoc.problems)) return false;
    const targetId = String(problemId);

    return contestDoc.problems.some((entry) => {
        if (!entry) return false;

        if (entry.problem) {
            return String(entry.problem) === targetId;
        }

        return String(entry) === targetId;
    });
};

const sortByLeaderboardRules = (participants) => {
    return [...participants].sort((a, b) => {
        const scoreDiff = Number(b.score || 0) - Number(a.score || 0);
        if (scoreDiff !== 0) return scoreDiff;

        const penaltyDiff = Number(a.penalty || 0) - Number(b.penalty || 0);
        if (penaltyDiff !== 0) return penaltyDiff;

        const aLast = a.lastSubmissionTime ? new Date(a.lastSubmissionTime).getTime() : Number.MAX_SAFE_INTEGER;
        const bLast = b.lastSubmissionTime ? new Date(b.lastSubmissionTime).getTime() : Number.MAX_SAFE_INTEGER;
        if (aLast !== bLast) return aLast - bLast;

        const aRegistered = a.registeredAt ? new Date(a.registeredAt).getTime() : Number.MAX_SAFE_INTEGER;
        const bRegistered = b.registeredAt ? new Date(b.registeredAt).getTime() : Number.MAX_SAFE_INTEGER;
        return aRegistered - bRegistered;
    });
};

const applyContestSubmissionResult = async ({
    session,
    contestId,
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

    if (submissionStatus !== 'accepted') {
        await ContestParticipant.updateOne(
            { contestId, userId },
            { $inc: { wrongSubmissions: 1 } },
            { session }
        );
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
        createdAt: { $lte: submissionTime }
    }).session(session);

    const awardedPoints = getDifficultyPoints(problemDifficulty);
    const penaltyAdded = wrongAttemptsBeforeCorrect * 10;

    await ContestParticipant.updateOne(
        { contestId, userId },
        {
            $inc: {
                score: awardedPoints,
                solvedCount: 1,
                penalty: penaltyAdded
            },
            $set: {
                lastSubmissionTime: submissionTime
            },
            $addToSet: {
                solvedProblemIds: problemId
            }
        },
        { session }
    );

    return { awardedPoints, penaltyAdded, firstSolve: true };
};

module.exports = {
    DIFFICULTY_POINTS,
    getDifficultyPoints,
    computeContestStatus,
    syncAllContestStatuses,
    syncContestStatus,
    isProblemInContest,
    sortByLeaderboardRules,
    applyContestSubmissionResult
};
