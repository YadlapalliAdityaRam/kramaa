const mongoose = require('mongoose');
const DailyChallenge = require('../models/DailyChallenge');
const Problem = require('../models/Problem');
const { buildPublishedProblemMatch } = require('../utils/problemPublication');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Monday: Easy, Tuesday: Easy, Wednesday: Medium, Thursday: Medium,
// Friday: Hard, Saturday: Hard, Sunday: Hard
const WEEKDAY_DIFFICULTY_MAP = Object.freeze({
    0: 'Hard',
    1: 'Easy',
    2: 'Easy',
    3: 'Medium',
    4: 'Medium',
    5: 'Hard',
    6: 'Hard'
});

const WEEKDAY_LABELS = Object.freeze({
    0: 'Sunday',
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday'
});

const normalizeUtcDate = (dateValue) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return null;
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
};

const formatUtcDateKey = (dateValue) => {
    const date = normalizeUtcDate(dateValue);
    if (!date) return null;
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const parseDateKey = (dateKey) => {
    const normalized = String(dateKey || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;
    const date = normalizeUtcDate(`${normalized}T00:00:00.000Z`);
    if (!date) return null;
    return formatUtcDateKey(date) === normalized ? date : null;
};

const shiftUtcDays = (dateValue, days) => {
    const base = normalizeUtcDate(dateValue);
    if (!base) return null;
    return new Date(base.getTime() + (Number(days || 0) * MS_PER_DAY));
};

const getExpectedDifficultyForDate = (dateValue) => {
    const date = normalizeUtcDate(dateValue);
    if (!date) return null;
    return WEEKDAY_DIFFICULTY_MAP[date.getUTCDay()] || 'Easy';
};

const getWeeklyPattern = () => {
    const weekdayOrder = [1, 2, 3, 4, 5, 6, 0];
    return weekdayOrder.map((weekdayIndex) => ({
        weekdayIndex,
        day: WEEKDAY_LABELS[weekdayIndex],
        expectedDifficulty: WEEKDAY_DIFFICULTY_MAP[weekdayIndex]
    }));
};

const buildChallengeStatus = (dateValue, now = new Date()) => {
    const dateKey = formatUtcDateKey(dateValue);
    const todayKey = formatUtcDateKey(now);
    if (!dateKey || !todayKey) return 'Active';
    return dateKey < todayKey ? 'Completed' : 'Active';
};

const toObjectId = (value) => {
    if (!value) return null;
    if (value instanceof mongoose.Types.ObjectId) return value;
    return mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : null;
};

const getRecentUsedProblemIds = async ({ dateValue, lookbackDays = 7, session = null }) => {
    const targetDate = normalizeUtcDate(dateValue);
    if (!targetDate) return [];
    const startDate = shiftUtcDays(targetDate, -Math.max(1, lookbackDays));

    const query = DailyChallenge.find({
        date: { $gte: startDate, $lt: targetDate }
    }).select('problem');

    if (session) query.session(session);
    const docs = await query.lean();
    return docs
        .map((doc) => toObjectId(doc.problem))
        .filter(Boolean);
};

const pickRandomProblem = async ({ expectedDifficulty, excludedProblemIds = [], session = null }) => {
    const excluded = excludedProblemIds
        .map((value) => toObjectId(value))
        .filter(Boolean);

    const runSample = async (matchBase) => {
        const match = { ...buildPublishedProblemMatch(matchBase) };
        if (excluded.length > 0) {
            match._id = { ...(match._id || {}), $nin: excluded };
        }

        const pipeline = [
            { $match: match },
            { $sample: { size: 1 } },
            { $project: { _id: 1, title: 1, slug: 1, difficulty: 1, topic: 1, topics: 1 } }
        ];
        const query = Problem.aggregate(pipeline);
        if (session) query.session(session);
        const [sample] = await query;
        return sample || null;
    };

    // Preferred: published + expected difficulty + no repeat in last 7 days
    let selected = await runSample({ difficulty: expectedDifficulty });
    if (selected) return selected;

    // Fallback 1: published + any difficulty + no repeat in last 7 days
    selected = await runSample({});
    if (selected) return selected;

    // Fallback 2: published + expected difficulty (allow repeat)
    if (excluded.length > 0) {
        const pipeline = [
            { $match: buildPublishedProblemMatch({ difficulty: expectedDifficulty }) },
            { $sample: { size: 1 } },
            { $project: { _id: 1, title: 1, slug: 1, difficulty: 1, topic: 1, topics: 1 } }
        ];
        const query = Problem.aggregate(pipeline);
        if (session) query.session(session);
        const [sample] = await query;
        if (sample) return sample;
    }

    // Fallback 3: any published problem
    const pipeline = [
        { $match: buildPublishedProblemMatch({}) },
        { $sample: { size: 1 } },
        { $project: { _id: 1, title: 1, slug: 1, difficulty: 1, topic: 1, topics: 1 } }
    ];
    const query = Problem.aggregate(pipeline);
    if (session) query.session(session);
    const [sample] = await query;
    return sample || null;
};

const ensureChallengeForDate = async ({
    dateValue,
    session = null,
    forceSystemRegeneration = false
}) => {
    const targetDate = normalizeUtcDate(dateValue);
    if (!targetDate) {
        return { challenge: null, created: false, reason: 'INVALID_DATE' };
    }

    const dateKey = formatUtcDateKey(targetDate);
    let existingQuery = DailyChallenge.findOne({ dateKey });
    if (session) existingQuery = existingQuery.session(session);
    const existing = await existingQuery;

    if (existing && !(forceSystemRegeneration && existing.source === 'SYSTEM')) {
        return { challenge: existing, created: false, reason: 'EXISTS' };
    }

    const expectedDifficulty = getExpectedDifficultyForDate(targetDate);
    const recentUsedIds = await getRecentUsedProblemIds({
        dateValue: targetDate,
        lookbackDays: 7,
        session
    });
    const pickedProblem = await pickRandomProblem({
        expectedDifficulty,
        excludedProblemIds: recentUsedIds,
        session
    });

    if (!pickedProblem) {
        return { challenge: existing || null, created: false, reason: 'NO_PUBLISHED_PROBLEMS' };
    }

    const payload = {
        date: targetDate,
        dateKey,
        problem: pickedProblem._id,
        difficulty: pickedProblem.difficulty,
        expectedDifficulty,
        source: DailyChallenge.DAILY_CHALLENGE_SOURCES.SYSTEM,
        scheduledBy: null,
        overrideRepeatedProblem: false,
        overrideDifficultyPattern: pickedProblem.difficulty !== expectedDifficulty
    };

    if (existing && existing.source === 'SYSTEM' && forceSystemRegeneration) {
        existing.set(payload);
        if (session) {
            await existing.save({ session });
        } else {
            await existing.save();
        }
        return { challenge: existing, created: false, regenerated: true, reason: 'SYSTEM_REGENERATED' };
    }

    try {
        const challenge = new DailyChallenge(payload);
        if (session) {
            await challenge.save({ session });
        } else {
            await challenge.save();
        }
        return { challenge, created: true, reason: 'CREATED' };
    } catch (error) {
        if (error?.code === 11000) {
            // Concurrent creation: load existing record.
            let duplicateQuery = DailyChallenge.findOne({ dateKey });
            if (session) duplicateQuery = duplicateQuery.session(session);
            const duplicate = await duplicateQuery;
            return { challenge: duplicate, created: false, reason: 'RACE_DUPLICATE' };
        }
        throw error;
    }
};

const ensureChallengesForRange = async ({ startDate, endDate, session = null }) => {
    const normalizedStart = normalizeUtcDate(startDate);
    const normalizedEnd = normalizeUtcDate(endDate);
    if (!normalizedStart || !normalizedEnd || normalizedStart > normalizedEnd) {
        return [];
    }

    const results = [];
    for (let cursor = new Date(normalizedStart); cursor <= normalizedEnd; cursor = shiftUtcDays(cursor, 1)) {
        // eslint-disable-next-line no-await-in-loop
        const result = await ensureChallengeForDate({
            dateValue: cursor,
            session
        });
        results.push(result);
    }
    return results;
};

const findChallengeByDateKey = async ({ dateKey, session = null, populateProblem = true }) => {
    let query = DailyChallenge.findOne({ dateKey });
    if (populateProblem) {
        query = query.populate('problem', 'title slug difficulty topic topics');
    }
    if (session) query = query.session(session);
    return query;
};

const getChallengesInRange = async ({
    startDate,
    endDate,
    session = null,
    populateProblem = true
}) => {
    const normalizedStart = normalizeUtcDate(startDate);
    const normalizedEnd = normalizeUtcDate(endDate);
    if (!normalizedStart || !normalizedEnd || normalizedStart > normalizedEnd) {
        return [];
    }

    let query = DailyChallenge.find({
        date: { $gte: normalizedStart, $lte: normalizedEnd }
    }).sort({ date: 1 });
    if (populateProblem) {
        query = query.populate('problem', 'title slug difficulty topic topics');
    }
    if (session) query = query.session(session);
    return query;
};

const getProblemReuseInLastDays = async ({
    dateValue,
    problemId,
    lookbackDays = 7,
    session = null
}) => {
    const targetDate = normalizeUtcDate(dateValue);
    const normalizedProblemId = toObjectId(problemId);
    if (!targetDate || !normalizedProblemId) return [];

    const startDate = shiftUtcDays(targetDate, -Math.max(1, lookbackDays));
    let query = DailyChallenge.find({
        problem: normalizedProblemId,
        date: { $gte: startDate, $lt: targetDate }
    })
        .populate('problem', 'title slug difficulty')
        .sort({ date: -1 });
    if (session) query = query.session(session);
    return query;
};

const serializeChallenge = (challengeDoc, now = new Date()) => {
    if (!challengeDoc) return null;
    const dateKey = challengeDoc.dateKey || formatUtcDateKey(challengeDoc.date);
    const expectedDifficulty = challengeDoc.expectedDifficulty || getExpectedDifficultyForDate(challengeDoc.date);

    const problemDoc = challengeDoc.problem || null;
    const problemTopics = Array.isArray(problemDoc?.topics) && problemDoc.topics.length > 0
        ? problemDoc.topics
        : (problemDoc?.topic ? [problemDoc.topic] : []);

    return {
        _id: String(challengeDoc._id),
        date: dateKey,
        dateKey,
        status: buildChallengeStatus(challengeDoc.date, now),
        source: challengeDoc.source,
        difficulty: challengeDoc.difficulty,
        expectedDifficulty,
        overrideRepeatedProblem: Boolean(challengeDoc.overrideRepeatedProblem),
        overrideDifficultyPattern: Boolean(challengeDoc.overrideDifficultyPattern),
        notes: challengeDoc.notes || '',
        createdAt: challengeDoc.createdAt,
        updatedAt: challengeDoc.updatedAt,
        problemId: problemDoc?._id ? String(problemDoc._id) : (challengeDoc.problem ? String(challengeDoc.problem) : null),
        problem: problemDoc?._id ? {
            _id: String(problemDoc._id),
            title: problemDoc.title,
            slug: problemDoc.slug,
            difficulty: problemDoc.difficulty,
            topics: problemTopics,
            topic: problemTopics[0] || null
        } : null
    };
};

module.exports = {
    WEEKDAY_DIFFICULTY_MAP,
    WEEKDAY_LABELS,
    normalizeUtcDate,
    formatUtcDateKey,
    parseDateKey,
    shiftUtcDays,
    getExpectedDifficultyForDate,
    getWeeklyPattern,
    ensureChallengeForDate,
    ensureChallengesForRange,
    findChallengeByDateKey,
    getChallengesInRange,
    getRecentUsedProblemIds,
    getProblemReuseInLastDays,
    serializeChallenge
};
