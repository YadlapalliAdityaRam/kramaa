const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Problem = require('../models/Problem');
const User = require('../models/User');
const { buildPublishedProblemStats } = require('../services/problemStatsService');
const { PROBLEM_STATUS, buildPublicationFields } = require('../utils/problemPublication');

dotenv.config();

const assert = (condition, message) => {
    if (!condition) throw new Error(message);
};

const toTopicMap = (topicRows = []) => {
    const map = new Map();
    topicRows.forEach((row) => {
        map.set(String(row.topic), Number(row.count || 0));
    });
    return map;
};

const baseProblemData = (overrides = {}, createdBy) => ({
    title: `stats-sync-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    slug: `stats-sync-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    description: 'Stats sync validation problem.',
    difficulty: 'Easy',
    topics: ['Arrays'],
    topic: 'Arrays',
    functionName: 'solve',
    sampleTestCases: [{ input: '1', output: '1' }],
    hiddenTestCases: [{ input: '2', output: '2', isHidden: true }],
    createdBy,
    status: PROBLEM_STATUS.PROPOSED,
    isPublished: false,
    ...overrides
});

const printStep = (label) => {
    process.stdout.write(`\n[validate-problem-stats] ${label}\n`);
};

const getStats = async (createdBy) => buildPublishedProblemStats({ createdBy });

const run = async () => {
    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is required');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    printStep('Connected to MongoDB');

    const createdProblemIds = [];
    let adminUserId = null;

    try {
        const nonce = `${Date.now().toString(36).slice(-6)}${Math.random().toString(36).slice(2, 5)}`;
        const admin = await User.create({
            username: `st_${nonce}`,
            email: `stats_admin_${nonce}@example.com`,
            password: 'StrongPass123!',
            role: 'ADMIN',
            accountStatus: 'Active'
        });
        adminUserId = admin._id;

        printStep('1) Proposed problem should not affect stats');
        const proposedProblem = await Problem.create(baseProblemData({
            title: `proposed-${nonce}`,
            slug: `proposed-${nonce}`
        }, admin._id));
        createdProblemIds.push(proposedProblem._id);

        let stats = await getStats(admin._id);
        assert(stats.totalProblems === 0, 'Proposed problem incorrectly counted');

        printStep('2) Approved (unpublished) problem should not affect stats');
        await Problem.findByIdAndUpdate(
            proposedProblem._id,
            buildPublicationFields(PROBLEM_STATUS.APPROVED)
        );
        stats = await getStats(admin._id);
        assert(stats.totalProblems === 0, 'Approved problem incorrectly counted');

        printStep('3) Publishing must increment all relevant counts');
        await Problem.findByIdAndUpdate(
            proposedProblem._id,
            buildPublicationFields(PROBLEM_STATUS.PUBLISHED)
        );
        stats = await getStats(admin._id);
        assert(stats.totalProblems === 1, 'Published problem not counted');
        assert(stats.difficulty.easy === 1, 'Easy count mismatch after publish');
        assert(stats.difficulty.medium === 0 && stats.difficulty.hard === 0, 'Unexpected difficulty counts after publish');
        assert((stats.dailyAdditions[0]?.count || 0) === 1, 'Daily additions mismatch after publish');
        const topicsAfterPublish = toTopicMap(stats.topicDistribution);
        assert((topicsAfterPublish.get('Arrays') || 0) === 1, 'Topic count mismatch after publish');

        printStep('4) Difficulty/topic changes on published problem must recalculate');
        await Problem.findByIdAndUpdate(proposedProblem._id, {
            difficulty: 'Hard',
            topics: ['Graphs'],
            topic: 'Graphs'
        });
        stats = await getStats(admin._id);
        const topicsAfterEdit = toTopicMap(stats.topicDistribution);
        assert(stats.difficulty.easy === 0, 'Easy count did not decrement after difficulty change');
        assert(stats.difficulty.hard === 1, 'Hard count did not increment after difficulty change');
        assert((topicsAfterEdit.get('Graphs') || 0) === 1, 'Topic change not reflected');
        assert((topicsAfterEdit.get('Arrays') || 0) === 0, 'Old topic still counted after topic change');

        printStep('5) Bulk publish must be accurate');
        const bulkProblems = await Problem.insertMany([
            baseProblemData({
                title: `bulk-1-${nonce}`,
                slug: `bulk-1-${nonce}`,
                difficulty: 'Medium',
                topics: ['DP'],
                topic: 'DP',
                tags: ['contest'],
                status: PROBLEM_STATUS.PROPOSED,
                isPublished: false
            }, admin._id),
            baseProblemData({
                title: `bulk-2-${nonce}`,
                slug: `bulk-2-${nonce}`,
                difficulty: 'Medium',
                topics: ['Graphs'],
                topic: 'Graphs',
                status: PROBLEM_STATUS.PROPOSED,
                isPublished: false
            }, admin._id)
        ]);
        createdProblemIds.push(...bulkProblems.map((p) => p._id));

        await Problem.updateMany(
            { _id: { $in: bulkProblems.map((p) => p._id) } },
            buildPublicationFields(PROBLEM_STATUS.PUBLISHED)
        );
        stats = await getStats(admin._id);
        assert(stats.totalProblems === 3, 'Bulk publish total mismatch');
        assert(stats.difficulty.medium === 2, 'Bulk publish medium count mismatch');
        assert(stats.contestProblemCount === 1, 'Contest problem count mismatch after bulk publish');

        printStep('6) Unpublishing must decrement');
        await Problem.findByIdAndUpdate(
            bulkProblems[1]._id,
            buildPublicationFields(PROBLEM_STATUS.APPROVED)
        );
        stats = await getStats(admin._id);
        assert(stats.totalProblems === 2, 'Total did not decrement after unpublish');
        assert(stats.difficulty.medium === 1, 'Medium count did not decrement after unpublish');

        printStep('7) Deleting published problem must decrement');
        await Problem.deleteOne({ _id: proposedProblem._id });
        stats = await getStats(admin._id);
        assert(stats.totalProblems === 1, 'Total did not decrement after deleting published problem');
        assert(stats.difficulty.hard === 0, 'Hard count did not decrement after delete');

        printStep('All validation checks passed');
        process.stdout.write('[validate-problem-stats] PASS\n');
    } finally {
        if (createdProblemIds.length > 0) {
            await Problem.deleteMany({ _id: { $in: createdProblemIds } });
        }
        if (adminUserId) {
            await User.deleteOne({ _id: adminUserId });
        }
        await mongoose.disconnect();
    }
};

run().catch(async (error) => {
    process.stderr.write(`[validate-problem-stats] FAIL: ${error.message}\n`);
    try {
        await mongoose.disconnect();
    } catch (_) {
        // noop
    }
    process.exit(1);
});
