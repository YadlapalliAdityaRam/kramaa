const express = require('express');
const { protect } = require('../middleware/auth');
const allowOnly = require('../middleware/allowOnly');
const superAdminActionLogger = require('../middleware/superAdminActionLogger');
const {
    getSuperAdminProfile,
    getDashboardStats,
    getAuditLogs,
    getAdmins,
    createAdmin,
    updateAdmin,
    removeAdmin,
    toggleMaintenance,
    getSystemHealth,
    getAnalytics
} = require('../controllers/superAdminController');

const router = express.Router();

router.use(protect);
router.use(allowOnly('SUPER_ADMIN'));

router.get('/profile', superAdminActionLogger('VIEW_SUPER_ADMIN_PROFILE', { targetType: 'PROFILE' }), getSuperAdminProfile);
router.get('/dashboard-stats', superAdminActionLogger('VIEW_DASHBOARD_STATS', { targetType: 'SYSTEM' }), getDashboardStats);
router.get('/audit-logs', superAdminActionLogger('VIEW_AUDIT_LOGS', { targetType: 'AUDIT_LOG' }), getAuditLogs);
router.get('/admins', superAdminActionLogger('VIEW_ADMINS', { targetType: 'USER' }), getAdmins);
router.post('/create-admin', superAdminActionLogger('CREATE_ADMIN', { targetType: 'USER' }), createAdmin);
router.patch('/update-admin/:id', superAdminActionLogger('UPDATE_ADMIN', { targetType: 'USER' }), updateAdmin);
router.delete('/remove-admin/:id', superAdminActionLogger('REMOVE_ADMIN', { targetType: 'USER' }), removeAdmin);
router.patch('/toggle-maintenance', superAdminActionLogger('TOGGLE_MAINTENANCE', { targetType: 'SYSTEM' }), toggleMaintenance);
router.get('/system-health', superAdminActionLogger('VIEW_SYSTEM_HEALTH', { targetType: 'SYSTEM' }), getSystemHealth);
router.get('/analytics', superAdminActionLogger('VIEW_ANALYTICS', { targetType: 'ANALYTICS' }), getAnalytics);

module.exports = router;
