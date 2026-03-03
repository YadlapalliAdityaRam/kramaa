const mongoose = require('mongoose');
const Problem = require('../models/Problem');
const Solution = require('../models/Solution');
const TestcaseGenerator = require('../models/TestcaseGenerator');
const ValidationJob = require('../models/ValidationJob');
const codeExecutor = require('./codeExecutor');
const { PROBLEM_STATUS, buildPublicationFields } = require('../utils/problemPublication');

class ValidationWorker {
    async validateProblem(jobId) {
        let job;
        try {
            job = await ValidationJob.findById(jobId);
            if (!job) return;

            job.status = 'RUNNING';
            job.startedAt = new Date();
            job.logs.push('Validation started...');
            await job.save();

            const problem = await Problem.findById(job.problemId);
            const solutions = await Solution.find({ problemId: job.problemId });
            const generator = await TestcaseGenerator.findOne({ problemId: job.problemId });

            if (!generator) throw new Error('No Testcase Generator found.');

            const refSolution = solutions.find(s => s.solutionType === 'REFERENCE');
            if (!refSolution) throw new Error('No Reference Solution found.');

            const bruteSolutions = solutions.filter(s => s.solutionType === 'BRUTE_FORCE');
            const wrongSolutions = solutions.filter(s => s.solutionType === 'WRONG');

            // STEP 1: Generate Testcases
            job.logs.push('Generating testcases using generator...');
            await job.save();

            const generatedTestCases = [];
            const NUM_TESTCASES = 15; // Generate 15 random cases

            for (let i = 0; i < NUM_TESTCASES; i++) {
                const seed = Math.floor(Math.random() * 1000000).toString();
                // Run generator with seed as input
                const genResult = await codeExecutor.executeCode(
                    generator.generatorCode,
                    generator.language,
                    seed, // Pass seed as stdin
                    5000, // 5s timeout for generator
                    { mode: 'script' }
                );

                if (genResult.status !== 'accepted') {
                    throw new Error(`Generator failed on seed ${seed}: ${genResult.stderr}`);
                }

                const input = genResult.stdout.trim();
                if (!input) continue; // Skip empty
                generatedTestCases.push({ input, seed });
            }

            job.logs.push(`Generated ${generatedTestCases.length} testcases.`);

            // STEP 2: Run Reference Solution (Ground Truth)
            job.logs.push('Running Reference Solution...');
            await job.save();

            const validatedTestCases = [];

            // Determine execution mode (Driver vs Script) by probing first case
            let executionMode = 'driver';
            if (generatedTestCases.length > 0) {
                const probeCase = generatedTestCases[0];
                const probeRes = await codeExecutor.executeCode(
                    refSolution.sourceCode,
                    refSolution.language,
                    probeCase.input,
                    problem.timeLimit,
                    { functionName: problem.functionName }
                );

                // If driver failed with function-not-found error, try script mode
                if (probeRes.status !== 'accepted' &&
                    (probeRes.stderr.includes('not found in solution') ||
                        probeRes.stderr.includes('NoSuchMethodError') ||
                        probeRes.stderr.includes('function not found'))) { // Add checks for other langs if needed

                    job.logs.push('Driver mode failed (function not found). Attempting Script detection...');

                    const scriptProbe = await codeExecutor.executeCode(
                        refSolution.sourceCode,
                        refSolution.language,
                        probeCase.input,
                        problem.timeLimit,
                        { mode: 'script' }
                    );

                    if (scriptProbe.status === 'accepted') {
                        executionMode = 'script';
                        job.logs.push(`Detected Script mode. Switching execution to Script mode for ${refSolution.language}.`);
                    } else {
                        job.logs.push(`Script mode probe also failed: ${scriptProbe.stderr || scriptProbe.status}`);
                    }
                }
            }

            for (const tc of generatedTestCases) {
                const res = await codeExecutor.executeCode(
                    refSolution.sourceCode,
                    refSolution.language,
                    tc.input,
                    problem.timeLimit,
                    {
                        functionName: problem.functionName,
                        mode: executionMode
                    }
                );

                if (res.status !== 'accepted') {
                    throw new Error(`Reference Solution failed/TLE on generated input (Seed: ${tc.seed}). Error: ${res.stderr || res.status}`);
                }

                validatedTestCases.push({
                    input: tc.input,
                    output: res.stdout.trim() // Ground truth
                });
            }
            job.logs.push('Reference Solution passed all cases.');

            // STEP 3: Verify Brute Force (Should Pass but TLE on max cases?)
            if (bruteSolutions.length > 0) {
                job.logs.push(`Verifying ${bruteSolutions.length} Brute Force solutions...`);
                for (const sol of bruteSolutions) {
                    const results = await codeExecutor.runTestCases(
                        sol.sourceCode,
                        sol.language,
                        validatedTestCases, // Use generated cases
                        problem.timeLimit * 2, // Allow 2x time to detect TLE vs correct logic
                        { functionName: problem.functionName }
                    );

                    const failed = results.filter(r => !r.passed);

                    // Logic: Brute Force SHOULD ideally TLE on at least one case if constraints are strong enough
                    // If it passes ALL cases efficiently, then tests are weak.
                    // However, for "Easy" problems, BF might pass.
                    // We will only FAIL if it passes ALL cases AND max time is very low (< 50% of original timeLimit)

                    const passedAll = results.every(r => r.passed);
                    if (passedAll) {
                        const maxTime = Math.max(...results.map(r => parseFloat(r.runtime)));
                        // If max time is less than 50% of the ACTUAL problem time limit
                        if (maxTime < (problem.timeLimit / 1000) * 0.5) {
                            // Weak Testcases!
                            throw new Error(`Brute Force solution passed all testcases too easily (Max time: ${maxTime}s vs Limit: ${problem.timeLimit / 1000}s). Strengthen testcases or lower time limit.`);
                        } else {
                            job.logs.push(`Warning: Brute Force passed all cases, but close to time limit (${maxTime}s).`);
                        }
                    }

                    // Check for Wrong Answer (BF should be correct logic, just slow)
                    const wrongAnswers = results.filter(r => !r.passed && r.error !== 'Time Limit Exceeded');
                    if (wrongAnswers.length > 0) {
                        throw new Error(`Brute Force solution returned Wrong Answer on generated cases.`);
                    }

                    job.logs.push('Brute Force validation check passed.');
                }
            }

            // STEP 4: Verify Wrong Solutions (Should Fail)
            if (wrongSolutions.length > 0) {
                job.logs.push(`Verifying ${wrongSolutions.length} Wrong solutions...`);
                for (const sol of wrongSolutions) {
                    const results = await codeExecutor.runTestCases(
                        sol.sourceCode,
                        sol.language,
                        validatedTestCases,
                        problem.timeLimit,
                        { functionName: problem.functionName }
                    );

                    const allPassed = results.every(r => r.passed);
                    if (allPassed) {
                        // If Wrong solution passes ALL cases, then testcases are weak!
                        throw new Error(`Wrong Solution (${sol.language}) PASSED all testcases! Testcases are too weak.`);
                    }
                }
                job.logs.push('Wrong solutions failed as expected.');
            }

            // STEP 5: Determinism Check (Run ref twice on random subset)
            job.logs.push('Running Determinism Check...');
            const determinismSample = validatedTestCases.slice(0, 3); // Check first 3
            for (const tc of determinismSample) {
                const res1 = await codeExecutor.executeCode(refSolution.sourceCode, refSolution.language, tc.input, problem.timeLimit, { functionName: problem.functionName });
                const res2 = await codeExecutor.executeCode(refSolution.sourceCode, refSolution.language, tc.input, problem.timeLimit, { functionName: problem.functionName });

                if (res1.stdout.trim() !== res2.stdout.trim()) {
                    throw new Error(`Reference Solution is non-deterministic! Output changed for same input.`);
                }
            }
            job.logs.push('Determinism check passed.');

            // Success!
            job.status = 'COMPLETED';
            job.result = 'PASSED';
            job.finishedAt = new Date();
            job.logs.push('Validation Successful.');
            await job.save();

            // Update Problem
            problem.validationStatus = 'PASSED';
            problem.lastValidationReport = {
                jobId: job._id,
                date: new Date(),
                testCasesGenerated: validatedTestCases.length,
                logs: job.logs
            };
            Object.assign(problem, buildPublicationFields(PROBLEM_STATUS.APPROVED, problem.publishedAt));
            await problem.save();

        } catch (error) {
            console.error('Validation Worker Error:', error);
            if (job) {
                job.status = 'COMPLETED';
                job.result = 'FAILED';
                job.failureReason = error.message;
                job.logs.push(`Validation FAILED: ${error.message}`);
                job.finishedAt = new Date();
                await job.save();

                // Update Problem
                try {
                    const problem = await Problem.findById(job.problemId);
                    if (problem) {
                        problem.validationStatus = 'FAILED';
                        problem.lastValidationReport = {
                            jobId: job._id,
                            error: error.message,
                            logs: job.logs
                        };
                        await problem.save();
                    }
                } catch (e) { }
            }
        }
    }
}

module.exports = new ValidationWorker();
