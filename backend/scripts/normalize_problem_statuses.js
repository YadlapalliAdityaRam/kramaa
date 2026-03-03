const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Problem = require('../models/Problem');
const { PROBLEM_STATUS } = require('../utils/problemPublication');

dotenv.config();

const normalizeAllProblemStatuses = async () => {
    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is required');
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const allProblems = await Problem.find({})
        .select('_id status isPublished publishedAt createdAt')
        .lean();

    let modified = 0;
    const bulkOps = [];

    allProblems.forEach((problem) => {
        const rawStatus = String(problem.status || '').trim();
        const isPublishedFlag = Boolean(problem.isPublished);

        let nextStatus = PROBLEM_STATUS.PROPOSED;
        if (isPublishedFlag) {
            nextStatus = PROBLEM_STATUS.PUBLISHED;
        } else if (rawStatus === 'READY_TO_PUBLISH' || rawStatus.toLowerCase() === PROBLEM_STATUS.APPROVED) {
            nextStatus = PROBLEM_STATUS.APPROVED;
        } else if (rawStatus === 'DRAFT' || rawStatus.toLowerCase() === PROBLEM_STATUS.PROPOSED) {
            nextStatus = PROBLEM_STATUS.PROPOSED;
        } else if (rawStatus === 'PUBLISHED' || rawStatus.toLowerCase() === PROBLEM_STATUS.PUBLISHED) {
            nextStatus = PROBLEM_STATUS.PUBLISHED;
        }

        const nextIsPublished = nextStatus === PROBLEM_STATUS.PUBLISHED;
        const nextPublishedAt = nextIsPublished
            ? (problem.publishedAt || problem.createdAt || new Date())
            : null;

        const shouldUpdate = (
            rawStatus !== nextStatus
            || Boolean(problem.isPublished) !== nextIsPublished
            || String(problem.publishedAt || '') !== String(nextPublishedAt || '')
        );

        if (shouldUpdate) {
            modified += 1;
            bulkOps.push({
                updateOne: {
                    filter: { _id: problem._id },
                    update: {
                        $set: {
                            status: nextStatus,
                            isPublished: nextIsPublished,
                            publishedAt: nextPublishedAt
                        }
                    }
                }
            });
        }
    });

    if (bulkOps.length > 0) {
        await Problem.bulkWrite(bulkOps, { ordered: false });
    }

    const summary = await Problem.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    console.log(`[normalize-problem-statuses] modified=${modified}`);
    console.log('[normalize-problem-statuses] statusSummary=', summary);

    await mongoose.disconnect();
};

normalizeAllProblemStatuses().catch(async (error) => {
    console.error(`[normalize-problem-statuses] FAIL: ${error.message}`);
    try {
        await mongoose.disconnect();
    } catch (_) {
        // noop
    }
    process.exit(1);
});
