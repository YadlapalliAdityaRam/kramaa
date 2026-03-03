const User = require('../models/User');

const DIFFICULTY_WEIGHTS = {
    easy: 1,
    medium: 3,
    hard: 5
};

const roundTo = (value, decimals = 4) => {
    const factor = 10 ** decimals;
    return Math.round((Number(value) || 0) * factor) / factor;
};

const toNonNegativeInt = (value) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const getSolvedCounts = (user) => {
    const easy = toNonNegativeInt(user?.stats?.easySolved ?? user?.totalSolvedEasy ?? 0);
    const medium = toNonNegativeInt(user?.stats?.mediumSolved ?? user?.totalSolvedMedium ?? 0);
    const hard = toNonNegativeInt(user?.stats?.hardSolved ?? user?.totalSolvedHard ?? 0);
    return { easy, medium, hard };
};

const getProblemAcceptanceRate = (user) => {
    const totalSubmissions = Number(user?.stats?.totalSubmissions || 0);
    const acceptedSubmissions = Number(user?.stats?.acceptedSubmissions || 0);
    if (totalSubmissions > 0) {
        return roundTo((acceptedSubmissions / totalSubmissions) * 100, 2);
    }

    if (Number.isFinite(user?.problemAcceptanceRate) && user.problemAcceptanceRate >= 0) {
        return roundTo(user.problemAcceptanceRate, 2);
    }

    return 0;
};

const calculateBaseScore = (counts) => (
    (counts.easy * DIFFICULTY_WEIGHTS.easy) +
    (counts.medium * DIFFICULTY_WEIGHTS.medium) +
    (counts.hard * DIFFICULTY_WEIGHTS.hard)
);

const calculateFinalScore = (counts, acceptanceRate) => {
    const baseScore = calculateBaseScore(counts);
    const acceptanceMultiplier = 1 + ((Number(acceptanceRate) || 0) / 100);
    return roundTo(baseScore * acceptanceMultiplier, 4);
};

const buildRankMetrics = (user) => {
    const counts = getSolvedCounts(user);
    const problemAcceptanceRate = getProblemAcceptanceRate(user);
    const finalScore = calculateFinalScore(counts, problemAcceptanceRate);

    return {
        totalSolvedEasy: counts.easy,
        totalSolvedMedium: counts.medium,
        totalSolvedHard: counts.hard,
        problemAcceptanceRate,
        finalScore
    };
};

const recalculateUserMetrics = async (userId, options = {}) => {
    const { session } = options;
    const user = await User.findById(userId)
        .select('stats totalSolvedEasy totalSolvedMedium totalSolvedHard problemAcceptanceRate')
        .session(session || null);

    if (!user) return null;

    const metrics = buildRankMetrics(user);
    await User.updateOne(
        { _id: userId },
        { $set: metrics },
        { session: session || undefined }
    );

    return metrics;
};

const recomputeGlobalRanks = async (options = {}) => {
    const { session } = options;

    const rankedUsers = await User.find({
        role: 'USER',
        accountStatus: { $ne: 'Deleted' }
    })
        .select('_id finalScore totalSolvedHard problemAcceptanceRate createdAt')
        .sort({
            finalScore: -1,
            totalSolvedHard: -1,
            problemAcceptanceRate: -1,
            createdAt: 1,
            _id: 1
        })
        .session(session || null)
        .lean();

    if (!rankedUsers.length) return [];

    const bulkOps = rankedUsers.map((user, index) => ({
        updateOne: {
            filter: { _id: user._id },
            update: { $set: { globalRank: index + 1 } }
        }
    }));

    await User.bulkWrite(bulkOps, { session: session || undefined });
    return rankedUsers;
};

const bootstrapAllUserMetrics = async (options = {}) => {
    const { session } = options;
    const users = await User.find({ role: 'USER', accountStatus: { $ne: 'Deleted' } })
        .select('_id stats totalSolvedEasy totalSolvedMedium totalSolvedHard problemAcceptanceRate')
        .session(session || null);

    if (!users.length) return;

    const bulkOps = users.map((user) => {
        const metrics = buildRankMetrics(user);
        return {
            updateOne: {
                filter: { _id: user._id },
                update: { $set: metrics }
            }
        };
    });

    await User.bulkWrite(bulkOps, { session: session || undefined });
};

module.exports = {
    buildRankMetrics,
    calculateBaseScore,
    calculateFinalScore,
    recalculateUserMetrics,
    recomputeGlobalRanks,
    bootstrapAllUserMetrics,
    DIFFICULTY_WEIGHTS
};
