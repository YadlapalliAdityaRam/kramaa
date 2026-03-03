const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const User = require('../models/User');

jest.setTimeout(30000); // Increase timeout to 30 seconds

beforeAll(async () => {
    // Ideally use a test DB. For now, we reuse the dev DB but should be careful.
    // To be safe, let's just connect.
    // If we want to be clean, we should clear Users collection before tests.
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGODB_URI);
    }
});

afterAll(async () => {
    // Cleanup valid test user
    await User.deleteMany({ email: 'test@example.com' });
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    // Force exit if needed
});

describe('Auth API /api/auth', () => {

    // Cleanup before running
    beforeEach(async () => {
        await User.deleteMany({ email: 'test@example.com' });
    });

    it('should register a new user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'TestUser',
                email: 'test@example.com',
                password: 'password123'
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user).toHaveProperty('email', 'test@example.com');
    });

    it('should not register user with existing email', async () => {
        // First registration
        await request(app).post('/api/auth/register').send({
            username: 'TestUser',
            email: 'test@example.com',
            password: 'password123'
        });

        // Duplicate registration
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'TestUser2',
                email: 'test@example.com',
                password: 'password123'
            });

        expect(res.statusCode).toEqual(400); // Or 409 depending on implementation
        expect(res.body).toHaveProperty('message', 'User already exists');
    });

    it('should login with valid credentials', async () => {
        // Register first
        await request(app).post('/api/auth/register').send({
            username: 'TestUser',
            email: 'test@example.com',
            password: 'password123'
        });

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'password123'
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
    });

    it('should not login with invalid password', async () => {
        // Register first
        await request(app).post('/api/auth/register').send({
            username: 'TestUser',
            email: 'test@example.com',
            password: 'password123'
        });

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'wrongpassword'
            });

        expect(res.statusCode).toEqual(401);
    });
});
