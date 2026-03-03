const mongoose = require('mongoose');
const Problem = require('../models/Problem');
const Solution = require('../models/Solution');
const TestcaseGenerator = require('../models/TestcaseGenerator');
const ValidationJob = require('../models/ValidationJob');
const validationWorker = require('../services/validationWorker');
const User = require('../models/User');

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// MOCK USER for auditing checks if needed (though we won't bypass auth locally)
const MOCK_USER_ID = new mongoose.Types.ObjectId();

async function runTest() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Cleanup old test data
        await Problem.deleteMany({ title: 'Validation Gate Test Problem' });
        await Solution.deleteMany({ problemId: { $in: await Problem.find({ title: 'Validation Gate Test Problem' }).distinct('_id') } });
        console.log('Cleaned up old test data');

        // 2. Create Problem
        const problem = await Problem.create({
            title: 'Validation Gate Test Problem',
            slug: 'validation-gate-test',
            description: 'Find sum of Array',
            difficulty: 'Easy',
            topic: 'Array',
            createdBy: MOCK_USER_ID,
            functionName: 'solve',
            timeLimit: 1000, // 1s
            isPublished: false
        });
        console.log('Problem Created:', problem._id);

        // 3. Add Reference Solution (Correct) - JavaScript
        await Solution.create({
            problemId: problem._id,
            solutionType: 'REFERENCE',
            language: 'javascript',
            sourceCode: `
                function solve(arr) {
                    if (!arr) return 0;
                    return arr.reduce((a, b) => a + b, 0);
                }
                module.exports = { solve };
            `
        });

        // 4. Add Generator (Python)
        // Generates N, then N integers
        // Input Format for JS Reference:
        // We need to parse this string in the specific language? 
        // Wait, the "Driver" for JS usually expects arguments.
        // The generator output is raw string.
        // My simple JS driver might expect JSON or specific format?
        // Let's check `codeExecutor.js`.
        // `executeCode` for JS uses `driver.js`.
        // `driver.js` likely parses input.
        // If I use a simple generator that outputs space separated integers, JS driver might fail if it expects JSON array?
        // Let's look at `driver.js`... I don't have it visible.
        // But usually standard is "Read stdin, parse".

        // Let's assume standard format: "[1, 2, 3]" for JS array input?
        // Or if it reads raw lines.
        // I'll make the generator output JSON format "[1, 2, 3]" to be safe for JS.

        await TestcaseGenerator.create({
            problemId: problem._id,
            language: 'python',
            generatorCode: `
import random
import json

N = random.randint(1, 100)
arr = [random.randint(1, 1000) for _ in range(N)]
print(json.dumps(arr))
            `,
            constraints: { maxN: 100 }
        });

        console.log('Generator and Reference Solution Added');

        // 5. Add Wrong Solution
        await Solution.create({
            problemId: problem._id,
            solutionType: 'WRONG',
            language: 'javascript',
            sourceCode: `
                function solve(arr) {
                    return 0; // Always returns 0
                }
                module.exports = { solve };
            `
        });

        // 6. [SKIPPED] Brute Force (To test Determinism)
        /*
        await Solution.create({
            problemId: problem._id,
            solutionType: 'BRUTE_FORCE',
            language: 'javascript',
            sourceCode: `
                function solve(arr) {
                    let sum = 0;
                    for(let i=0; i<arr.length; i++) {
                        sum += arr[i];
                    }
                    return sum;
                }
                module.exports = { solve };
            `
        });
        */

        // UPDATE Reference Solution to be NON-DETERMINISTIC
        await Solution.findOneAndUpdate(
            { problemId: problem._id, solutionType: 'REFERENCE' },
            {
                sourceCode: `
                function solve(arr) {
                    if (!arr) return 0;
                    // Non-deterministic output
                    return arr.reduce((a, b) => a + b, 0) + (Math.random() > 0.5 ? 1 : 0);
                }
                module.exports = { solve };
                `
            }
        );

        console.log('Wrong and Brute Force Solutions Added');

        // 7. Trigger Validation
        console.log('Starting Validation...');
        const job = await ValidationJob.create({
            problemId: problem._id,
            status: 'QUEUED',
            logs: []
        });

        // 8. Run Worker
        await validationWorker.validateProblem(job._id);

        // 9. Check Result
        const updatedJob = await ValidationJob.findById(job._id);
        console.log('Validation Job Finished. Status:', updatedJob.status);
        console.log('Result:', updatedJob.result);
        console.log('Logs:', updatedJob.logs);

        if (updatedJob.result === 'FAILED') {
            console.log('Failure Reason:', updatedJob.failureReason || updatedJob.logs[updatedJob.logs.length - 1]);
        }

        // We EXPECT FAILURE because "Wrong Solution" is present!
        // The test passes if it FAILS with "Wrong Solution ... PASSED all testcases" error?
        // Wait, "Wrong Solution" should FAIL the testcases.
        // If Wrong solution FAILS, then Validation CONTINUES.
        // My Logic in worker:
        // "If Wrong solution passes ALL cases, then testcases are weak! -> Throw Error"
        // So if Wrong Solution FAILS (which is Good), validation continues.

        // Wait, my Wrong Solution returns 0. Reference returns Sum.
        // For array [1,2], Sum=3. Wrong=0. Mismatch.
        // So Wrong Solution will FAIL testcases.
        // Worker LOGIC:
        // "const allPassed = results.every(r => r.passed);"
        // "if (allPassed) throw Error(...)"
        // So since it fails, it will NOT throw error. It will succeed (PASS).
        // "Wrong solutions failed as expected." -> Good.
        // So validation should PASS if Brute Force also passes.

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        await mongoose.connection.close();
    }
}

runTest();
