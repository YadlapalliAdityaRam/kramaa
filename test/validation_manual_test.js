const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ValidationWorker = require('../backend/services/validationWorker');
const Problem = require('../backend/models/Problem');
const Solution = require('../backend/models/Solution');
const TestcaseGenerator = require('../backend/models/TestcaseGenerator');
const ValidationJob = require('../backend/models/ValidationJob');
const User = require('../backend/models/User');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

async function runTest() {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        // 1. Create Dummy User
        const user = await User.findOne({ role: 'ADMIN' });
        if (!user) {
            console.log('No Admin user found, skipping auth check mockup');
        }

        // 2. Create Problem
        const problem = await Problem.create({
            title: 'Validation Test Problem ' + Date.now(),
            description: 'Test Description',
            difficulty: 'Easy', // Add required difficulty
            functionName: 'add',
            inputs: [{ name: 'a', type: 'int' }, { name: 'b', type: 'int' }], // Mock structure
            createdBy: user ? user._id : new mongoose.Types.ObjectId(),
            timeLimit: 1000,
            memoryLimit: 256
        });
        console.log('Problem Created:', problem._id);

        // 3. Create Reference Solution (Python - simple add)
        await Solution.create({
            problemId: problem._id,
            solutionType: 'REFERENCE',
            language: 'python',
            sourceCode: `
import sys

# Read input (simple: "A B")
def solve():
    try:
        # Assuming input is just one line with two numbers for this test
        line = sys.stdin.read().strip()
        if not line: return
        parts = line.split()
        if len(parts) >= 2:
            a = int(parts[0])
            b = int(parts[1])
            print(a + b)
    except Exception as e:
        pass

if __name__ == '__main__':
    solve()
`
        });
        console.log('Reference Solution Created');

        // 4. Create Generator (Python - generates "A B")
        await TestcaseGenerator.create({
            problemId: problem._id,
            language: 'python',
            generatorCode: `
import random
print(f"{random.randint(1, 100)} {random.randint(1, 100)}")
`
        });
        console.log('Generator Created');

        // 5. Create Job
        const job = await ValidationJob.create({
            problemId: problem._id,
            status: 'QUEUED'
        });
        console.log('Job Created:', job._id);

        // 6. Run Worker
        console.log('Running Validation Worker...');
        await ValidationWorker.validateProblem(job._id);

        // 7. Check Result
        const updatedJob = await ValidationJob.findById(job._id);
        console.log('Job Status:', updatedJob.status);
        console.log('Job Result:', updatedJob.result);
        console.log('Logs:', updatedJob.logs);

        const updatedProblem = await Problem.findById(problem._id);
        console.log('Problem Validation Status:', updatedProblem.validationStatus);

        // Cleanup
        await Problem.deleteOne({ _id: problem._id });
        await Solution.deleteMany({ problemId: problem._id });
        await TestcaseGenerator.deleteMany({ problemId: problem._id });
        await ValidationJob.deleteMany({ problemId: problem._id });
        console.log('Cleanup Done.');

        process.exit(0);
    } catch (err) {
        console.error('Test Failed:', err);
        process.exit(1);
    }
}

runTest();
