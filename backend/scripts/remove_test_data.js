const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Submission = require('../models/Submission');
const ActivityLog = require('../models/ActivityLog');
const ActivityEvent = require('../models/ActivityEvent');
const AuditLog = require('../models/AuditLog');
const ContestParticipant = require('../models/ContestParticipant');
const ContestResult = require('../models/ContestResult');
const Doubt = require('../models/Doubt');
const Notification = require('../models/Notification');
const ProblemLike = require('../models/ProblemLike');
const Profile = require('../models/Profile');
const UserAnalytics = require('../models/UserAnalytics');
const Ticket = require('../models/Ticket');
const TicketMessage = require('../models/TicketMessage');
const TicketDecision = require('../models/TicketDecision');
const Follow = require('../models/Follow');

dotenv.config();

const TEST_USER_PATTERNS = [
    /^user_87a91b59$/i,
    /^analytics_test_/i,
    /^probe_/i,
    /^probe_manual_/i,
    /^debuguser7733$/i,
    /^dbg\d+$/i,
    /^probe[b]\d+$/i,
    /^probe\d+$/i,
    /^pidprobe/i,
    /^finalprobe/i,
    /^check\d+$/i,
    /^cap\d+$/i,
    /^st\d+$/i,
    /^verify\d+$/i
];

const parseArgs = (argv) => {
    return {
        apply: argv.includes('--apply'),
        dryRun: !argv.includes('--apply')
    };
};

const run = async () => {
    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is required');
    }

    const { apply } = parseArgs(process.argv);
    console.log(`[remove-test-data] Mode: ${apply ? 'APPLY (DELETION)' : 'DRY RUN'}`);

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[remove-test-data] Connected to MongoDB');

    // 1. Identify Test Users
    const allUsers = await User.find().select('_id username email role').lean();
    const testUsers = allUsers.filter(user => 
        TEST_USER_PATTERNS.some(pattern => pattern.test(user.username)) ||
        user.email.includes('example.com') || 
        user.email.includes('test.com')
    );

    if (testUsers.length === 0) {
        console.log('[remove-test-data] No test users found.');
        await mongoose.disconnect();
        return;
    }

    console.log(`[remove-test-data] Found ${testUsers.length} test user(s):`);
    console.table(testUsers.map(u => ({ id: u._id, username: u.username, email: u.email })));

    const testUserIds = testUsers.map(u => u._id);

    // 2. Define models and their user-reference fields
    const modelConfigs = [
        { model: Submission, field: 'user', name: 'Submissions' },
        { model: ActivityLog, field: 'user', name: 'ActivityLogs' },
        { model: ActivityEvent, field: 'user', name: 'ActivityEvents' },
        { model: AuditLog, field: 'userId', name: 'AuditLogs' },
        { model: ContestParticipant, field: 'userId', name: 'ContestParticipants' },
        { model: ContestResult, field: 'userId', name: 'ContestResults' },
        { model: Doubt, field: 'author', name: 'Doubts' },
        { model: Notification, field: 'recipient', name: 'Notifications' },
        { model: ProblemLike, field: 'user', name: 'ProblemLikes' },
        { model: Profile, field: 'user', name: 'Profiles' },
        { model: UserAnalytics, field: 'userId', name: 'UserAnalytics' },
        { model: Ticket, field: 'user', name: 'Tickets' },
        { model: TicketMessage, field: 'sender', name: 'TicketMessages' },
        { model: TicketDecision, field: 'admin', name: 'TicketDecisions' },
        { model: Follow, field: 'follower', name: 'Followings' },
        { model: Follow, field: 'following', name: 'Followers' }
    ];

    const results = {};

    for (const config of modelConfigs) {
        const query = { [config.field]: { $in: testUserIds } };
        if (apply) {
            const result = await config.model.deleteMany(query);
            results[config.name] = result.deletedCount;
        } else {
            const count = await config.model.countDocuments(query);
            results[config.name] = count;
        }
    }

    // 3. Final User Deletion
    if (apply) {
        const userResult = await User.deleteMany({ _id: { $in: testUserIds } });
        results['Users'] = userResult.deletedCount;
    } else {
        results['Users'] = testUserIds.length;
    }

    console.log('\n[remove-test-data] Execution Summary:');
    console.table(results);

    if (!apply) {
        console.log('\n[remove-test-data] Dry run complete. No data was deleted. Re-run with --apply to execute.');
    } else {
        console.log('\n[remove-test-data] Cleanup completed successfully.');
    }

    await mongoose.disconnect();
};

run().catch(async (error) => {
    console.error(`[remove-test-data] FAIL: ${error.message}`);
    try {
        await mongoose.disconnect();
    } catch (_) {}
    process.exit(1);
});
