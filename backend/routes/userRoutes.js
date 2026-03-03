const express = require('express');
const router = express.Router();
const {
    getLeaderboard,
    getUserStats,
    searchUsers,
    getUserByUsername,
    createAdmin,
    updateRole,
    inviteAdmin,
    acceptInvitation,
    revokeAdmin,
    getAdmins,
    sendMessage
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// Public search & profile routes (must be above param routes)
router.get('/search', searchUsers);
router.get('/profile/:username', getUserByUsername);

router.get('/leaderboard', getLeaderboard);
router.get('/stats', protect, getUserStats);
router.post('/message/:userId', protect, sendMessage);

// Admin Management (Super Admin)
router.post('/admin', protect, authorize('SUPER_ADMIN'), createAdmin); // Legacy/Direct
router.post('/invite', protect, authorize('SUPER_ADMIN'), inviteAdmin);
router.post('/accept-invite', acceptInvitation); // Public endpoint (with valid token)
router.put('/:id/role', protect, authorize('SUPER_ADMIN'), updateRole);
router.delete('/:id/revoke', protect, authorize('SUPER_ADMIN'), revokeAdmin);
router.get('/admins', protect, authorize('SUPER_ADMIN'), getAdmins);

module.exports = router;

