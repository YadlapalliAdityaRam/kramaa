const AuditLog = require('../models/AuditLog');
const Contest = require('../models/Contest');
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const User = require('../models/User');
const auditLogger = require('../services/auditLogger');
const notificationService = require('../services/notificationService');
const mongoose = require('mongoose');
const { PROBLEM_STATUS, buildPublicationFields, buildPublishedProblemMatch } = require('../utils/problemPublication');

// ─── Get Audit Logs ────────────────────────────────────────────────────────────
exports.getAuditLogs = async (req, res) => {
    try {
        const { page = 1, limit = 20, action, actor } = req.query;
        const query = {};

        if (action) query.action = action;

        // Only assign actor if it's a valid ObjectId to prevent CastError.
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
            currentPage: Number(page)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Get All Users (Admin) ─────────────────────────────────────────────────────
exports.getUsers = async (req, res) => {
    try {
        const { search, role, page = 1, limit = 100 } = req.query;
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

// ─── Get System Health / Stats ─────────────────────────────────────────────────
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

        res.json({ success: true, stats });
    } catch (error) {
        console.error('getSystemHealth Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Emergency Action ──────────────────────────────────────────────────────────
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
                if (!targetId) return res.status(400).json({ success: false, message: 'Target Problem ID required' });
                await Problem.findByIdAndUpdate(targetId, buildPublicationFields(PROBLEM_STATUS.APPROVED));
                break;

            case 'BAN_USER':
                if (!targetId) return res.status(400).json({ success: false, message: 'Target User ID required' });
                await User.findByIdAndUpdate(targetId, { isActive: false });
                break;

            case 'PAUSE_CONTESTS': {
                const result = await Contest.updateMany(
                    { status: 'ONGOING' },
                    { status: 'PAUSED' }
                );
                console.log(`[EMERGENCY] Paused ${result.modifiedCount} contests.`);
                break;
            }

            case 'MAINTENANCE_MODE':
                console.log('[EMERGENCY] Enabling Maintenance Mode...');
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

// ─── Revoke Admin Access (Super Admin Only) ────────────────────────────────────
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

// ─── Delete Admin (Super Admin Only) ──────────────────────────────────────────
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

// ─── Update User Role (Super Admin Only) ───────────────────────────────────────
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

// ─── Delete User from Database & Notify Super Admin ───────────────────────────
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Hierarchy guard
        if (user.role === 'SUPER_ADMIN') {
            return res.status(403).json({ success: false, message: 'Cannot delete Super Admin account' });
        }

        if (user.role === 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ success: false, message: 'Admins cannot delete other Admins. Contact Super Admin.' });
        }

        const deletedUsername = user.username;
        const deletedEmail = user.email;
        const deletedRole = user.role;
        const deletedUserId = user._id;
        const adminName = req.user?.username || 'Admin';

        // 1. Hard-delete user from DB immediately
        await User.findByIdAndDelete(deletedUserId);

        // 2. Cascade cleanup — submissions and notifications owned by the user
        try {
            await Submission.deleteMany({ userId: deletedUserId });
            const Notification = require('../models/Notification');
            await Notification.deleteMany({ userId: deletedUserId });
        } catch (cleanupErr) {
            console.error('[deleteUser] Cascade cleanup warning:', cleanupErr.message);
        }

        // 3. Audit log
        await auditLogger.log(req.user._id, 'USER_PERMANENT_DELETE', 'USER', {
            deletedUserId: deletedUserId.toString(),
            targetUser: deletedEmail,
            targetUsername: deletedUsername,
            role: deletedRole,
            deletedBy: adminName
        }, req.ip);

        // 4. Notify every Super Admin in real-time
        try {
            const superAdmins = await User.find({ role: 'SUPER_ADMIN' }).select('_id');
            if (superAdmins.length > 0) {
                const superAdminIds = superAdmins.map(sa => sa._id);
                await notificationService.broadcastNotification(req, superAdminIds, {
                    type: 'admin',
                    title: '🗑️ User Deleted',
                    message: `Admin ${adminName} permanently deleted user "${deletedUsername}" (${deletedEmail}) [Role: ${deletedRole}].`,
                    link: '/super-admin',
                    icon: '🗑️'
                });
            }
        } catch (notifErr) {
            console.error('[deleteUser] Super Admin notification error:', notifErr.message);
        }

        // 5. Real-time refresh broadcast to all dashboard clients
        try {
            const io = req.app?.get?.('io');
            if (io) {
                io.emit('admin:refresh', { sections: ['users', 'dashboard'] });
                io.emit('superadmin:refresh', { sections: ['users', 'dashboard'] });
            }
        } catch (_) {}

        res.json({
            success: true,
            message: `User "${deletedUsername}" has been permanently deleted and Super Admin has been notified.`
        });
    } catch (error) {
        console.error('[deleteUser] Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Daily Challenge Handlers ──────────────────────────────────────────────────
exports.getDailyChallengesHistory = async (req, res) => {
    try {
        const DailyChallenge = require('../models/DailyChallenge');
        const { page = 1, limit = 10 } = req.query;
        const challenges = await DailyChallenge.find()
            .populate('problem', 'title difficulty')
            .populate('scheduledBy', 'username email')
            .sort({ scheduledDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await DailyChallenge.countDocuments();

        res.json({ success: true, challenges, total, totalPages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getUpcomingDailyChallenges = async (req, res) => {
    try {
        const DailyChallenge = require('../models/DailyChallenge');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcoming = await DailyChallenge.find({ scheduledDate: { $gte: today } })
            .populate('problem', 'title difficulty')
            .populate('scheduledBy', 'username email')
            .sort({ scheduledDate: 1 });

        res.json({ success: true, challenges: upcoming });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.scheduleDailyChallenge = async (req, res) => {
    try {
        const DailyChallenge = require('../models/DailyChallenge');
        const { problemId, scheduledDate, notes } = req.body;

        if (!problemId || !scheduledDate) {
            return res.status(400).json({ success: false, message: 'problemId and scheduledDate are required' });
        }

        const existing = await DailyChallenge.findOne({ scheduledDate: new Date(scheduledDate) });
        if (existing) {
            return res.status(409).json({ success: false, message: 'A challenge is already scheduled for that date' });
        }

        const challenge = await DailyChallenge.create({
            problem: problemId,
            scheduledDate: new Date(scheduledDate),
            scheduledBy: req.user._id,
            notes
        });

        await auditLogger.log(req.user._id, 'DAILY_CHALLENGE_SCHEDULE', 'PROBLEM', {
            problemId,
            scheduledDate
        }, req.ip);

        res.status(201).json({ success: true, challenge });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateDailyChallenge = async (req, res) => {
    try {
        const DailyChallenge = require('../models/DailyChallenge');
        const { id, problemId, scheduledDate, notes } = req.body;

        if (!id) return res.status(400).json({ success: false, message: 'Challenge id is required' });

        const challenge = await DailyChallenge.findByIdAndUpdate(
            id,
            { problem: problemId, scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined, notes },
            { new: true, runValidators: true }
        );

        if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });

        res.json({ success: true, challenge });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteDailyChallenge = async (req, res) => {
    try {
        const DailyChallenge = require('../models/DailyChallenge');
        const { id } = req.body;
        if (!id) return res.status(400).json({ success: false, message: 'Challenge id is required' });

        const challenge = await DailyChallenge.findByIdAndDelete(id);
        if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });

        res.json({ success: true, message: 'Daily challenge deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Super Admin Analytics ─────────────────────────────────────────────────────
exports.getAdminList = async (req, res) => {
    try {
        const admins = await User.find({ role: { $in: ['ADMIN'] } })
            .select('-password')
            .sort({ createdAt: -1 });
        res.json({ success: true, admins });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAdminAnalytics = async (req, res) => {
    try {
        const admin = await User.findById(req.params.id).select('-password');
        if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

        const [problemCount, submissionCount, recentActivity] = await Promise.all([
            Problem.countDocuments({ createdBy: admin._id }),
            Submission.countDocuments({ gradedBy: admin._id }),
            AuditLog.find({ actor: admin._id })
                .sort({ timestamp: -1 })
                .limit(10)
        ]);

        res.json({ success: true, admin, problemCount, submissionCount, recentActivity });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Admin Profile Handlers ────────────────────────────────────────────────────
exports.getAdminProfile = async (req, res) => {
    try {
        const admin = await User.findById(req.user._id).select('-password');
        if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
        res.json({ success: true, admin });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateAdminProfile = async (req, res) => {
    try {
        const { username, email, bio } = req.body;
        const admin = await User.findByIdAndUpdate(
            req.user._id,
            { username, email, bio },
            { new: true, runValidators: true }
        ).select('-password');
        res.json({ success: true, admin });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAdminSecurity = async (req, res) => {
    try {
        const admin = await User.findById(req.user._id).select('twoFactorEnabled loginHistory');
        res.json({ success: true, security: admin });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateAdminSecurity = async (req, res) => {
    try {
        const { twoFactorEnabled } = req.body;
        const admin = await User.findByIdAndUpdate(
            req.user._id,
            { twoFactorEnabled },
            { new: true }
        ).select('twoFactorEnabled');
        res.json({ success: true, admin });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.forceLogoutAllDevices = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, { $inc: { tokenVersion: 1 } });
        res.json({ success: true, message: 'All sessions invalidated. Please login again.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
