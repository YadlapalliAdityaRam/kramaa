const express = require('express');
const { protect, optionalProtect, authorize } = require('../middleware/auth');
const {
    follow,
    unfollow,
    getFollowers,
    getFollowing,
    getFollowRelationship,
    getActivityFeed,
    getSuggested,
    getFriendsLeaderboard,
    getDailyChallengeActivity,
    reportUser,
    getAdminSocialOverview,
    getAdminProfileReports,
    removeSpamFollow,
    removeSpamUserFollows,
    getSuperAdminSocialConfig,
    updateSuperAdminSocialConfig
} = require('../controllers/socialController');

const router = express.Router();

// Required by spec
router.post('/follow', protect, follow);
router.post('/unfollow', protect, unfollow);
router.get('/followers/:userId', optionalProtect, getFollowers);
router.get('/following/:userId', optionalProtect, getFollowing);
router.get('/activity/feed', protect, getActivityFeed);
router.get('/suggested-users', protect, getSuggested);
router.post('/report-user', protect, reportUser);

// Additional social APIs
router.get('/social/relationship/:userId', protect, getFollowRelationship);
router.get('/social/friends-leaderboard', protect, getFriendsLeaderboard);
router.get('/social/daily-challenge-activity', protect, getDailyChallengeActivity);

// Admin moderation & analytics
router.get('/social/admin/overview', protect, authorize('ADMIN', 'SUPER_ADMIN'), getAdminSocialOverview);
router.get('/social/admin/reports', protect, authorize('ADMIN', 'SUPER_ADMIN'), getAdminProfileReports);
router.delete('/social/admin/follows/by-user/:userId', protect, authorize('ADMIN', 'SUPER_ADMIN'), removeSpamUserFollows);
router.delete('/social/admin/follows/:followId', protect, authorize('ADMIN', 'SUPER_ADMIN'), removeSpamFollow);

// Super admin controls
router.get('/social/superadmin/config', protect, authorize('SUPER_ADMIN'), getSuperAdminSocialConfig);
router.put('/social/superadmin/config', protect, authorize('SUPER_ADMIN'), updateSuperAdminSocialConfig);

module.exports = router;
