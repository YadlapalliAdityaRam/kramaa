const Problem = require('../models/Problem');
const User = require('../models/User');
const ProblemLike = require('../models/ProblemLike');
const mongoose = require('mongoose');
const auditLogger = require('../services/auditLogger');
const Submission = require('../models/Submission');
const Doubt = require('../models/Doubt');
const Solution = require('../models/Solution');
const TestcaseGenerator = require('../models/TestcaseGenerator');
const ValidationJob = require('../models/ValidationJob');
const validationWorker = require('../services/validationWorker');
const { buildPublishedProblemStats } = require('../services/problemStatsService');
const { resolveStarterCode } = require('../utils/templateGenerator');
const {
    normalizeAndValidateTestCases,
    ProblemTestCaseValidationError
} = require('../utils/problemTestCaseValidator');
const {
    OUTPUT_VALIDATION_TYPES,
    normalizeOutputValidationType,
    normalizeFloatTolerance
} = require('../utils/outputValidation');
const {
    PROBLEM_STATUS,
    buildPublishedProblemMatch,
    buildPublicationFields,
    resolveLifecycleStatus
} = require('../utils/problemPublication');

const normalizeUniqueStringArray = (values) => {
    if (!Array.isArray(values)) return [];
    const unique = new Set();
    values.forEach((raw) => {
        const value = String(raw || '').trim();
        if (value) unique.add(value);
    });
    return Array.from(unique);
};

const getPrimaryAdminOwnerId = async (fallbackUserId) => {
    const primaryAdmin = await User.findOne({
        role: 'ADMIN',
        accountStatus: { $ne: 'Deleted' }
    })
        .sort({ createdAt: 1, _id: 1 })
        .select('_id')
        .lean();

    return primaryAdmin?._id || fallbackUserId;
};

const buildEditorialPayload = (editorialDraft, userId) => {
    if (!editorialDraft || typeof editorialDraft !== 'object') return null;

    const rawApproaches = Array.isArray(editorialDraft.approaches)
        ? editorialDraft.approaches
        : [editorialDraft];

    const approaches = rawApproaches
        .map((approach) => {
            const title = String(approach?.title || '').trim();
            const description = String(approach?.description || '').trim();
            if (!title || !description) return null;

            const media = Array.isArray(approach?.media)
                ? approach.media
                    .map((item) => ({
                        type: item?.type === 'video' ? 'video' : 'image',
                        url: String(item?.url || '').trim(),
                        caption: String(item?.caption || '').trim()
                    }))
                    .filter((item) => Boolean(item.url))
                : [];

            return {
                title,
                description,
                timeComplexity: String(approach?.timeComplexity || '').trim(),
                spaceComplexity: String(approach?.spaceComplexity || '').trim(),
                code: String(approach?.code || ''),
                codeLanguage: String(approach?.codeLanguage || '').trim(),
                media
            };
        })
        .filter(Boolean);

    if (!approaches.length) return null;

    return {
        editorial: {
            approaches,
            publishedBy: userId,
            publishedAt: new Date()
        },
        editorialPublished: editorialDraft.publish !== false
    };
};

// Get all problems (Public)
exports.getAllProblems = async (req, res) => {
    try {
        const { difficulty, topic, search } = req.query;

        // Build query
        const query = buildPublishedProblemMatch({});

        if (difficulty && difficulty !== 'All') query.difficulty = difficulty;
        if (topic && topic !== 'All') {
            // Check if topics array contains the topic
            query.topics = topic;
        }
        if (req.query.company && req.query.company !== 'All') {
            query.companies = req.query.company;
        }
        if (search) query.title = { $regex: search, $options: 'i' };

        // Exclude heavy/sensitive fields
        const problems = await Problem.find(query)
            .select('-hiddenTestCases -referenceSolution -sampleTestCases')
            .sort({ order: 1, createdAt: -1 });

        res.json({ success: true, problems });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all problems for Admin (Include unpublished)
exports.getAdminProblems = async (req, res) => {
    try {
        const problems = await Problem.find({})
            .populate('createdBy', 'username email')
            .sort({ createdAt: -1 });
        res.json({ success: true, problems });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get published-problem statistics (Admin/Super Admin)
exports.getPublishedProblemStats = async (req, res) => {
    try {
        const createdBy = req.query?.createdBy;
        const scopedCreatedBy = mongoose.Types.ObjectId.isValid(createdBy)
            ? new mongoose.Types.ObjectId(createdBy)
            : undefined;
        const stats = await buildPublishedProblemStats(
            scopedCreatedBy ? { createdBy: scopedCreatedBy } : {}
        );

        res.json({ success: true, stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get single problem (Public/Admin)
exports.getProblem = async (req, res) => {
    try {
        const id = req.params.id;
        let query;

        if (mongoose.Types.ObjectId.isValid(id)) {
            query = { _id: id };
        } else {
            query = { slug: id };
        }

        // If user is admin/super_admin, they can see everything (including unpublished)
        // Check if user is authenticated and has role
        let isPowerUser = false;
        if (req.user && ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
            isPowerUser = true;
        }

        if (!isPowerUser) {
            query = buildPublishedProblemMatch(query);
        }

        let problemQuery = Problem.findOne(query);

        // ALWAYS select reference solution (since users should see it)
        // Admin gets hidden test cases too
        if (isPowerUser) {
            problemQuery = problemQuery.select('+hiddenTestCases +referenceSolution');
        } else {
            problemQuery = problemQuery.select('+referenceSolution');
        }

        const problem = await problemQuery;

        if (!problem) {
            return res.status(404).json({ success: false, message: 'Problem not found' });
        }

        // Check if user has liked/disliked the problem
        let hasLiked = false;
        let hasDisliked = false;
        if (req.user) {
            const reaction = await ProblemLike.findOne({ problem: problem._id, user: req.user._id });
            if (reaction) {
                hasLiked = reaction.reactionType === 'like';
                hasDisliked = reaction.reactionType === 'dislike';
            }
        }

        const problemObject = problem.toObject();
        problemObject.starterCode = resolveStarterCode({
            starterCode: problemObject.starterCode,
            className: problemObject.className,
            functionName: problemObject.functionName,
            returnType: problemObject.returnType,
            parameters: problemObject.parameters
        });

        res.json({ success: true, problem: { ...problemObject, hasLiked, hasDisliked } });
    } catch (error) {
        const validationErrors = extractValidationErrors(error);
        if (validationErrors) {
            return res.status(400).json({
                success: false,
                message: 'Problem validation failed.',
                errors: validationErrors
            });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

const extractValidationErrors = (error) => {
    if (error?.name === 'ProblemTestCaseValidationError' && Array.isArray(error.issues)) {
        return error.issues.map((issue) => ({
            path: issue.path,
            code: issue.code,
            message: issue.message
        }));
    }

    if (error?.name === 'ValidationError' && error.errors) {
        return Object.values(error.errors).map((entry) => ({
            path: entry.path,
            code: 'VALIDATION_ERROR',
            message: entry.message
        }));
    }

    return null;
};

// Create Problem (Admin Only)
exports.createProblem = async (req, res) => {
    try {
        const { editorialDraft, ...incomingData } = req.body || {};
        const normalizedTopics = normalizeUniqueStringArray(
            Array.isArray(incomingData.topics)
                ? incomingData.topics
                : (incomingData.topic ? [incomingData.topic] : [])
        );

        const problemData = {
            ...incomingData,
            createdBy: await getPrimaryAdminOwnerId(req.user.id),
            topics: normalizedTopics,
            companies: normalizeUniqueStringArray(incomingData.companies || [])
        };
        problemData.validationType = normalizeOutputValidationType(problemData.validationType);
        problemData.tolerance = normalizeFloatTolerance(problemData.tolerance);
        problemData.validationKey = String(problemData.validationKey || '').trim();
        if (problemData.validationType !== OUTPUT_VALIDATION_TYPES.ANY_VALID) {
            problemData.validationKey = '';
        }

        const sampleValidation = normalizeAndValidateTestCases(problemData.sampleTestCases || [], {
            parameters: problemData.parameters || [],
            returnType: problemData.returnType,
            validationType: problemData.validationType || OUTPUT_VALIDATION_TYPES.EXACT,
            validationKey: problemData.validationKey || '',
            tolerance: normalizeFloatTolerance(problemData.tolerance),
            allowCoercion: false,
            fieldPrefix: 'sampleTestCases'
        });
        const hiddenValidation = normalizeAndValidateTestCases(problemData.hiddenTestCases || [], {
            parameters: problemData.parameters || [],
            returnType: problemData.returnType,
            validationType: problemData.validationType || OUTPUT_VALIDATION_TYPES.EXACT,
            validationKey: problemData.validationKey || '',
            tolerance: normalizeFloatTolerance(problemData.tolerance),
            allowCoercion: false,
            fieldPrefix: 'hiddenTestCases'
        });
        const createIssues = [...sampleValidation.issues, ...hiddenValidation.issues];
        if (createIssues.length > 0) {
            throw new ProblemTestCaseValidationError(createIssues);
        }
        problemData.sampleTestCases = sampleValidation.normalizedTestCases;
        problemData.hiddenTestCases = hiddenValidation.normalizedTestCases;

        const resolvedStatus = resolveLifecycleStatus({
            incomingStatus: incomingData.status,
            incomingIsPublished: incomingData.isPublished,
            currentStatus: PROBLEM_STATUS.PROPOSED
        });
        Object.assign(problemData, buildPublicationFields(resolvedStatus));

        // Sync legacy topic field
        if (problemData.topics.length > 0) {
            problemData.topic = problemData.topics[0];
        }

        const editorialPayload = buildEditorialPayload(editorialDraft, req.user._id);
        if (editorialPayload) {
            problemData.editorial = editorialPayload.editorial;
            problemData.editorialPublished = editorialPayload.editorialPublished;
        }

        // Check for duplicate title
        const existingProblem = await Problem.findOne({ title: problemData.title });
        if (existingProblem) {
            return res.status(400).json({ success: false, message: 'A problem with this title already exists. Please use a unique title.' });
        }

        const problem = await Problem.create(problemData);

        await auditLogger.log(req.user._id, 'PROBLEM_CREATE', 'PROBLEM', {
            problemId: problem._id,
            title: problem.title
        }, req.ip);

        const io = req?.app?.get?.('io');
        if (io) {
            io.emit('newProblemAdded', { problemId: problem._id });
        }

        res.status(201).json({ success: true, problem });
    } catch (error) {
        const validationErrors = extractValidationErrors(error);
        if (validationErrors) {
            return res.status(400).json({
                success: false,
                message: 'Problem validation failed.',
                errors: validationErrors
            });
        }
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Problem with this title or slug already exists.' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update Problem (Admin Only)
exports.updateProblem = async (req, res) => {
    try {
        const { editorialDraft, ...incomingUpdates } = req.body || {};
        let problem = await Problem.findById(req.params.id);

        if (!problem) {
            return res.status(404).json({ success: false, message: 'Problem not found' });
        }

        const updates = { ...incomingUpdates };
        if (Object.prototype.hasOwnProperty.call(updates, 'validationType')) {
            updates.validationType = normalizeOutputValidationType(updates.validationType);
            if (updates.validationType !== OUTPUT_VALIDATION_TYPES.ANY_VALID
                && !Object.prototype.hasOwnProperty.call(updates, 'validationKey')) {
                updates.validationKey = '';
            }
        }
        if (Object.prototype.hasOwnProperty.call(updates, 'tolerance')) {
            updates.tolerance = normalizeFloatTolerance(updates.tolerance);
        }
        if (Object.prototype.hasOwnProperty.call(updates, 'validationKey')) {
            updates.validationKey = String(updates.validationKey || '').trim();
        }

        // Handle topics update
        if (updates.topics) {
            const normalizedTopics = normalizeUniqueStringArray(updates.topics);
            updates.topics = normalizedTopics;
            updates.topic = normalizedTopics[0] || '';
        }

        if (updates.companies) {
            updates.companies = normalizeUniqueStringArray(updates.companies);
        }

        const effectiveParameters = Array.isArray(updates.parameters)
            ? updates.parameters
            : (problem.parameters || []);
        const effectiveReturnType = typeof updates.returnType === 'string'
            ? updates.returnType
            : problem.returnType;
        const effectiveValidationType = typeof updates.validationType === 'string'
            ? normalizeOutputValidationType(updates.validationType)
            : normalizeOutputValidationType(problem.validationType);
        const effectiveValidationKey = typeof updates.validationKey === 'string'
            ? updates.validationKey
            : (problem.validationKey || '');
        const effectiveTolerance = Object.prototype.hasOwnProperty.call(updates, 'tolerance')
            ? normalizeFloatTolerance(updates.tolerance)
            : normalizeFloatTolerance(problem.tolerance);
        if (Object.prototype.hasOwnProperty.call(updates, 'sampleTestCases')) {
            const sampleValidation = normalizeAndValidateTestCases(updates.sampleTestCases || [], {
                parameters: effectiveParameters,
                returnType: effectiveReturnType,
                validationType: effectiveValidationType,
                validationKey: effectiveValidationKey,
                tolerance: effectiveTolerance,
                allowCoercion: false,
                fieldPrefix: 'sampleTestCases'
            });
            if (sampleValidation.issues.length > 0) {
                throw new ProblemTestCaseValidationError(sampleValidation.issues);
            }
            updates.sampleTestCases = sampleValidation.normalizedTestCases;
        }
        if (Object.prototype.hasOwnProperty.call(updates, 'hiddenTestCases')) {
            const hiddenValidation = normalizeAndValidateTestCases(updates.hiddenTestCases || [], {
                parameters: effectiveParameters,
                returnType: effectiveReturnType,
                validationType: effectiveValidationType,
                validationKey: effectiveValidationKey,
                tolerance: effectiveTolerance,
                allowCoercion: false,
                fieldPrefix: 'hiddenTestCases'
            });
            if (hiddenValidation.issues.length > 0) {
                throw new ProblemTestCaseValidationError(hiddenValidation.issues);
            }
            updates.hiddenTestCases = hiddenValidation.normalizedTestCases;
        }

        if (Object.prototype.hasOwnProperty.call(updates, 'status')
            || Object.prototype.hasOwnProperty.call(updates, 'isPublished')) {
            const resolvedStatus = resolveLifecycleStatus({
                incomingStatus: updates.status,
                incomingIsPublished: updates.isPublished,
                currentStatus: problem.status
            });
            Object.assign(updates, buildPublicationFields(resolvedStatus, problem.publishedAt));
        }

        if (editorialDraft !== undefined) {
            const editorialPayload = buildEditorialPayload(editorialDraft, req.user._id);
            if (editorialPayload) {
                updates.editorial = editorialPayload.editorial;
                updates.editorialPublished = editorialPayload.editorialPublished;
            }
        }

        problem = await Problem.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true
        });

        await auditLogger.log(req.user._id, 'PROBLEM_UPDATE', 'PROBLEM', {
            problemId: problem._id,
            updates: Object.keys(updates)
        }, req.ip);

        res.json({ success: true, problem });
    } catch (error) {
        const validationErrors = extractValidationErrors(error);
        if (validationErrors) {
            return res.status(400).json({
                success: false,
                message: 'Problem validation failed.',
                errors: validationErrors
            });
        }
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Problem with this title or slug already exists.' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete Problem (Admin Only)
exports.deleteProblem = async (req, res) => {
    try {
        const problemId = req.params.id;
        const problem = await Problem.findById(problemId);

        if (!problem) {
            return res.status(404).json({ success: false, message: 'Problem not found' });
        }

        // Cascade Delete
        // Use Promise.all for parallel deletion
        await Promise.all([
            problem.deleteOne(),
            Submission.deleteMany({ problem: problemId }),
            ProblemLike.deleteMany({ problem: problemId }),
            Doubt.deleteMany({ problem: problemId }),
            // Remove from users who solved it
            User.updateMany({}, { $pull: { solvedProblems: problemId } })
        ]);

        await auditLogger.log(req.user._id, 'PROBLEM_DELETE', 'PROBLEM', {
            problemId: problemId,
            title: problem.title
        }, req.ip);

        res.json({ success: true, message: 'Problem and all related data deleted successfully' });
    } catch (error) {
        console.error('deleteProblem error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Company Statistics
// Get Company Statistics
exports.getCompanyStats = async (req, res) => {
    try {
        const { companyName } = req.params;

        // Ensure accurate matching for company name (case-insensitive)
        const query = buildPublishedProblemMatch({
            companies: { $regex: new RegExp(`^${companyName}$`, 'i') }
        });

        const problems = await Problem.find(query)
            .select('title difficulty topic topics slug companies xpReward acceptanceRate')
            .lean();

        // Calculate Difficulty Breakdown
        const difficultyStats = {
            Easy: problems.filter(p => p.difficulty === 'Easy').length,
            Medium: problems.filter(p => p.difficulty === 'Medium').length,
            Hard: problems.filter(p => p.difficulty === 'Hard').length,
            total: problems.length
        };

        // Group by Topic for Preparation Path
        const topicMap = {};
        problems.forEach(p => {
            // Use primary topic or iterate through all? 
            // For prep path, usually one main topic is enough. 
            // We use the first topic from the array, or fallback to the legacy 'topic' field.
            let primaryTopic = p.topic;
            if (p.topics && p.topics.length > 0) {
                primaryTopic = p.topics[0];
            }

            if (primaryTopic) {
                if (!topicMap[primaryTopic]) {
                    topicMap[primaryTopic] = [];
                }
                topicMap[primaryTopic].push(p);
            }
        });

        const topics = Object.keys(topicMap).map(topic => ({
            name: topic,
            count: topicMap[topic].length,
            problems: topicMap[topic]
        })).sort((a, b) => b.count - a.count); // Most popular topics first

        res.json({
            success: true,
            company: companyName,
            stats: difficultyStats,
            topics: topics, // Ordered list for "Preparation Path"
            totalProblems: problems.length
        });
    } catch (error) {
        const validationErrors = extractValidationErrors(error);
        if (validationErrors) {
            return res.status(400).json({
                success: false,
                message: 'Testcase validation failed.',
                errors: validationErrors
            });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// React to a problem (like or dislike) - atomic, mutually exclusive
exports.reactToProblem = async (req, res) => {
    try {
        const problemId = req.params.id;
        const userId = req.user._id;
        const { type } = req.body; // 'like' or 'dislike'

        if (!['like', 'dislike'].includes(type)) {
            return res.status(400).json({ success: false, message: 'Type must be like or dislike' });
        }

        const problem = await Problem.findById(problemId);
        if (!problem) return res.status(404).json({ success: false, message: 'Problem not found' });

        const existing = await ProblemLike.findOne({ problem: problemId, user: userId });

        if (existing) {
            const currentType = existing.reactionType || 'like';

            if (currentType === type) {
                // Same type → remove reaction (toggle off)
                await existing.deleteOne();
                const update = type === 'like'
                    ? { $inc: { likesCount: -1 } }
                    : { $inc: { dislikesCount: -1 } };
                const updated = await Problem.findByIdAndUpdate(problemId, update, { new: true });
                // Ensure counts don't go below 0
                if ((updated.likesCount || 0) < 0) await Problem.findByIdAndUpdate(problemId, { likesCount: 0 });
                if ((updated.dislikesCount || 0) < 0) await Problem.findByIdAndUpdate(problemId, { dislikesCount: 0 });

                return res.json({
                    success: true,
                    action: 'removed',
                    likesCount: Math.max(0, updated.likesCount || 0),
                    dislikesCount: Math.max(0, updated.dislikesCount || 0),
                    hasLiked: false,
                    hasDisliked: false
                });
            } else {
                // Different type → switch reaction
                existing.reactionType = type;
                await existing.save();

                const incUpdate = currentType === 'like'
                    ? { $inc: { likesCount: -1, dislikesCount: 1 } }
                    : { $inc: { dislikesCount: -1, likesCount: 1 } };
                const updated = await Problem.findByIdAndUpdate(problemId, incUpdate, { new: true });

                return res.json({
                    success: true,
                    action: 'switched',
                    likesCount: Math.max(0, updated.likesCount || 0),
                    dislikesCount: Math.max(0, updated.dislikesCount || 0),
                    hasLiked: type === 'like',
                    hasDisliked: type === 'dislike'
                });
            }
        } else {
            // No existing reaction → create new
            await ProblemLike.create({ problem: problemId, user: userId, reactionType: type });
            const incUpdate = type === 'like'
                ? { $inc: { likesCount: 1 } }
                : { $inc: { dislikesCount: 1 } };
            const updated = await Problem.findByIdAndUpdate(problemId, incUpdate, { new: true });

            return res.json({
                success: true,
                action: 'created',
                likesCount: updated.likesCount || 0,
                dislikesCount: updated.dislikesCount || 0,
                hasLiked: type === 'like',
                hasDisliked: type === 'dislike'
            });
        }
    } catch (error) {
        console.error('reactToProblem error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Keep legacy endpoints for backward compat
exports.likeProblem = async (req, res) => {
    req.body.type = 'like';
    return exports.reactToProblem(req, res);
};

exports.unlikeProblem = async (req, res) => {
    req.body.type = 'like';
    return exports.reactToProblem(req, res);
};

// --- Validation Gate Endpoints ---

// Start Validation (POST /:id/validate)
exports.validateProblem = async (req, res) => {
    try {
        const problemId = req.params.id;
        const problem = await Problem.findById(problemId);
        if (!problem) return res.status(404).json({ success: false, message: 'Problem not found' });

        // Check if job already running?
        const existingJob = await ValidationJob.findOne({ problemId, status: 'RUNNING' });
        if (existingJob) {
            return res.json({ success: true, message: 'Validation already running', jobId: existingJob._id });
        }

        // Create Job
        const job = await ValidationJob.create({
            problemId,
            status: 'QUEUED',
            startedAt: new Date(),
            logs: ['Job queued...']
        });

        // Update Problem status
        problem.validationStatus = 'RUNNING';
        await problem.save();

        // Trigger Worker (Async - fire and forget from API perspective)
        validationWorker.validateProblem(job._id);

        res.json({ success: true, message: 'Validation started', jobId: job._id });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Report (GET /:id/validation-report)
exports.getValidationReport = async (req, res) => {
    try {
        const problem = await Problem.findById(req.params.id).select('validationStatus lastValidationReport status');
        if (!problem) return res.status(404).json({ success: false, message: 'Problem not found' });

        res.json({ success: true, validationStatus: problem.validationStatus, lastValidationReport: problem.lastValidationReport, status: problem.status });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Publish (POST /:id/publish)
exports.publishProblem = async (req, res) => {
    try {
        const problem = await Problem.findById(req.params.id);
        if (!problem) return res.status(404).json({ success: false, message: 'Problem not found' });

        if (problem.validationStatus !== 'PASSED') {
            return res.status(400).json({ success: false, message: 'Cannot publish: Validation not passed.' });
        }

        Object.assign(problem, buildPublicationFields(PROBLEM_STATUS.PUBLISHED, problem.publishedAt));
        problem.approvalStatus = 'APPROVED';
        problem.approvedBy = req.user._id;
        await problem.save();

        res.json({ success: true, message: 'Problem published successfully', problem });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Add/Update Solution (POST /:id/solutions)
exports.addSolution = async (req, res) => {
    try {
        const { solutionType, language, sourceCode } = req.body;
        // Validate type
        if (!['REFERENCE', 'BRUTE_FORCE', 'WRONG'].includes(solutionType)) {
            return res.status(400).json({ success: false, message: 'Invalid solution type' });
        }

        // If Reference, upsert (only one allowed per problem)
        if (solutionType === 'REFERENCE') {
            await Solution.findOneAndUpdate(
                { problemId: req.params.id, solutionType: 'REFERENCE' },
                { language, sourceCode },
                { upsert: true, new: true }
            );
        } else {
            // For others, just create new (or update if ID provided? For now, add new)
            await Solution.create({
                problemId: req.params.id,
                solutionType,
                language,
                sourceCode
            });
        }
        res.json({ success: true, message: 'Solution saved' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Add/Update Generator (POST /:id/generator)
exports.setGenerator = async (req, res) => {
    try {
        const { language, generatorCode, constraints } = req.body;
        await TestcaseGenerator.findOneAndUpdate(
            { problemId: req.params.id },
            { language, generatorCode, constraints },
            { upsert: true, new: true }
        );
        res.json({ success: true, message: 'Generator saved' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Validation Data (Generators/Solutions) for UI
exports.getValidationData = async (req, res) => {
    try {
        // We need test cases too for manual management
        const problem = await Problem.findById(req.params.id)
            .select('sampleTestCases hiddenTestCases');

        const solutions = await Solution.find({ problemId: req.params.id });
        const generator = await TestcaseGenerator.findOne({ problemId: req.params.id });

        res.json({
            success: true,
            solutions,
            generator,
            sampleTestCases: problem ? problem.sampleTestCases : [],
            hiddenTestCases: problem ? problem.hiddenTestCases : []
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Add generated test cases (from AI or manual)
exports.addTestCases = async (req, res) => {
    try {
        const { testCases, type = 'hidden' } = req.body;
        const problem = await Problem.findById(req.params.id);

        if (!problem) {
            return res.status(404).json({ success: false, message: 'Problem not found' });
        }

        // Validate structure (handle both strings and JSON objects)
        const normalizeInput = (inp) => typeof inp === 'string' ? inp.trim() : JSON.stringify(inp);

        const seen = new Set();
        const existingInputs = new Set([
            ...problem.sampleTestCases.map(tc => normalizeInput(tc.input)),
            ...problem.hiddenTestCases.map(tc => normalizeInput(tc.input))
        ]);

        const incomingCases = [];
        for (const tc of testCases) {
            const inputKey = normalizeInput(tc.input);
            if (!inputKey || seen.has(inputKey) || existingInputs.has(inputKey)) continue;

            seen.add(inputKey);

            incomingCases.push({
                input: tc.input,
                output: tc.expectedOutput ?? tc.output,
                explanation: tc.explanation || 'AI Generated',
                isHidden: type === 'hidden'
            });
        }

        const validation = normalizeAndValidateTestCases(incomingCases, {
            parameters: problem.parameters || [],
            returnType: problem.returnType,
            validationType: problem.validationType || OUTPUT_VALIDATION_TYPES.EXACT,
            validationKey: problem.validationKey || '',
            tolerance: normalizeFloatTolerance(problem.tolerance),
            allowCoercion: false,
            fieldPrefix: 'testCases'
        });
        if (validation.issues.length > 0) {
            throw new ProblemTestCaseValidationError(validation.issues);
        }
        const validCases = validation.normalizedTestCases;

        if (validCases.length === 0) {
            return res.json({ success: true, message: 'No new unique test cases to add.', count: 0 });
        }

        if (type === 'hidden') {
            problem.hiddenTestCases.push(...validCases);
        } else {
            problem.sampleTestCases.push(...validCases);
        }

        await problem.save();
        await auditLogger.log(req.user._id, 'PROBLEM_TEST_CASES_ADD', 'PROBLEM', {
            problemId: problem._id,
            count: validCases.length,
            type
        }, req.ip);

        res.json({ success: true, message: `Added ${validCases.length} test cases.`, count: validCases.length });

    } catch (error) {
        const validationErrors = extractValidationErrors(error);
        if (validationErrors) {
            return res.status(400).json({
                success: false,
                message: 'Testcase validation failed.',
                errors: validationErrors
            });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// ═══ EDITORIAL ENDPOINTS ═══

// Save Editorial (PUT /:id/editorial) — Admin only
exports.saveEditorial = async (req, res) => {
    try {
        const { approaches, publish } = req.body;
        if (!approaches || !Array.isArray(approaches) || approaches.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one approach is required' });
        }

        const problem = await Problem.findById(req.params.id);
        if (!problem) return res.status(404).json({ success: false, message: 'Problem not found' });

        problem.editorial = {
            approaches: approaches.map(a => ({
                title: a.title,
                description: a.description,
                timeComplexity: a.timeComplexity || '',
                spaceComplexity: a.spaceComplexity || '',
                code: a.code || '',
                codeLanguage: a.codeLanguage || '',
                media: (a.media || []).map(m => ({
                    type: m.type,
                    url: m.url,
                    caption: m.caption || ''
                }))
            })),
            publishedBy: req.user._id,
            publishedAt: new Date()
        };
        problem.editorialPublished = publish !== false;

        await problem.save();
        res.json({ success: true, message: 'Editorial saved successfully', editorial: problem.editorial, editorialPublished: problem.editorialPublished });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Editorial (GET /:id/editorial)
exports.getEditorial = async (req, res) => {
    try {
        const problem = await Problem.findById(req.params.id)
            .select('editorial editorialPublished')
            .populate('editorial.publishedBy', 'username');

        if (!problem) return res.status(404).json({ success: false, message: 'Problem not found' });

        // Non-admins can only see published editorials
        const isAdmin = req.user && (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN');
        if (!problem.editorialPublished && !isAdmin) {
            return res.json({ success: true, editorial: null, editorialPublished: false });
        }

        res.json({
            success: true,
            editorial: problem.editorial || { approaches: [] },
            editorialPublished: problem.editorialPublished
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ═══ BOOKMARK ENDPOINT ═══

// Toggle Bookmark (POST /:id/bookmark) — Authenticated users
exports.toggleBookmark = async (req, res) => {
    try {
        const problemId = req.params.id;
        const userId = req.user._id;

        const problem = await Problem.findById(problemId);
        if (!problem) return res.status(404).json({ success: false, message: 'Problem not found' });

        const user = await User.findById(userId);
        const idx = user.bookmarkedProblems.indexOf(problemId);

        if (idx > -1) {
            user.bookmarkedProblems.splice(idx, 1);
        } else {
            user.bookmarkedProblems.push(problemId);
        }

        await user.save();

        res.json({
            success: true,
            bookmarked: idx === -1,
            bookmarkedProblems: user.bookmarkedProblems
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
