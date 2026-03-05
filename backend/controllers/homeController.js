const Problem = require('../models/Problem');
const User = require('../models/User');
const { buildPublishedProblemMatch } = require('../utils/problemPublication');

const getHomeStats = async (req, res, next) => {
    try {
        const [algorithmsCount, usersCount] = await Promise.all([
            Problem.countDocuments(buildPublishedProblemMatch({})),
            User.countDocuments({
                role: 'USER',
                accountStatus: { $ne: 'Deleted' },
                isVerified: true
            })
        ]);

        res.status(200).json({
            success: true,
            data: {
                algorithmsCount,
                usersCount,
                updatedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getHomeStats
};
