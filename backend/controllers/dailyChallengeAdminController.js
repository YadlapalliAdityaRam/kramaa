const mongoose = require('mongoose');
const DailyChallenge = require('../models/DailyChallenge');
const Problem = require('../models/Problem');
const {
    normalizeUtcDate,
    formatUtcDateKey,
    parseDateKey,
    shiftUtcDays,
    getExpectedDifficultyForDate,
    getWeeklyPattern,
    ensureChallengesForRange,
    getChallengesInRange,
    getProblemReuseInLastDays,
    serializeChallenge
} = require('../services/dailyChallengeService');
const { buildPublishedProblemMatch } = require('../utils/problemPublication');

const clampInt = (value, fallback, min, max) => {
    const parsed = parseInt(value, 10);
    if (!Number.isInteger(parsed)) return fallback;
    return Math.max(min, Math.min(max, parsed));
};

const parseIncomingDate = (rawDate) => {
    if (!rawDate) return null;
    if (rawDate instanceof Date) return normalizeUtcDate(rawDate);

    const asString = String(rawDate).trim();
    if (!asString) return null;

    const byDateKey = parseDateKey(asString);
    if (byDateKey) return byDateKey;

    return normalizeUtcDate(asString);
};

const buildDateRangeKeys = (startDate, endDate) => {
    const keys = [];
    for (let cursor = new Date(startDate); cursor <= endDate; cursor = shiftUtcDays(cursor, 1)) {
        keys.push(formatUtcDateKey(cursor));
    }
    return keys.filter(Boolean);
};

const computeDifficultyDistribution = async (startDate, endDate) => {
    const rows = await DailyChallenge.aggregate([
        {
            $match: {
                date: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: '$difficulty',
                count: { $sum: 1 }
            }
        }
    ]);

    const result = { Easy: 0, Medium: 0, Hard: 0 };
    rows.forEach((row) => {
        if (result[row._id] !== undefined) {
            result[row._id] = Number(row.count || 0);
        }
    });
    return result;
};

const buildWarnings = ({ targetDate, problemDoc, repeatedEntries }) => {
    const expectedDifficulty = getExpectedDifficultyForDate(targetDate);
    const weekday = targetDate.toLocaleString('en-US', {
        weekday: 'long',
        timeZone: 'UTC'
    });

    const repeatedProblem = repeatedEntries.length > 0;
    const difficultyMismatch = String(problemDoc?.difficulty || '') !== String(expectedDifficulty || '');

    return {
        repeatedProblem,
        difficultyMismatch,
        expectedDifficulty,
        weekday,
        repeatedDates: repeatedEntries.map((entry) => formatUtcDateKey(entry.date)).filter(Boolean)
    };
};

const findProblemForChallenge = async (problemId) => {
    if (!mongoose.Types.ObjectId.isValid(problemId)) return null;
    const objectId = new mongoose.Types.ObjectId(problemId);
    return Problem.findOne(buildPublishedProblemMatch({ _id: objectId }))
        .select('_id title slug difficulty topic topics')
        .lean();
};

const normalizeChallengePayload = ({
    challengeDoc,
    targetDate,
    selectedProblem,
    expectedDifficulty,
    userId,
    notes,
    warnings,
    source = DailyChallenge.DAILY_CHALLENGE_SOURCES.ADMIN
}) => {
    challengeDoc.date = normalizeUtcDate(targetDate);
    challengeDoc.dateKey = formatUtcDateKey(targetDate);
    challengeDoc.problem = selectedProblem._id;
    challengeDoc.difficulty = selectedProblem.difficulty;
    challengeDoc.expectedDifficulty = expectedDifficulty;
    challengeDoc.source = source;
    challengeDoc.scheduledBy = userId || null;
    challengeDoc.notes = String(notes || '').trim();
    challengeDoc.overrideRepeatedProblem = Boolean(warnings.repeatedProblem);
    challengeDoc.overrideDifficultyPattern = Boolean(warnings.difficultyMismatch);
};

exports.getDailyChallengesHistory = async (req, res) => {
    try {
        const page = clampInt(req.query.page, 1, 1, 1000);
        const limit = clampInt(req.query.limit, 20, 1, 100);
        const historyDays = clampInt(req.query.days, 90, 7, 3650);

        const today = normalizeUtcDate(new Date());
        const historyStart = shiftUtcDays(today, -(historyDays - 1));

        const query = {
            date: { $gte: historyStart, $lte: today }
        };

        const [total, docs] = await Promise.all([
            DailyChallenge.countDocuments(query),
            DailyChallenge.find(query)
                .populate('problem', 'title slug difficulty topic topics')
                .sort({ date: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
        ]);

        const history = docs.map((doc) => serializeChallenge(doc, today));

        res.json({
            success: true,
            history,
            pagination: {
                page,
                limit,
                total,
                pages: Math.max(1, Math.ceil(total / limit))
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getUpcomingDailyChallenges = async (req, res) => {
    try {
        const lookaheadDays = clampInt(req.query.days, 21, 1, 90);
        const today = normalizeUtcDate(new Date());
        const endDate = shiftUtcDays(today, lookaheadDays - 1);

        const beforeDocs = await getChallengesInRange({
            startDate: today,
            endDate,
            populateProblem: true
        });
        const beforeSet = new Set(beforeDocs.map((doc) => doc.dateKey));
        const allUpcomingDateKeys = buildDateRangeKeys(today, endDate);
        const unscheduledDatesBeforeAutoGeneration = allUpcomingDateKeys
            .filter((key) => !beforeSet.has(key));

        // Auto-fill any missing date with system-generated challenge.
        await ensureChallengesForRange({ startDate: today, endDate });

        const upcomingDocs = await getChallengesInRange({
            startDate: today,
            endDate,
            populateProblem: true
        });
        const upcoming = upcomingDocs.map((doc) => serializeChallenge(doc, today));

        const upcomingSet = new Set(upcoming.map((entry) => entry.dateKey));
        const unscheduledDates = allUpcomingDateKeys.filter((key) => !upcomingSet.has(key));
        const upcomingAutoGeneratedChallenges = upcoming.filter((entry) => entry.source === 'SYSTEM');

        const last30Start = shiftUtcDays(today, -29);
        const difficultyDistributionLast30Days = await computeDifficultyDistribution(last30Start, today);

        const usedLast7Start = shiftUtcDays(today, -6);
        const usedLast7Docs = await DailyChallenge.find({
            date: { $gte: usedLast7Start, $lte: today }
        })
            .populate('problem', 'title slug difficulty')
            .sort({ date: -1 })
            .lean();

        const problemsUsedInLast7Days = usedLast7Docs.map((doc) => ({
            date: formatUtcDateKey(doc.date),
            problemId: doc.problem?._id ? String(doc.problem._id) : null,
            title: doc.problem?.title || 'Unknown problem',
            slug: doc.problem?.slug || null,
            difficulty: doc.problem?.difficulty || doc.difficulty || 'Unknown',
            source: doc.source
        }));

        const weeklyPattern = getWeeklyPattern();
        const weeklyPatternWithSchedule = weeklyPattern.map((entry) => {
            const nextMatchingDate = (() => {
                let cursor = new Date(today);
                for (let i = 0; i < 14; i += 1) {
                    if (cursor.getUTCDay() === entry.weekdayIndex) {
                        return cursor;
                    }
                    cursor = shiftUtcDays(cursor, 1);
                }
                return null;
            })();

            const dateKey = nextMatchingDate ? formatUtcDateKey(nextMatchingDate) : null;
            const scheduled = dateKey ? upcoming.find((challenge) => challenge.dateKey === dateKey) : null;

            return {
                ...entry,
                date: dateKey,
                scheduled: Boolean(scheduled),
                scheduledDifficulty: scheduled?.difficulty || null,
                scheduledSource: scheduled?.source || null
            };
        });

        res.json({
            success: true,
            upcoming,
            weeklyPattern: weeklyPatternWithSchedule,
            insights: {
                difficultyDistributionLast30Days,
                unscheduledDatesBeforeAutoGeneration,
                unscheduledDates,
                problemsUsedInLast7Days,
                upcomingAutoGeneratedChallenges
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.scheduleDailyChallenge = async (req, res) => {
    try {
        const {
            date,
            problemId,
            notes = '',
            replaceExisting = true,
            overrideRepeatedProblem = false,
            overrideDifficultyPattern = false
        } = req.body || {};

        const targetDate = parseIncomingDate(date);
        if (!targetDate) {
            return res.status(400).json({ success: false, message: 'Invalid challenge date. Use YYYY-MM-DD.' });
        }

        const selectedProblem = await findProblemForChallenge(problemId);
        if (!selectedProblem) {
            return res.status(404).json({ success: false, message: 'Problem not found or not published.' });
        }

        const repeatedEntries = await getProblemReuseInLastDays({
            dateValue: targetDate,
            problemId: selectedProblem._id,
            lookbackDays: 7
        });
        const warnings = buildWarnings({
            targetDate,
            problemDoc: selectedProblem,
            repeatedEntries
        });

        const blockedByRepeat = warnings.repeatedProblem && !overrideRepeatedProblem;
        const blockedByDifficulty = warnings.difficultyMismatch && !overrideDifficultyPattern;
        if (blockedByRepeat || blockedByDifficulty) {
            return res.status(409).json({
                success: false,
                message: 'Validation warnings found. Pass override flags to continue.',
                warnings,
                requiresOverride: true
            });
        }

        const dateKey = formatUtcDateKey(targetDate);
        const existing = await DailyChallenge.findOne({ dateKey });
        if (existing && !replaceExisting) {
            return res.status(409).json({
                success: false,
                message: 'A challenge is already scheduled for this date. Use replaceExisting=true to override.'
            });
        }

        const challenge = existing || new DailyChallenge();
        normalizeChallengePayload({
            challengeDoc: challenge,
            targetDate,
            selectedProblem,
            expectedDifficulty: warnings.expectedDifficulty,
            userId: req.user?._id,
            notes,
            warnings
        });
        await challenge.save();
        await challenge.populate('problem', 'title slug difficulty topic topics');

        res.json({
            success: true,
            message: existing ? 'Daily challenge replaced successfully.' : 'Daily challenge scheduled successfully.',
            challenge: serializeChallenge(challenge),
            warnings
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateDailyChallenge = async (req, res) => {
    try {
        const {
            challengeId,
            date,
            problemId,
            notes,
            replaceExisting = true,
            overrideRepeatedProblem = false,
            overrideDifficultyPattern = false
        } = req.body || {};

        if (!mongoose.Types.ObjectId.isValid(challengeId)) {
            return res.status(400).json({ success: false, message: 'Invalid challengeId.' });
        }

        const challenge = await DailyChallenge.findById(challengeId);
        if (!challenge) {
            return res.status(404).json({ success: false, message: 'Daily challenge not found.' });
        }

        const targetDate = date ? parseIncomingDate(date) : normalizeUtcDate(challenge.date);
        if (!targetDate) {
            return res.status(400).json({ success: false, message: 'Invalid challenge date.' });
        }

        const selectedProblem = problemId
            ? await findProblemForChallenge(problemId)
            : await Problem.findById(challenge.problem).select('_id title slug difficulty topic topics').lean();
        if (!selectedProblem) {
            return res.status(404).json({ success: false, message: 'Problem not found or not published.' });
        }

        const repeatedEntries = await getProblemReuseInLastDays({
            dateValue: targetDate,
            problemId: selectedProblem._id,
            lookbackDays: 7
        });

        const warnings = buildWarnings({
            targetDate,
            problemDoc: selectedProblem,
            repeatedEntries: repeatedEntries.filter((entry) => String(entry._id) !== String(challenge._id))
        });

        const blockedByRepeat = warnings.repeatedProblem && !overrideRepeatedProblem;
        const blockedByDifficulty = warnings.difficultyMismatch && !overrideDifficultyPattern;
        if (blockedByRepeat || blockedByDifficulty) {
            return res.status(409).json({
                success: false,
                message: 'Validation warnings found. Pass override flags to continue.',
                warnings,
                requiresOverride: true
            });
        }

        const targetDateKey = formatUtcDateKey(targetDate);
        if (targetDateKey !== challenge.dateKey) {
            const conflict = await DailyChallenge.findOne({ dateKey: targetDateKey });
            if (conflict && String(conflict._id) !== String(challenge._id)) {
                if (!replaceExisting) {
                    return res.status(409).json({
                        success: false,
                        message: 'Another challenge already exists on the target date. Set replaceExisting=true to replace it.'
                    });
                }
                await DailyChallenge.deleteOne({ _id: conflict._id });
            }
        }

        normalizeChallengePayload({
            challengeDoc: challenge,
            targetDate,
            selectedProblem,
            expectedDifficulty: warnings.expectedDifficulty,
            userId: req.user?._id,
            notes: notes !== undefined ? notes : challenge.notes,
            warnings
        });
        await challenge.save();
        await challenge.populate('problem', 'title slug difficulty topic topics');

        res.json({
            success: true,
            message: 'Daily challenge updated successfully.',
            challenge: serializeChallenge(challenge),
            warnings
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteDailyChallenge = async (req, res) => {
    try {
        const { challengeId, date } = req.body || {};
        let challenge = null;

        if (challengeId && mongoose.Types.ObjectId.isValid(challengeId)) {
            challenge = await DailyChallenge.findById(challengeId);
        }

        if (!challenge && date) {
            const parsedDate = parseIncomingDate(date);
            if (parsedDate) {
                challenge = await DailyChallenge.findOne({ dateKey: formatUtcDateKey(parsedDate) });
            }
        }

        if (!challenge) {
            return res.status(404).json({ success: false, message: 'Daily challenge not found.' });
        }

        await DailyChallenge.deleteOne({ _id: challenge._id });
        res.json({
            success: true,
            message: 'Daily challenge deleted successfully.',
            deletedChallengeId: String(challenge._id),
            deletedDate: challenge.dateKey
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
