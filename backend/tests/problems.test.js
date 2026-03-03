const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const User = require('../models/User');
const Problem = require('../models/Problem');

jest.setTimeout(30000);

let adminToken;
let userToken;

beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGODB_URI);
    }

    // Clear Users and Problems
    await User.deleteMany({ email: { $in: ['admin@test.com', 'user@test.com'] } });
    await Problem.deleteMany({ title: 'Test Problem' });

    // Register Admin
    await request(app).post('/api/auth/register').send({
        username: 'AdminUser',
        email: 'admin@test.com',
        password: 'password123'
    });
    // Promote to Admin (Directly in DB as we don't have a route for self-promotion)
    await User.updateOne({ email: 'admin@test.com' }, { role: 'ADMIN' });

    // Login Admin
    const adminRes = await request(app).post('/api/auth/login').send({
        email: 'admin@test.com',
        password: 'password123'
    });
    adminToken = adminRes.body.token;

    // Register User
    const userRes = await request(app).post('/api/auth/register').send({
        username: 'NormalUser',
        email: 'user@test.com',
        password: 'password123'
    });
    userToken = userRes.body.token;
});

afterAll(async () => {
    await User.deleteMany({ email: { $in: ['admin@test.com', 'user@test.com'] } });
    await Problem.deleteMany({ title: 'Test Problem' });
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
});

describe('Problem API /api/problems', () => {

    it('should create a problem as Admin', async () => {
        const res = await request(app)
            .post('/api/problems')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                title: 'Test Problem',
                slug: 'test-problem',
                description: 'Description',
                difficulty: 'Easy',
                topic: 'Array',
                functionName: 'solve',
                returnType: 'string',
                parameters: [{ name: 's', type: 'string' }],
                constraints: 'None',
                inputFormat: 'string',
                outputFormat: 'string',
                sampleTestCases: [{ input: { s: 'abc' }, output: 'cba' }],
                hiddenTestCases: [{ input: { s: 'hidden' }, output: 'neddih' }],
                driverCode: { javascript: 'console.log("hello")' },
                starterCode: { javascript: '// code here' }
            });

        if (res.statusCode !== 201) {
            console.log('Create Problem Error:', JSON.stringify(res.body, null, 2));
        }
        expect(res.statusCode).toEqual(201);
        expect(res.body.problem).toHaveProperty('title', 'Test Problem');
    });

    it('should NOT create a problem as Normal User', async () => {
        const res = await request(app)
            .post('/api/problems')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                title: 'Test Problem User',
                description: 'Should fail',
                difficulty: 'Easy'
            });

        expect(res.statusCode).toEqual(403); // Forbidden
    });

    it('should fetch all problems (Admin)', async () => {
        const res = await request(app)
            .get('/api/problems/admin-list')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body.problems)).toBeTruthy();
        // Should contain our created problem
        const found = res.body.problems.find(p => p.title === 'Test Problem');
        expect(found).toBeTruthy();
    });

    it('should fetch a single problem by ID (Admin)', async () => {
        // First get the problem ID from admin list
        const listRes = await request(app)
            .get('/api/problems/admin-list')
            .set('Authorization', `Bearer ${adminToken}`);

        const problem = listRes.body.problems.find(p => p.title === 'Test Problem');

        const res = await request(app)
            .get(`/api/problems/${problem._id}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.problem).toHaveProperty('title', 'Test Problem');
    });
});
