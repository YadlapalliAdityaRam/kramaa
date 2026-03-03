const request = require('supertest');
const mongoose = require('mongoose');
const { app, connectDB } = require('../server');
const User = require('../models/User');
const Profile = require('../models/Profile');

jest.setTimeout(30000);

const TEST_PREFIX = '__search_test_';
const publicUsername = `${TEST_PREFIX}public_user`;
const privateUsername = `${TEST_PREFIX}private_user`;
const testPassword = 'TestPass123!';

let publicUserId, privateUserId;

beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
        await connectDB();
    }

    // Clean up any leftover test data
    await User.deleteMany({ username: { $regex: `^${TEST_PREFIX}` } });
    await Profile.deleteMany({});

    // Create a public test user
    const publicUser = new User({
        username: publicUsername,
        email: `${publicUsername}@test.com`,
        password: testPassword,
        role: 'USER',
        accountStatus: 'Active'
    });
    await publicUser.save();
    publicUserId = publicUser._id;

    // Create a Profile for public user (isPublic: true)
    const publicProfile = new Profile({
        user: publicUserId,
        bio: 'I am a public test user',
        preferences: { isPublic: true }
    });
    await publicProfile.save();

    // Create a private test user
    const privateUser = new User({
        username: privateUsername,
        email: `${privateUsername}@test.com`,
        password: testPassword,
        role: 'USER',
        accountStatus: 'Active'
    });
    await privateUser.save();
    privateUserId = privateUser._id;

    // Create a Profile for private user (isPublic: false)
    const privateProfile = new Profile({
        user: privateUserId,
        bio: 'I am a private test user',
        preferences: { isPublic: false }
    });
    await privateProfile.save();
});

afterAll(async () => {
    // Clean up test data
    await Profile.deleteMany({ user: { $in: [publicUserId, privateUserId] } });
    await User.deleteMany({ username: { $regex: `^${TEST_PREFIX}` } });
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
});

// =============================================
// GET /api/users/search
// =============================================

describe('GET /api/users/search', () => {

    it('should return 400 if no username query is provided', async () => {
        const res = await request(app).get('/api/users/search');
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/required/i);
    });

    it('should return 400 if username query is empty', async () => {
        const res = await request(app).get('/api/users/search?username=');
        expect(res.statusCode).toBe(400);
    });

    it('should return empty array for non-existent username', async () => {
        const res = await request(app).get('/api/users/search?username=nonexistentuser999xyz');
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.users).toEqual([]);
    });

    it('should find the public test user', async () => {
        const res = await request(app).get(`/api/users/search?username=${publicUsername}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.users.length).toBeGreaterThanOrEqual(1);

        const found = res.body.users.find(u => u.username === publicUsername);
        expect(found).toBeDefined();
        expect(found.username).toBe(publicUsername);
        expect(found.bio).toBe('I am a public test user');
    });

    it('should NOT return private users in search results', async () => {
        const res = await request(app).get(`/api/users/search?username=${TEST_PREFIX}`);
        expect(res.statusCode).toBe(200);

        const privateResult = res.body.users.find(u => u.username === privateUsername);
        expect(privateResult).toBeUndefined();
    });

    it('should never return sensitive fields in search results', async () => {
        const res = await request(app).get(`/api/users/search?username=${publicUsername}`);
        expect(res.statusCode).toBe(200);

        const found = res.body.users.find(u => u.username === publicUsername);
        expect(found).toBeDefined();
        expect(found.email).toBeUndefined();
        expect(found.password).toBeUndefined();
        expect(found.role).toBeUndefined();
    });
});

// =============================================
// GET /api/users/profile/:username
// =============================================

describe('GET /api/users/profile/:username', () => {

    it('should return 404 for non-existent user', async () => {
        const res = await request(app).get('/api/users/profile/nonexistentuser999xyz');
        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe('User not found');
    });

    it('should return 200 with profile data for a public user', async () => {
        const res = await request(app).get(`/api/users/profile/${publicUsername}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.user.username).toBe(publicUsername);
        expect(res.body.user.bio).toBe('I am a public test user');
        expect(res.body.user.problemsSolved).toBeDefined();
        expect(res.body.user.rating).toBeDefined();
        expect(res.body.user.badges).toBeDefined();
    });

    it('should return 403 for a private user', async () => {
        const res = await request(app).get(`/api/users/profile/${privateUsername}`);
        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe('This profile is private');
    });

    it('should never return sensitive fields for public user', async () => {
        const res = await request(app).get(`/api/users/profile/${publicUsername}`);
        expect(res.statusCode).toBe(200);

        const user = res.body.user;
        expect(user.email).toBeUndefined();
        expect(user.password).toBeUndefined();
        expect(user.role).toBeUndefined();
        expect(user.adminRole).toBeUndefined();
        expect(user.adminPermissions).toBeUndefined();
        expect(user.loginHistory).toBeUndefined();
    });
});
