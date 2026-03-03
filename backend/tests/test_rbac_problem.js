require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Problem = require('../models/Problem');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/algoverse';

async function runTest() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        // Cleanup previous test data
        await User.deleteMany({ email: /@test.com$/ });
        await Problem.deleteMany({ title: 'Test Problem RBAC' });

        console.log('Creating users...');
        const superAdmin = await User.create({
            username: 'superadmin_test',
            email: 'super@test.com',
            password: 'password123',
            role: 'SUPER_ADMIN',
            isVerified: true
        });

        const admin = await User.create({
            username: 'admin_test',
            email: 'admin@test.com',
            password: 'password123',
            role: 'ADMIN',
            isVerified: true
        });

        const user = await User.create({
            username: 'user_test',
            email: 'user@test.com',
            password: 'password123',
            role: 'USER',
            isVerified: true
        });

        console.log('Users created.');

        console.log('Creating a problem as Admin...');
        const problem = await Problem.create({
            title: 'Test Problem RBAC',
            slug: 'test-problem-rbac',
            description: 'Description',
            difficulty: 'Easy',
            topic: 'Array',
            functionName: 'solve',
            returnType: 'int',
            parameters: [{ name: 'n', type: 'int' }],
            createdBy: admin._id,
            isPublished: true,
            sampleTestCases: [{ input: { n: 1 }, output: 1, isHidden: false }],
            hiddenTestCases: [{ input: { n: 2 }, output: 2, isHidden: true }],
            referenceSolution: { code: 'solution', language: 'python' }
        });
        console.log('Problem created.');

        // Test 1: User fetching problem
        console.log('\n--- Test 1: User fetching problem ---');
        // Simulate controller logic for User
        let userQuery = Problem.findById(problem._id).select('-hiddenTestCases -referenceSolution');
        const userProblem = await userQuery;

        if (!userProblem.hiddenTestCases && !userProblem.referenceSolution) {
            console.log('PASS: User cannot see hidden fields.');
        } else {
            console.error('FAIL: User CAN see hidden fields!', userProblem);
        }

        if (userProblem.sampleTestCases && userProblem.sampleTestCases.length > 0) {
            console.log('PASS: User can see sample test cases.');
        } else {
            console.error('FAIL: User CANNOT see sample test cases!');
        }


        // Test 2: Admin fetching problem
        console.log('\n--- Test 2: Admin fetching problem ---');
        // Simulate controller logic for Admin
        let adminQuery = Problem.findById(problem._id).select('+hiddenTestCases +referenceSolution');
        const adminProblem = await adminQuery;

        if (adminProblem.hiddenTestCases && adminProblem.hiddenTestCases.length > 0) {
            console.log('PASS: Admin can see hidden test cases.');
        } else {
            console.error('FAIL: Admin CANNOT see hidden test cases!');
        }

        if (adminProblem.referenceSolution && adminProblem.referenceSolution.code) {
            console.log('PASS: Admin can see reference solution.');
        } else {
            console.error('FAIL: Admin CANNOT see reference solution!');
        }

        console.log('\nCleaning up...');
        await User.deleteMany({ email: /@test.com$/ });
        await Problem.deleteMany({ title: 'Test Problem RBAC' });
        console.log('Cleanup done.');

    } catch (error) {
        console.error('Test Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

runTest();
