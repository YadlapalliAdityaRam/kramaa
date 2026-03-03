require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Problem = require('../models/Problem');
const AuditLog = require('../models/AuditLog');
const userController = require('../controllers/userController');
const adminController = require('../controllers/adminController');
const problemController = require('../controllers/problemController');

// Mock Express Request/Response
const mockReq = (body = {}, params = {}, user = {}, query = {}) => ({
    body, params, user, query, ip: '127.0.0.1'
});

const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/algoverse';

async function runTest() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);

        // Cleanup
        await User.deleteMany({ email: /@test-super.com$/ });
        await Problem.deleteMany({ title: 'Audit Test Problem' });
        await AuditLog.deleteMany({ 'details.reason': 'Test Emergency' });

        console.log('\n--- Test 1: Admin Invitation Flow ---');

        // 1.1 Create Super Admin
        const superAdmin = await User.create({
            username: 'super_test',
            email: 'super@test-super.com',
            password: 'password123',
            role: 'SUPER_ADMIN',
            isVerified: true
        });

        // 1.2 Invite new Admin
        const inviteReq = mockReq({ email: 'newadmin@test-super.com', role: 'ADMIN' }, {}, superAdmin);
        const inviteRes = mockRes();
        await userController.inviteAdmin(inviteReq, inviteRes);

        if (inviteRes.statusCode === 201 && inviteRes.data.invitationLink) {
            console.log('PASS: Invitation created.');
        } else {
            console.error('FAIL: Invitation failed', inviteRes.data);
            return;
        }

        // Extract token
        const token = inviteRes.data.invitationLink.split('/').pop();

        // 1.3 Accept Invitation
        const acceptReq = mockReq({ token, password: 'newpassword123', username: 'new_admin' });
        const acceptRes = mockRes();
        await userController.acceptInvitation(acceptReq, acceptRes);

        if (acceptRes.data.success) {
            console.log('PASS: Invitation accepted.');
        } else {
            console.error('FAIL: Acceptance failed', acceptRes.data);
        }

        // Verify User
        const newAdmin = await User.findOne({ email: 'newadmin@test-super.com' });
        if (newAdmin && newAdmin.role === 'ADMIN' && newAdmin.isVerified) {
            console.log('PASS: New admin verified in DB.');
        } else {
            console.error('FAIL: New admin DB verification failed.');
        }


        console.log('\n--- Test 2: Audit Logging & Emergency Action ---');

        // 2.1 Create Problem (to be disabled)
        const problem = await Problem.create({
            title: 'Audit Test Problem',
            slug: 'audit-test-problem',
            description: 'Desc',
            difficulty: 'Easy',
            topic: 'Test',
            createdBy: superAdmin._id,
            isPublished: true
        });

        // 2.2 Emergency Disable
        const emergencyReq = mockReq(
            { action: 'DISABLE_PROBLEM', targetId: problem._id, reason: 'Test Emergency' },
            {},
            superAdmin
        );
        const emergencyRes = mockRes();
        await adminController.emergencyAction(emergencyReq, emergencyRes);

        if (emergencyRes.data.success) {
            console.log('PASS: Emergency action executed.');
        } else {
            console.error('FAIL: Emergency action failed', emergencyRes.data);
        }

        // 2.3 Verify Audit Log
        const log = await AuditLog.findOne({ action: 'EMERGENCY_DISABLE_PROBLEM' });
        if (log && log.details.reason === 'Test Emergency') {
            console.log('PASS: Audit log found.');
        } else {
            console.error('FAIL: Audit log NOT found.');
        }

        // 2.4 Verify Problem Disabled
        const updatedProblem = await Problem.findById(problem._id);
        if (!updatedProblem.isPublished) {
            console.log('PASS: Problem effectively disabled.');
        } else {
            console.error('FAIL: Problem still published.');
        }

        console.log('\nCleanup...');
        await User.deleteMany({ email: /@test-super.com$/ });
        await Problem.deleteMany({ title: 'Audit Test Problem' });
        // Keeping logs for manual inspection if needed, or delete

    } catch (error) {
        console.error('Test Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

runTest();
