const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const DEFAULT_SUSPICIOUS_USERNAMES = [
    'verify6048',
    'st954989',
    'cap9972',
    'check9489',
    'probeb3258',
    'finalprobe3468',
    'dbg34375',
    'pidprobe4984',
    'probe1799',
    'dbg24097'
];

const DEFAULT_USERNAME_REGEX = /^(verify|st|cap|check|probeb|finalprobe|dbg|pidprobe|probe)\d+$/i;

const parseArgs = (argv) => {
    const rawArgs = argv.slice(2);
    const options = {
        apply: false,
        mode: 'suspend',
        createdOn: null,
        usernames: [...DEFAULT_SUSPICIOUS_USERNAMES],
        includePattern: true
    };

    rawArgs.forEach((arg) => {
        if (arg === '--apply') options.apply = true;
        if (arg === '--dry-run') options.apply = false;
        if (arg === '--delete') options.mode = 'delete';
        if (arg === '--suspend') options.mode = 'suspend';
        if (arg === '--no-pattern') options.includePattern = false;

        if (arg.startsWith('--created-on=')) {
            options.createdOn = arg.slice('--created-on='.length).trim();
        }

        if (arg.startsWith('--usernames=')) {
            const parsed = arg
                .slice('--usernames='.length)
                .split(',')
                .map((value) => value.trim().toLowerCase())
                .filter(Boolean);
            if (parsed.length > 0) {
                options.usernames = [...new Set(parsed)];
            }
        }
    });

    return options;
};

const buildCreatedOnRange = (createdOn) => {
    if (!createdOn) return null;
    const start = new Date(`${createdOn}T00:00:00.000Z`);
    if (Number.isNaN(start.getTime())) {
        throw new Error('Invalid --created-on value. Use format YYYY-MM-DD.');
    }
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return { $gte: start, $lt: end };
};

const printMatches = (users) => {
    const rows = users.map((user) => ({
        id: String(user._id),
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.accountStatus || 'Active',
        createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : ''
    }));
    console.table(rows);
};

const run = async () => {
    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is required');
    }

    const options = parseArgs(process.argv);
    const createdOnRange = buildCreatedOnRange(options.createdOn);

    const orFilters = [];
    if (options.usernames.length > 0) {
        orFilters.push({ username: { $in: options.usernames } });
    }
    if (options.includePattern) {
        orFilters.push({ username: { $regex: DEFAULT_USERNAME_REGEX } });
    }
    if (orFilters.length === 0) {
        throw new Error('No username filter configured. Pass --usernames or omit --no-pattern.');
    }

    const query = {
        role: 'USER',
        accountStatus: { $ne: 'Deleted' },
        $or: orFilters
    };
    if (createdOnRange) {
        query.createdAt = createdOnRange;
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[cleanup-suspicious-users] Connected to MongoDB');
    console.log(`[cleanup-suspicious-users] Mode=${options.mode}, Apply=${options.apply}, CreatedOn=${options.createdOn || 'any'}`);

    const users = await User.find(query)
        .select('_id username email role accountStatus createdAt')
        .lean();

    if (users.length === 0) {
        console.log('[cleanup-suspicious-users] No matching users found.');
        await mongoose.disconnect();
        return;
    }

    console.log(`[cleanup-suspicious-users] Matched ${users.length} user(s):`);
    printMatches(users);

    if (!options.apply) {
        console.log('[cleanup-suspicious-users] Dry run complete. Re-run with --apply to make changes.');
        await mongoose.disconnect();
        return;
    }

    const targetIds = users.map((user) => user._id);
    if (options.mode === 'delete') {
        const result = await User.deleteMany({ _id: { $in: targetIds } });
        console.log(`[cleanup-suspicious-users] Deleted users: ${result.deletedCount}`);
    } else {
        const now = new Date();
        const result = await User.updateMany(
            { _id: { $in: targetIds } },
            {
                $set: {
                    accountStatus: 'Suspended',
                    sessionInvalidatedAt: now
                }
            }
        );
        console.log(`[cleanup-suspicious-users] Suspended users: matched=${result.matchedCount}, modified=${result.modifiedCount}`);
    }

    await mongoose.disconnect();
    console.log('[cleanup-suspicious-users] Completed successfully.');
};

run().catch(async (error) => {
    console.error(`[cleanup-suspicious-users] FAIL: ${error.message}`);
    try {
        await mongoose.disconnect();
    } catch (_) {
        // noop
    }
    process.exit(1);
});
