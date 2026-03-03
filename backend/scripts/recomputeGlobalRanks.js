const dotenv = require('dotenv');
const mongoose = require('mongoose');
const globalRankService = require('../services/globalRankService');

dotenv.config();

const run = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not configured');
        }

        await mongoose.connect(process.env.MONGODB_URI);
        await globalRankService.bootstrapAllUserMetrics();
        const rankedUsers = await globalRankService.recomputeGlobalRanks();

        console.log(`Global rank recompute complete. Ranked users: ${rankedUsers.length}`);
        process.exit(0);
    } catch (error) {
        console.error('Failed to recompute global ranks:', error);
        process.exit(1);
    }
};

run();
