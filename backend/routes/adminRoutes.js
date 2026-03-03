const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getAuditLogs,
    getSystemHealth,
    emergencyAction,
    getUsers,
    deleteAdmin,
    revokeAdmin,
    updateUserRole,
    deleteUser
} = require('../controllers/adminController');
const {
    getAdminList,
    getAdminAnalytics
} = require('../controllers/analyticsController');
const {
    getAdminProfile,
    updateAdminProfile,
    getAdminDashboard,
    getAdminActivity,
    getAdminSecurity,
    updateAdminSecurity,
    forceLogoutAllDevices
} = require('../controllers/adminProfileController');

// Shared Admin Routes (ADMIN & SUPER_ADMIN)
router.get('/profile', protect, authorize('ADMIN', 'SUPER_ADMIN'), getAdminProfile);
router.patch('/profile', protect, authorize('ADMIN', 'SUPER_ADMIN'), updateAdminProfile);
router.get('/profile/dashboard', protect, authorize('ADMIN', 'SUPER_ADMIN'), getAdminDashboard);
router.get('/profile/activity', protect, authorize('ADMIN', 'SUPER_ADMIN'), getAdminActivity);
router.get('/profile/security', protect, authorize('ADMIN', 'SUPER_ADMIN'), getAdminSecurity);
router.patch('/profile/security', protect, authorize('ADMIN', 'SUPER_ADMIN'), updateAdminSecurity);
router.post('/profile/security/force-logout', protect, authorize('ADMIN', 'SUPER_ADMIN'), forceLogoutAllDevices);

router.get('/audit-logs', protect, authorize('ADMIN', 'SUPER_ADMIN'), getAuditLogs);
router.get('/health', protect, authorize('ADMIN', 'SUPER_ADMIN'), getSystemHealth);
router.get('/users', protect, authorize('ADMIN', 'SUPER_ADMIN'), getUsers);
router.delete('/users/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), deleteUser); // General delete user

// Super Admin Only Routes
router.post('/emergency', protect, authorize('SUPER_ADMIN'), emergencyAction);
router.put('/users/revoke/:id', protect, authorize('SUPER_ADMIN'), revokeAdmin);
router.put('/users/:id/role', protect, authorize('SUPER_ADMIN'), updateUserRole); // Change role
router.delete('/users/:id/admin', protect, authorize('SUPER_ADMIN'), deleteAdmin); // Specific admin delete (optional/legacy)

// Analytics Routes (Super Admin Only)
router.get('/analytics/admins', protect, authorize('SUPER_ADMIN'), getAdminList);
router.get('/analytics/admin/:id', protect, authorize('SUPER_ADMIN'), getAdminAnalytics);

module.exports = router;
