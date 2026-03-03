const mongoose = require('mongoose');
const Problem = require('../models/Problem');
const { buildPublishedProblemMatch } = require('../utils/problemPublication');

const toSafeCount = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0;
};

const toDateKey = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10);
};

const normalizeTopic = (value) => String(value || '').trim();
const toObjectIdOrNull = (value) => {
    if (!value) return null;
    if (value instanceof mongoose.Types.ObjectId) return value;
    const raw = typeof value === 'object' && value?._id ? value._id : value;
    if (mongoose.Types.ObjectId.isValid(raw)) {
        return new mongoose.Types.ObjectId(String(raw));
    }
    return null;
};

const buildPublishedProblemStats = async (options = {}) => {
    const baseMatch = {};
    const createdBy = toObjectIdOrNull(options.createdBy);
    if (createdBy) baseMatch.createdBy = createdBy;

    const match = buildPublishedProblemMatch(baseMatch);
    const pipeline = [
        { $match: match },
        {
            $project: {
                difficulty: '$difficulty',
                createdAt: '$createdAt',
                normalizedTopics: {
                    $let: {
                        vars: {
                            topicsArr: {
                                $filter: {
                                    input: { $ifNull: ['$topics', []] },
                                    as: 'topicItem',
                                    cond: { $gt: [{ $strLenCP: { $trim: { input: { $toString: '$$topicItem' } } } }, 0] }
                                }
                            },
                            topicLegacy: { $trim: { input: { $toString: { $ifNull: ['$topic', ''] } } } }
                        },
                        in: {
                            $cond: [
                                { $gt: [{ $size: '$$topicsArr' }, 0] },
                                '$$topicsArr',
                                {
                                    $cond: [
                                        { $gt: [{ $strLenCP: '$$topicLegacy' }, 0] },
                                        ['$$topicLegacy'],
                                        []
                                    ]
                                }
                            ]
                        }
                    }
                },
                normalizedTagsLower: {
                    $map: {
                        input: { $ifNull: ['$tags', []] },
                        as: 'tag',
                        in: { $toLower: { $trim: { input: { $toString: '$$tag' } } } }
                    }
                }
            }
        },
        {
            $addFields: {
                isContestProblem: {
                    $in: ['contest', '$normalizedTagsLower']
                }
            }
        },
        {
            $facet: {
                totals: [
                    {
                        $group: {
                            _id: null,
                            totalProblems: { $sum: 1 },
                            easy: {
                                $sum: {
                                    $cond: [{ $eq: ['$difficulty', 'Easy'] }, 1, 0]
                                }
                            },
                            medium: {
                                $sum: {
                                    $cond: [{ $eq: ['$difficulty', 'Medium'] }, 1, 0]
                                }
                            },
                            hard: {
                                $sum: {
                                    $cond: [{ $eq: ['$difficulty', 'Hard'] }, 1, 0]
                                }
                            },
                            contestProblems: {
                                $sum: {
                                    $cond: ['$isContestProblem', 1, 0]
                                }
                            }
                        }
                    }
                ],
                topicDistribution: [
                    { $unwind: '$normalizedTopics' },
                    {
                        $group: {
                            _id: '$normalizedTopics',
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { count: -1, _id: 1 } }
                ],
                dailyAdditions: [
                    {
                        $group: {
                            _id: {
                                $dateToString: {
                                    format: '%Y-%m-%d',
                                    date: '$createdAt'
                                }
                            },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { _id: 1 } }
                ]
            }
        }
    ];

    const [agg] = await Problem.aggregate(pipeline);
    const totals = agg?.totals?.[0] || {};
    const topicDistribution = Array.isArray(agg?.topicDistribution) ? agg.topicDistribution : [];
    const dailyAdditions = Array.isArray(agg?.dailyAdditions) ? agg.dailyAdditions : [];

    return {
        generatedAt: new Date().toISOString(),
        totalProblems: toSafeCount(totals.totalProblems),
        difficulty: {
            easy: toSafeCount(totals.easy),
            medium: toSafeCount(totals.medium),
            hard: toSafeCount(totals.hard)
        },
        contestProblemCount: toSafeCount(totals.contestProblems),
        topicDistribution: topicDistribution
            .map((row) => ({
                topic: normalizeTopic(row._id),
                count: toSafeCount(row.count)
            }))
            .filter((row) => Boolean(row.topic)),
        dailyAdditions: dailyAdditions
            .map((row) => ({
                date: toDateKey(row._id),
                count: toSafeCount(row.count)
            }))
            .filter((row) => Boolean(row.date))
    };
};

module.exports = {
    buildPublishedProblemStats
};
