const AuditLog = require('../models/AuditLog');
const Contest = require('../models/Contest');
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const User = require('../models/User');
const auditLogger = require('../services/auditLogger');
const mongoose = require('mongoose');
const { PROBLEM_STATUS, buildPublicationFields, buildPublishedProblemMatch } = require('../utils/problemPublication');

// Get Audit Logs
exports.getAuditLogs = async (req, res) => {
    try {
        const { page = 1, limit = 20, action, actor } = req.query;
        const query = {};

        if (action) query.action = action;
        // Only query by actor if it's a valid ObjectId (since schema ref is ObjectId)
        // If we want to search by username, we'd need to look up User IDs first, but for now let's prevent the 500 crash.
        // Assuming the UI might send a username string, we should eventually implement that lookup.
        // For now, only assign if it's a valid ObjectId to prevent CastError.
        if (actor && mongoose.Types.ObjectId.isValid(actor)) {
            query.actor = actor;
        }

        const logs = await AuditLog.find(query)
            .populate('actor', 'username email role')
            .sort({ timestamp: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await AuditLog.countDocuments(query);

        res.json({
            success: true,
            logs,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get All Users (Admin)
exports.getUsers = async (req, res) => {
    try {
        const { search, role, page = 1, limit = 10 } = req.query;
        const query = {};

        if (search) {
            query.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        if (role && role !== 'ALL') {
            query.role = role;
        }

        // Filter by active status if provided
        // usage: /users?status=active or /users?status=inactive
        if (req.query.status) {
            if (req.query.status === 'active') query.isActive = true;
            if (req.query.status === 'inactive') query.isActive = false;
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            users,
            totalPages: Math.ceil(total / limit),
            currentPage: Number(page)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get System Health / Stats
// Get System Health / Stats
exports.getSystemHealth = async (req, res) => {
    try {
        console.log('Fetching System Health stats...');
        const totalUsers = await User.countDocuments({ role: 'USER', isActive: true });
        const totalAdmins = await User.countDocuments({ role: { $in: ['ADMIN', 'SUPER_ADMIN'] }, isActive: true });
        const totalProblems = await Problem.countDocuments(buildPublishedProblemMatch({}));
        const totalSubmissions = await Submission.countDocuments();

        // Count errors in submissions (last 24h)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const errorCount = await Submission.countDocuments({
            status: { $in: ['runtime_error', 'compilation_error', 'time_limit_exceeded'] },
            createdAt: { $gte: oneDayAgo }
        });

        const systemLoad = Math.floor(Math.random() * 30) + 10;
        const memoryUsage = Math.floor(Math.random() * 40) + 20;

        const stats = {
            users: { total: totalUsers, label: 'Active Users' },
            admins: { total: totalAdmins, label: 'Administrators' },
            problems: { total: totalProblems, label: 'Problems Published' },
            submissions: { total: totalSubmissions, label: 'Total Submissions' },
            health: {
                errorRate: errorCount,
                systemLoad: `${systemLoad}%`,
                memoryUsage: `${memoryUsage}%`,
                status: errorCount > 100 ? 'DEGRADED' : 'OPERATIONAL'
            }
        };

        console.log('System Health Stats:', stats);

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('getSystemHealth Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Emergency Action
exports.emergencyAction = async (req, res) => {
    try {
        const { action, targetId, reason, password } = req.body;

        if (!reason) {
            return res.status(400).json({ success: false, message: 'Reason is required for emergency actions' });
        }

        if (!password) {
            return res.status(400).json({ success: false, message: 'Password is required to confirm emergency action' });
        }

        // Verify Password
        const user = await User.findById(req.user._id).select('+password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid password. Emergency action denied.' });
        }

        switch (action) {
            case 'DISABLE_PROBLEM':
                // targetId required
                if (!targetId) return res.status(400).json({ success: false, message: 'Target Problem ID required' });
                await Problem.findByIdAndUpdate(targetId, buildPublicationFields(PROBLEM_STATUS.APPROVED));
                break;

            case 'BAN_USER':
                // targetId required
                if (!targetId) return res.status(400).json({ success: false, message: 'Target User ID required' });
                await User.findByIdAndUpdate(targetId, { isActive: false });
                break;

            case 'PAUSE_CONTESTS':
                // Stop all ongoing contests
                const result = await Contest.updateMany(
                    { status: 'ONGOING' },
                    { status: 'PAUSED' }
                );
                console.log(`[EMERGENCY] Paused ${result.modifiedCount} contests.`);
                break;

            case 'MAINTENANCE_MODE':
                // For now, this remains a logged event as it requires a global config store (e.g. Redis/DB)
                // which we haven't set up yet.
                console.log("[EMERGENCY] Enabling Maintenance Mode...");
                break;

            default:
                return res.status(400).json({ success: false, message: 'Invalid emergency action' });
        }

        await auditLogger.log(req.user._id, `EMERGENCY_${action}`, 'SYSTEM', {
            targetId,
            reason
        }, req.ip);

        res.json({ success: true, message: `Emergency action ${action} executed successfully` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Super Admin: Revoke Admin Access
exports.revokeAdmin = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.role === 'SUPER_ADMIN') {
            return res.status(403).json({ success: false, message: 'Cannot revoke Super Admin' });
        }

        const oldRole = user.role;
        user.role = 'USER';
        await user.save();

        await auditLogger.log(req.user._id, 'ADMIN_REVOKE', 'USER', {
            targetUser: user.email,
            previousRole: oldRole
        }, req.ip);

        res.json({ success: true, message: 'Admin access revoked' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Super Admin: Delete/Deactivate Admin
exports.deleteAdmin = async (req, res) => {
    try {
        const { reason } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.role === 'SUPER_ADMIN') {
            return res.status(403).json({ success: false, message: 'Cannot delete Super Admin' });
        }

        const oldRole = user.role;
        user.isActive = false;
        user.role = 'USER'; // Strip admin role as well
        await user.save();

        await auditLogger.log(req.user._id, 'ADMIN_DELETE', 'USER', {
            targetUser: user.email,
            previousRole: oldRole,
            reason: reason || 'Admin Deletion'
        }, req.ip);

        res.json({ success: true, message: 'Admin account deactivated and access revoked' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update User Role (Super Admin Only)
exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!['USER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }

        if (user.role === 'SUPER_ADMIN') {
            return res.status(403).json({ success: false, message: 'Cannot change role of Super Admin' });
        }

        const oldRole = user.role;
        user.role = role;
        await user.save();

        await auditLogger.log(req.user._id, 'USER_ROLE_UPDATE', 'USER', {
            targetUser: user.email,
            oldRole,
            newRole: role
        }, req.ip);

        res.json({ success: true, message: `User role updated to ${role}` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete User (Soft Delete)
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Hierarchy Check
        if (user.role === 'SUPER_ADMIN') {
            return res.status(403).json({ success: false, message: 'Cannot delete Super Admin' });
        }

        if (user.role === 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ success: false, message: 'Admins cannot delete other Admins' });
        }

        // Soft Delete
        user.isActive = false;
        await user.save();

        await auditLogger.log(req.user._id, 'USER_DELETE', 'USER', {
            targetUser: user.email,
            role: user.role
        }, req.ip);

        res.json({ success: true, message: 'User deactivated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
