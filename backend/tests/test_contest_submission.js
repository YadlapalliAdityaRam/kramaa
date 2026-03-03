require('dotenv').config();
const mongoose = require('mongoose');
const Contest = require('../models/Contest');
const Submission = require('../models/Submission');
const User = require('../models/User');
const Problem = require('../models/Problem');
const contestController = require('../controllers/contestController');
const submissionController = require('../controllers/submissionController');

// Mock Req/Res
const mockReq = (body = {}, params = {}, user = {}, query = {}) => ({
    body, params, user, query, ip: '127.0.0.1', app: { get: () => null }
});

const mockRes = () => {
    const res = {};
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.data = data; return res; };
    return res;
};

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/algoverse';

async function runTest() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('DB Connected');

        // Cleanup
        await Contest.deleteMany({ title: 'Test Contest' });

        // Setup Users
        const admin = await User.findOne({ role: 'SUPER_ADMIN' }) || await User.create({ username: 'admin_test', email: 'admin_test@test.com', password: 'password123', role: 'SUPER_ADMIN' });
        const user = await User.findOne({ username: 'user_test' }) || await User.create({ username: 'user_test', email: 'user_test@test.com', password: 'password123', role: 'USER' });

        console.log('\n--- Test 1: Create Contest ---');
        const createReq = mockReq({
            title: 'Test Contest',
            description: 'A test contest',
            startTime: new Date(Date.now() + 1000 * 60), // Starts in 1 min
            endTime: new Date(Date.now() + 1000 * 60 * 60),
            status: 'SCHEDULED'
        }, {}, admin);
        const createRes = mockRes();

        await contestController.createContest(createReq, createRes);
        if (createRes.data.success) {
            console.log('PASS: Contest created');
        } else {
            console.error('FAIL: Contest creation failed', createRes.data);
            return; // Stop if failed
        }

        const contestId = createRes.data.contest._id;

        console.log('\n--- Test 2: User Registration ---');
        const regReq = mockReq({}, { id: contestId }, user);
        const regRes = mockRes();
        await contestController.registerForContest(regReq, regRes);

        if (regRes.data.success) {
            console.log('PASS: User registered');
        } else {
            console.error('FAIL: User registration failed', regRes.data);
        }

        console.log('\n--- Test 3: Admin Submission Monitoring ---');
        // Admin gets all submissions
        const subReq = mockReq({}, {}, admin, { limit: 5 });
        const subRes = mockRes();
        await submissionController.getAllSubmissions(subReq, subRes);

        if (subRes.data.success && Array.isArray(subRes.data.submissions)) {
            console.log(`PASS: Admin fetched ${subRes.data.submissions.length} submissions`);
        } else {
            console.error('FAIL: Admin fetch submissions failed', subRes.data);
        }

        console.log('\n--- Test 4: Leaderboard ---');
        const lbReq = mockReq({}, { id: contestId }, admin); // Admin view
        const lbRes = mockRes();
        await contestController.getLeaderboard(lbReq, lbRes);

        if (lbRes.data.success && lbRes.data.leaderboard.some(p => p.username === user.username)) {
            console.log('PASS: User found in leaderboard');
        } else {
            console.error('FAIL: Leaderboard check failed', lbRes.data);
        }

        // Cleanup
        await Contest.deleteMany({ title: 'Test Contest' });

    } catch (e) {
        console.error('Test Error:', e);
    } finally {
        await mongoose.disconnect();
    }
}

runTest();
