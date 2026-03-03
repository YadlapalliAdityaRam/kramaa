const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const User = require('../models/User');
const Contest = require('../models/Contest');
const ContestParticipant = require('../models/ContestParticipant');
const codeExecutor = require('../services/codeExecutor');
const analyticsService = require('../services/analyticsService');
const globalRankService = require('../services/globalRankService');
const notificationService = require('../services/notificationService');
const mongoose = require('mongoose');
const {
    applyContestSubmissionResult,
    computeContestStatus,
    isProblemInContest,
    syncContestStatus
} = require('../services/contestService');

const activeSubmissionLocks = new Map();
const SUBMISSION_LOCK_TTL_MS = 30 * 1000;

const toFiniteNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const roundNumber = (value, decimals = 3) => {
    const factor = 10 ** decimals;
    return Math.round(toFiniteNumber(value, 0) * factor) / factor;
};

const getNonUserRoleIds = async () => {
    const privilegedUsers = await User.find({
        role: { $in: ['ADMIN', 'SUPER_ADMIN'] }
    })
        .select('_id')
        .lean();

    return privilegedUsers.map((entry) => entry._id);
};

exports.runCode = async (req, res) => {
    try {
        const { code, language, input, problemId } = req.body;

        let problemDetails = {};
        if (problemId) {
            const problem = await Problem.findById(problemId);
            if (problem) {
                problemDetails = {
                    className: problem.className,
                    functionName: problem.functionName,
                    parameters: problem.parameters,
                    returnType: problem.returnType,
                    validationType: problem.validationType,
                    validationKey: problem.validationKey,
                    tolerance: problem.tolerance
                };
            }
        }

        const result = await codeExecutor.executeCode(code, language, input, 2000, problemDetails);
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.runSampleTests = async (req, res) => {
    try {
        const { code, language, problemId } = req.body;

        const problem = await Problem.findById(problemId);
        if (!problem) throw new Error('Problem not found');

        const problemDetails = {
            className: problem.className,
            functionName: problem.functionName,
            parameters: problem.parameters,
            returnType: problem.returnType,
            validationType: problem.validationType,
            validationKey: problem.validationKey,
            tolerance: problem.tolerance
        };

        // Only run sample test cases
        const testCases = problem.sampleTestCases || [];

        if (testCases.length === 0) {
            return res.json({ success: true, testResults: [] });
        }

        const testResults = await codeExecutor.runTestCases(code, language, testCases, 2000, problemDetails);

        // Sanitize results
        // Sanitize results
        const sanitizedResults = testResults.map((r, i) => ({
            input: testCases[i].input,
            expectedOutput: testCases[i].output,
            actualOutput: r.actualOutput,
            passed: r.passed,
            error: r.error,
            printedOutput: r.printedOutput || '',
            returnMissing: !!r.returnMissing,
            isHidden: false,
            runtime: r.runtime,
            memory: r.memory
        }));

        // Calculate stats
        const passedResults = testResults.filter(r => r.passed);
        const runtimeValues = passedResults
            .map((result) => toFiniteNumber(result.runtime, 0))
            .filter((value) => value >= 0);
        const memoryValues = passedResults
            .map((result) => toFiniteNumber(result.memory, 0))
            .filter((value) => value >= 0);
        const avgTime = passedResults.length > 0
            ? runtimeValues.reduce((acc, curr) => acc + curr, 0) / Math.max(runtimeValues.length, 1)
            : 0;
        const maxMemory = passedResults.length > 0
            ? Math.max(...memoryValues, 0)
            : 0;

        res.json({
            success: true,
            testResults: sanitizedResults,
            stats: {
                averageTime: roundNumber(avgTime, 3),
                maxMemory: roundNumber(maxMemory, 3)
            },
            limits: {
                timeLimit: 2000,
                memoryLimit: 256
            }
        });
    } catch (error) {
        console.error("Run Sample Tests Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.submitSolution = async (req, res) => {
    let submissionLockKey = null;
    let acquiredSubmissionLock = false;
    let shouldRefreshGlobalRanks = false;
    try {
        const { problemId, code, language, contestId } = req.body;
        const userId = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(problemId)) {
            return res.status(400).json({ success: false, message: 'Invalid problemId' });
        }

        if (contestId && !mongoose.Types.ObjectId.isValid(contestId)) {
            return res.status(400).json({ success: false, message: 'Invalid contestId' });
        }

        // Role Check: Admins and Super Admins cannot submit
        if (['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Admins and Super Admins cannot submit solutions.' });
        }

        const problem = await Problem.findById(problemId).select('+hiddenTestCases');
        if (!problem) throw new Error('Problem not found');

        // Contest Validation
        let contest = null;

        if (contestId) {
            contest = await Contest.findById(contestId).select('startTime endTime status problems');
            if (!contest) return res.status(404).json({ success: false, message: 'Contest not found' });

            await syncContestStatus(contest);

            if (computeContestStatus(contest) !== 'running') {
                return res.status(400).json({ success: false, message: 'Contest is not running' });
            }

            const participant = await ContestParticipant.exists({ contestId, userId });
            if (!participant) {
                return res.status(403).json({ success: false, message: 'You are not registered for this contest' });
            }

            // Check if problem belongs to contest
            if (!isProblemInContest(contest, problemId)) {
                return res.status(400).json({ success: false, message: 'Problem not part of this contest' });
            }
        }

        // Run test cases
        const timeLimit = problem.timeLimit || 2000;
        const problemDetails = {
            className: problem.className,
            functionName: problem.functionName,
            parameters: problem.parameters,
            returnType: problem.returnType,
            validationType: problem.validationType,
            validationKey: problem.validationKey,
            tolerance: problem.tolerance
        };

        // Combine sample and hidden test cases
        const testCases = [...(problem.sampleTestCases || []), ...(problem.hiddenTestCases || [])];

        if (testCases.length === 0) {
            throw new Error('No test cases found for this problem');
        }

        submissionLockKey = `${userId}:${problemId}`;
        const lockExpiry = activeSubmissionLocks.get(submissionLockKey);
        if (lockExpiry && lockExpiry > Date.now()) {
            return res.status(429).json({
                success: false,
                message: 'A submission is already being processed for this problem. Please wait.'
            });
        }
        activeSubmissionLocks.set(submissionLockKey, Date.now() + SUBMISSION_LOCK_TTL_MS);
        acquiredSubmissionLock = true;

        // Run in strict serial order and stop at first failed case.
        const executionResults = await codeExecutor.runTestCasesSerial(
            code,
            language,
            testCases,
            timeLimit,
            problemDetails,
            { stopOnFailure: true }
        );
        console.log('[DEBUG] Execution Results:', executionResults ? executionResults.length : 'null');

        const passedResults = executionResults.filter(r => r.passed);
        const runtimeValues = passedResults
            .map((result) => toFiniteNumber(result.runtime, 0))
            .filter((value) => value >= 0);
        const memoryValues = passedResults
            .map((result) => toFiniteNumber(result.memory, 0))
            .filter((value) => value >= 0);
        const avgTime = passedResults.length > 0
            ? runtimeValues.reduce((acc, curr) => acc + curr, 0) / Math.max(runtimeValues.length, 1)
            : 0;
        const maxMemory = passedResults.length > 0
            ? Math.max(...memoryValues, 0)
            : 0;

        const expectedTestCaseCount = testCases.length;
        const evaluatedAllTestCases = executionResults.length === expectedTestCaseCount;
        const passed = evaluatedAllTestCases
            && expectedTestCaseCount > 0
            && executionResults.every(r => r.passed);
        let status = 'accepted';
        if (!passed) {
            const firstFail = executionResults.find(r => !r.passed);
            if (!evaluatedAllTestCases && !firstFail) {
                status = 'runtime_error';
            } else {
                const errStr = (firstFail?.error || '').toLowerCase();
                if (errStr.includes('time limit exceeded')) {
                    status = 'time_limit_exceeded';
                } else if (errStr.includes('compilation error')) {
                    status = 'compilation_error';
                } else if (errStr.includes('function returned none') || errStr.includes('runtime error') || errStr.includes('driver error') || errStr.includes('traceback') || errStr.includes('referenceerror') || errStr.includes('syntaxerror') || errStr.includes('typeerror') || errStr.includes('execution failed')) {
                    status = 'runtime_error';
                } else {
                    status = 'wrong_answer';
                }
            }
        }
        shouldRefreshGlobalRanks = status === 'accepted';

        // Save submission
        const submissionData = {
            user: userId,
            problem: problemId,
            code,
            language,
            status,
            testCasesPassed: executionResults.filter(r => r.passed).length,
            totalTestCases: expectedTestCaseCount,
            xpEarned: passed ? problem.xpReward : 0,
            runtime: roundNumber(avgTime, 3), // ms
            memory: roundNumber(maxMemory, 3) // MB
        };

        if (contestId) submissionData.contest = contestId;

        // Create Submission & Update Stats Transaction
        let createdSubmissionId = null;
        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                // 1. Create Submission
                const submission = await Submission.create([submissionData], { session });
                const currentSubmission = submission[0];
                createdSubmissionId = currentSubmission._id;

                // Check for previous submission (for unique attempted)
                const previousSubmission = await Submission.findOne({
                    user: userId,
                    problem: problemId,
                    _id: { $ne: currentSubmission._id }
                }).session(session);

                // Check for previous solve (for unique solved)
                const previousSolve = await Submission.findOne({
                    user: userId,
                    problem: problemId,
                    status: 'accepted',
                    _id: { $ne: currentSubmission._id }
                }).session(session);

                // 2. Problem Stats Update
                const problemUpdate = {
                    $inc: {
                        totalSubmissions: 1,
                        ...(status === 'accepted' ? { totalAcceptedSubmissions: 1 } : {}),
                        ...(!previousSubmission ? { totalUniqueAttemptedUsers: 1 } : {}),
                        ...(status === 'accepted' && !previousSolve ? { totalUniqueSolvedUsers: 1 } : {})
                    }
                };

                const updatedProblem = await Problem.findByIdAndUpdate(
                    problemId,
                    problemUpdate,
                    { new: true, session }
                );

                // Recalculate Problem Rates
                if (updatedProblem) {
                    const subRate = updatedProblem.totalSubmissions > 0
                        ? (updatedProblem.totalAcceptedSubmissions / updatedProblem.totalSubmissions) * 100
                        : 0;

                    const userRate = updatedProblem.totalUniqueAttemptedUsers > 0
                        ? (updatedProblem.totalUniqueSolvedUsers / updatedProblem.totalUniqueAttemptedUsers) * 100
                        : 0;

                    await Problem.findByIdAndUpdate(problemId, {
                        submissionAcceptanceRate: parseFloat(subRate.toFixed(2)),
                        userAcceptanceRate: parseFloat(userRate.toFixed(2))
                    }, { session });
                }

                // 3. User Stats Update
                const userUpdate = {
                    $inc: {
                        'stats.totalSubmissions': 1,
                        ...(status === 'accepted' ? {
                            'stats.acceptedSubmissions': 1,
                            ...(!previousSolve ? { 'stats.easySolved': problem.difficulty === 'Easy' ? 1 : 0 } : {}),
                            ...(!previousSolve ? { 'stats.mediumSolved': problem.difficulty === 'Medium' ? 1 : 0 } : {}),
                            ...(!previousSolve ? { 'stats.hardSolved': problem.difficulty === 'Hard' ? 1 : 0 } : {}),
                            ...(!previousSolve ? { totalSolvedEasy: problem.difficulty === 'Easy' ? 1 : 0 } : {}),
                            ...(!previousSolve ? { totalSolvedMedium: problem.difficulty === 'Medium' ? 1 : 0 } : {}),
                            ...(!previousSolve ? { totalSolvedHard: problem.difficulty === 'Hard' ? 1 : 0 } : {}),
                            ...(!previousSolve ? { 'stats.totalProblems': 1 } : {}), // Only increment if new solve
                            ...(!previousSolve ? { xp: problem.xpReward } : {}) // Only give XP for first solve? Or every time? Usually first.
                        } : {})
                    },
                    ...(status === 'accepted' ? { $addToSet: { solvedProblems: problemId } } : {})
                };

                await User.findByIdAndUpdate(userId, userUpdate, { session });

                // Reference Solution (Admin only)
                if (status === 'accepted' && ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
                    await Problem.findByIdAndUpdate(problemId, {
                        referenceSolution: { code, language }
                    }, { session });
                }

                // Contest Logic
                if (contestId) {
                    await applyContestSubmissionResult({
                        session,
                        contestId,
                        userId,
                        problemId,
                        submissionId: currentSubmission._id,
                        submissionStatus: status,
                        problemDifficulty: problem.difficulty,
                        submissionTime: currentSubmission.createdAt || new Date()
                    });
                }

                // Mastery Progress (Best effort inside transaction)
                if (passed) {
                    await require('../models/Progress').findOneAndUpdate(
                        { user: userId, topic: problem.topic },
                        { $inc: { solvedProblems: 1 } },
                        { upsert: true, session }
                    );
                }
            });

            session.endSession();

            // Real-time Leaderboard Update
            if (passed) {
                const io = req.app.get('io');
                if (io) {
                    const updatedUser = await User.findById(userId).select('username xp level stats finalScore globalRank problemAcceptanceRate totalSolvedHard');
                    io.emit('leaderboardUpdate', updatedUser);
                }
            }

        } catch (error) {
            session.endSession();
            throw error;
        }

        // Keep score fields synced to latest submission stats.
        try {
            await globalRankService.recalculateUserMetrics(userId);
            if (shouldRefreshGlobalRanks) {
                await globalRankService.recomputeGlobalRanks();
            }
        } catch (rankError) {
            console.error('Global rank refresh failed after submission:', rankError);
        }

        // Fetch the submission we just created (or easiest way to get the full document)
        const finalSubmission = createdSubmissionId
            ? await Submission.findById(createdSubmissionId)
            : await Submission.findOne({ user: userId, problem: problemId }).sort({ createdAt: -1 });

        // Trigger Analytics Update (Async)
        if (finalSubmission) {
            analyticsService.processSubmission(userId, finalSubmission._id).catch(err =>
                console.error('Background Analytics Failed:', err)
            );

            // Send notification
            const isAccepted = finalSubmission.status === 'accepted';
            notificationService.createNotification(req, userId, {
                type: 'submission',
                title: isAccepted ? 'Submission Accepted ✅' : 'Submission Failed ❌',
                message: `Your ${language} solution for "${problem.title}" was ${isAccepted ? 'accepted' : finalSubmission.status}.`,
                link: `/problem/${problem.slug || problemId}`,
                icon: isAccepted ? '✅' : '❌'
            }).catch(err => console.error('Notification creation failed:', err));
        }

        // Calculate percentiles against accepted submissions in same language (excluding this user).
        let runtimePercentile = 0;
        let memoryPercentile = 0;

        if (finalSubmission && finalSubmission.status === 'accepted') {
            const nonUserRoleIds = await getNonUserRoleIds();
            const excludedUserIds = [
                ...new Set([String(finalSubmission.user), ...nonUserRoleIds.map((id) => String(id))])
            ];

            const baseFilter = {
                problem: finalSubmission.problem,
                status: 'accepted',
                language: finalSubmission.language,
                user: { $nin: excludedUserIds }
            };

            const runtimeValue = toFiniteNumber(finalSubmission.runtime, 0);
            const memoryValue = toFiniteNumber(finalSubmission.memory, 0);

            const [runtimeTotal, memoryTotal] = await Promise.all([
                runtimeValue > 0
                    ? Submission.countDocuments({ ...baseFilter, runtime: { $gt: 0 } })
                    : Promise.resolve(0),
                memoryValue > 0
                    ? Submission.countDocuments({ ...baseFilter, memory: { $gt: 0 } })
                    : Promise.resolve(0)
            ]);

            if (runtimeTotal > 0) {
                const slowerSubmissions = await Submission.countDocuments({
                    ...baseFilter,
                    runtime: { $gt: runtimeValue }
                });
                runtimePercentile = (slowerSubmissions / runtimeTotal) * 100;
            } else if (runtimeValue > 0) {
                runtimePercentile = 100;
            }

            if (memoryTotal > 0) {
                const moreMemorySubmissions = await Submission.countDocuments({
                    ...baseFilter,
                    memory: { $gt: memoryValue }
                });
                memoryPercentile = (moreMemorySubmissions / memoryTotal) * 100;
            } else if (memoryValue > 0) {
                memoryPercentile = 100;
            }
        }

        const firstFailedIndex = executionResults.findIndex((r) => !r.passed);

        // Sanitize results for frontend
        const sanitizedResults = executionResults.map((r, i) => {
            const revealFailedCaseDetails = i === firstFailedIndex && firstFailedIndex >= 0;
            return {
                ...r,
                testCaseNumber: r.testCaseNumber || (i + 1),
                isHidden: testCases[i].isHidden,
                input: (testCases[i].isHidden && !revealFailedCaseDetails) ? 'Hidden' : r.input,
                expectedOutput: (testCases[i].isHidden && !revealFailedCaseDetails) ? 'Hidden' : r.expectedOutput,
                actualOutput: (testCases[i].isHidden && !revealFailedCaseDetails) ? 'Hidden' : r.actualOutput,
                printedOutput: (testCases[i].isHidden && !revealFailedCaseDetails) ? 'Hidden' : (r.printedOutput || ''),
                error: (testCases[i].isHidden && !revealFailedCaseDetails && !r.passed) ? 'Test Case Failed' : r.error
            };
        });

        const firstFailedTestCase = firstFailedIndex >= 0
            ? {
                testCaseNumber: sanitizedResults[firstFailedIndex]?.testCaseNumber || (firstFailedIndex + 1),
                isHidden: testCases[firstFailedIndex].isHidden,
                input: sanitizedResults[firstFailedIndex]?.input,
                expectedOutput: sanitizedResults[firstFailedIndex]?.expectedOutput,
                actualOutput: sanitizedResults[firstFailedIndex]?.actualOutput,
                error: sanitizedResults[firstFailedIndex]?.error,
                printedOutput: sanitizedResults[firstFailedIndex]?.printedOutput || ''
            }
            : null;
        const accepted = finalSubmission.status === 'accepted';
        const validationSummary = {
            status: accepted ? 'Accepted' : 'Wrong Answer',
            message: accepted
                ? 'All test cases passed.'
                : 'Output did not satisfy validator for at least one test case.',
            passedTestCases: Number(finalSubmission.testCasesPassed || 0)
        };

        res.json({
            success: true,
            validationSummary,
            submission: finalSubmission,
            testResults: sanitizedResults,
            firstFailedTestCase,
            stats: {
                averageTime: roundNumber(avgTime, 3),
                maxMemory: roundNumber(maxMemory, 3),
                runtimePercentile: roundNumber(runtimePercentile, 2),
                memoryPercentile: roundNumber(memoryPercentile, 2)
            },
            limits: {
                timeLimit: problem.timeLimit || 2000,
                memoryLimit: problem.memoryLimit || 256
            }
        });

    } catch (error) {
        console.error('[DEBUG] Submission Error:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (acquiredSubmissionLock && submissionLockKey) {
            activeSubmissionLocks.delete(submissionLockKey);
        }
    }
};

exports.getMySubmissions = async (req, res) => {
    try {
        const { problemId } = req.query;
        const query = { user: req.user.id };
        if (problemId) query.problem = problemId;

        const submissions = await Submission.find(query)
            .populate('problem', 'title difficulty')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: submissions.length, submissions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getLastSubmission = async (req, res) => {
    try {
        const { problemId } = req.params;
        const { language } = req.query;

        const query = { user: req.user.id, problem: problemId };
        if (language) query.language = language;

        const submission = await Submission.findOne(query).sort({ createdAt: -1 });

        if (!submission) {
            return res.json({ success: false, message: 'No submission found' });
        }

        res.json({ success: true, submission });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Admin: Get All Submissions (Monitoring)
exports.getAllSubmissions = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, language, username, problemTitle } = req.query;
        const query = {};
        const nonUserRoleIds = await getNonUserRoleIds();
        const nonUserIdSet = new Set(nonUserRoleIds.map((id) => String(id)));

        if (status) query.status = status;
        if (language) query.language = language;

        if (username) {
            const user = await User.findOne({ username });
            if (user && !nonUserIdSet.has(String(user._id))) query.user = user._id;
            else return res.json({ success: true, submissions: [], total: 0 }); // User not found, empty result
        }

        if (problemTitle) {
            const problem = await Problem.findOne({ title: { $regex: problemTitle, $options: 'i' } });
            if (problem) query.problem = problem._id;
            else return res.json({ success: true, submissions: [], total: 0 });
        }

        // Admin Filter: My Problems
        if (req.query.scope === 'my_problems') {
            // Find problems created by this admin
            const myProblems = await Problem.find({ createdBy: req.user._id }).select('_id');
            const myProblemIds = myProblems.map(p => p._id);

            if (myProblemIds.length > 0) {
                // If we already have a problem filter (e.g. from title search), intersect it
                if (query.problem) {
                    // check if the searched problem is one of mine
                    if (!myProblemIds.some(id => id.equals(query.problem))) {
                        return res.json({ success: true, submissions: [], total: 0 });
                    }
                    // query.problem is already set, so we are good
                } else {
                    query.problem = { $in: myProblemIds };
                }
            } else {
                return res.json({ success: true, submissions: [], total: 0 });
            }
        }

        // Submission monitor should include only regular user submissions.
        if (!query.user) {
            query.user = { $nin: nonUserRoleIds };
        }

        const submissions = await Submission.find(query)
            .populate('user', 'username email')
            .populate('problem', 'title difficulty')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Submission.countDocuments(query);

        res.json({
            success: true,
            submissions,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalSubmissions: total
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getSubmissionPerformance = async (req, res) => {
    try {
        const { submissionId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(submissionId)) {
            return res.status(400).json({ success: false, message: 'Invalid submission id.' });
        }

        const submission = await Submission.findById(submissionId)
            .populate('problem', 'title slug difficulty')
            .select('user problem language status runtime memory testCasesPassed totalTestCases createdAt');

        if (!submission) {
            return res.status(404).json({ success: false, message: 'Submission not found.' });
        }

        const isOwner = submission.user.toString() === req.user.id;
        const isPrivileged = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
        if (!isOwner && !isPrivileged) {
            return res.status(403).json({ success: false, message: 'Not allowed to view this submission.' });
        }

        if (submission.status !== 'accepted') {
            return res.status(400).json({
                success: false,
                message: 'Performance graph is available only for accepted submissions.'
            });
        }

        const runtimeValue = toFiniteNumber(submission.runtime, 0);
        const memoryValue = toFiniteNumber(submission.memory, 0);
        const testCasesPassed = Math.max(0, Math.trunc(toFiniteNumber(submission.testCasesPassed, 0)));
        const totalTestCases = Math.max(0, Math.trunc(toFiniteNumber(submission.totalTestCases, 0)));
        const nonUserRoleIds = await getNonUserRoleIds();
        const excludedUserIds = [
            ...new Set([String(submission.user), ...nonUserRoleIds.map((id) => String(id))])
        ];

        const baseFilterLanguage = {
            problem: submission.problem._id,
            status: 'accepted',
            language: submission.language,
            user: { $nin: excludedUserIds }
        };

        let comparisonBaseFilter = { ...baseFilterLanguage };
        let languageScoped = true;

        const languageCohortSize = await Submission.countDocuments({
            ...baseFilterLanguage,
            $or: [{ runtime: { $gt: 0 } }, { memory: { $gt: 0 } }]
        });

        if (languageCohortSize < 3) {
            languageScoped = false;
            comparisonBaseFilter = {
                problem: submission.problem._id,
                status: 'accepted',
                user: { $ne: submission.user }
            };
        }

        const [runtimeTotal, memoryTotal] = await Promise.all([
            runtimeValue > 0
                ? Submission.countDocuments({ ...comparisonBaseFilter, runtime: { $gt: 0 } })
                : Promise.resolve(0),
            memoryValue > 0
                ? Submission.countDocuments({ ...comparisonBaseFilter, memory: { $gt: 0 } })
                : Promise.resolve(0)
        ]);

        const [runtimeAboveCount, runtimeBelowCount, memoryAboveCount, memoryBelowCount] = await Promise.all([
            runtimeValue > 0
                ? Submission.countDocuments({
                    ...comparisonBaseFilter,
                    runtime: { $gt: 0, $lt: runtimeValue }
                })
                : Promise.resolve(0),
            runtimeValue > 0
                ? Submission.countDocuments({
                    ...comparisonBaseFilter,
                    runtime: { $gt: runtimeValue }
                })
                : Promise.resolve(0),
            memoryValue > 0
                ? Submission.countDocuments({
                    ...comparisonBaseFilter,
                    memory: { $gt: 0, $lt: memoryValue }
                })
                : Promise.resolve(0),
            memoryValue > 0
                ? Submission.countDocuments({
                    ...comparisonBaseFilter,
                    memory: { $gt: memoryValue }
                })
                : Promise.resolve(0)
        ]);

        const runtimePercentile = runtimeTotal > 0
            ? (runtimeBelowCount / runtimeTotal) * 100
            : (runtimeValue > 0 ? 100 : 0);
        const memoryPercentile = memoryTotal > 0
            ? (memoryBelowCount / memoryTotal) * 100
            : (memoryValue > 0 ? 100 : 0);

        const mapNeighborRow = (row) => ({
            submissionId: row._id,
            user: {
                id: row.user?._id || null,
                username: row.user?.username || 'Unknown'
            },
            language: row.language,
            runtime: toFiniteNumber(row.runtime, 0),
            memory: toFiniteNumber(row.memory, 0),
            createdAt: row.createdAt
        });

        const [runtimeAboveRows, runtimeBelowRows, memoryAboveRows, memoryBelowRows, runtimeStatsAgg, memoryStatsAgg] = await Promise.all([
            runtimeValue > 0
                ? Submission.find({
                    ...comparisonBaseFilter,
                    runtime: { $gt: 0, $lt: runtimeValue }
                })
                    .select('user language runtime memory createdAt')
                    .populate('user', 'username')
                    .sort({ runtime: -1, createdAt: -1 })
                    .limit(8)
                : Promise.resolve([]),
            runtimeValue > 0
                ? Submission.find({
                    ...comparisonBaseFilter,
                    runtime: { $gt: runtimeValue }
                })
                    .select('user language runtime memory createdAt')
                    .populate('user', 'username')
                    .sort({ runtime: 1, createdAt: -1 })
                    .limit(8)
                : Promise.resolve([]),
            memoryValue > 0
                ? Submission.find({
                    ...comparisonBaseFilter,
                    memory: { $gt: 0, $lt: memoryValue }
                })
                    .select('user language runtime memory createdAt')
                    .populate('user', 'username')
                    .sort({ memory: -1, createdAt: -1 })
                    .limit(8)
                : Promise.resolve([]),
            memoryValue > 0
                ? Submission.find({
                    ...comparisonBaseFilter,
                    memory: { $gt: memoryValue }
                })
                    .select('user language runtime memory createdAt')
                    .populate('user', 'username')
                    .sort({ memory: 1, createdAt: -1 })
                    .limit(8)
                : Promise.resolve([]),
            Submission.aggregate([
                { $match: { ...comparisonBaseFilter, runtime: { $gt: 0 } } },
                {
                    $group: {
                        _id: null,
                        average: { $avg: '$runtime' },
                        min: { $min: '$runtime' },
                        max: { $max: '$runtime' }
                    }
                }
            ]),
            Submission.aggregate([
                { $match: { ...comparisonBaseFilter, memory: { $gt: 0 } } },
                {
                    $group: {
                        _id: null,
                        average: { $avg: '$memory' },
                        min: { $min: '$memory' },
                        max: { $max: '$memory' }
                    }
                }
            ])
        ]);

        const runtimeStats = runtimeStatsAgg[0] || {};
        const memoryStats = memoryStatsAgg[0] || {};

        res.json({
            success: true,
            submission: {
                _id: submission._id,
                language: submission.language,
                status: submission.status,
                runtime: roundNumber(runtimeValue, 3),
                memory: roundNumber(memoryValue, 3),
                testCasesPassed,
                totalTestCases,
                createdAt: submission.createdAt
            },
            problem: submission.problem,
            cohort: {
                languageScoped,
                language: languageScoped ? submission.language : null,
                runtimeComparisons: runtimeTotal,
                memoryComparisons: memoryTotal
            },
            beats: {
                runtimePercentile: roundNumber(runtimePercentile, 2),
                memoryPercentile: roundNumber(memoryPercentile, 2),
                runtimeAboveCount,
                runtimeBelowCount,
                memoryAboveCount,
                memoryBelowCount
            },
            stats: {
                runtime: {
                    average: roundNumber(runtimeStats.average || 0, 3),
                    min: roundNumber(runtimeStats.min || 0, 3),
                    max: roundNumber(runtimeStats.max || 0, 3)
                },
                memory: {
                    average: roundNumber(memoryStats.average || 0, 3),
                    min: roundNumber(memoryStats.min || 0, 3),
                    max: roundNumber(memoryStats.max || 0, 3)
                }
            },
            neighbors: {
                runtime: {
                    above: runtimeAboveRows.map(mapNeighborRow),
                    below: runtimeBelowRows.map(mapNeighborRow)
                },
                memory: {
                    above: memoryAboveRows.map(mapNeighborRow),
                    below: memoryBelowRows.map(mapNeighborRow)
                }
            }
        });
    } catch (error) {
        console.error('Submission performance error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
