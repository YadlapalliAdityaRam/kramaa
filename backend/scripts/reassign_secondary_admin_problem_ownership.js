const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Problem = require('../models/Problem');

dotenv.config();

const getConnectionUri = () => process.env.MONGODB_URI || process.env.MONGO_URI;

const summarizeOwnership = async (adminIds) => {
    const stats = await Problem.aggregate([
        { $match: { createdBy: { $in: adminIds } } },
        { $group: { _id: '$createdBy', count: { $sum: 1 } } }
    ]);

    const map = new Map(stats.map((entry) => [String(entry._id), entry.count]));
    return map;
};

const run = async () => {
    const uri = getConnectionUri();
    if (!uri) {
        throw new Error('MONGODB_URI (or MONGO_URI) is required.');
    }

    await mongoose.connect(uri);

    try {
        const admins = await User.find({
            role: 'ADMIN',
            accountStatus: { $ne: 'Deleted' }
        })
            .select('_id username email createdAt')
            .sort({ createdAt: 1, _id: 1 })
            .lean();

        if (admins.length < 2) {
            console.log('[ownership-migrate] Skipped: less than 2 active ADMIN users found.');
            return;
        }

        const primaryAdmin = admins[0];
        const secondaryAdmins = admins.slice(1);
        const secondaryAdminIds = secondaryAdmins.map((admin) => admin._id);
        const allAdminIds = admins.map((admin) => admin._id);

        const beforeMap = await summarizeOwnership(allAdminIds);

        const result = await Problem.updateMany(
            { createdBy: { $in: secondaryAdminIds } },
            { $set: { createdBy: primaryAdmin._id } }
        );

        const afterMap = await summarizeOwnership(allAdminIds);

        console.log('[ownership-migrate] Primary ADMIN:', {
            id: String(primaryAdmin._id),
            username: primaryAdmin.username,
            email: primaryAdmin.email
        });
        console.log('[ownership-migrate] Reassigned problems:', result.modifiedCount || 0);

        const summary = admins.map((admin) => ({
            id: String(admin._id),
            username: admin.username,
            email: admin.email,
            before: beforeMap.get(String(admin._id)) || 0,
            after: afterMap.get(String(admin._id)) || 0
        }));
        console.log('[ownership-migrate] Ownership summary:', JSON.stringify(summary, null, 2));
    } finally {
        await mongoose.disconnect();
    }
};

run().catch(async (error) => {
    console.error('[ownership-migrate] Failed:', error.message);
    try {
        await mongoose.disconnect();
    } catch (_) {
        // noop
    }
    process.exit(1);
});

