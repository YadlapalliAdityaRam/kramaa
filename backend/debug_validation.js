const mongoose = require('mongoose');
const Problem = require('./models/Problem');
const ValidationJob = require('./models/ValidationJob');
require('dotenv').config();

const run = async () => {
    await mongoose.connect(process.env.MONGODB_URI);

    // Find most recently updated problem
    const problem = await Problem.findOne().sort({ updatedAt: -1 });
    console.log('--- Problem Details ---');
    console.log(`Title: ${problem.title}`);
    console.log(`Function Name: ${problem.functionName}`);
    console.log(`Validation Status: ${problem.validationStatus}`);

    if (problem.lastValidationReport && problem.lastValidationReport.jobId) {
        const job = await ValidationJob.findById(problem.lastValidationReport.jobId);
        if (job) {
            console.log('\n--- Validation Job Logs ---');
            console.log(job.logs.join('\n'));
        }
    }

    await mongoose.disconnect();
};

run().catch(console.error);
