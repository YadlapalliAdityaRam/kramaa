const os = require('os');
const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
const Problem = require('../models/Problem');
const Setting = require('../models/Setting');
const Submission = require('../models/Submission');
const SuperAdmin = require('../models/SuperAdmin');
const User = require('../models/User');
const ValidationJob = require('../models/ValidationJob');
const { ensureSuperAdminProfile } = require('../services/superAdminService');
const { buildPublishedProblemStats } = require('../services/problemStatsService');

const toCount = (aggregateResult) => aggregateResult?.[0]?.count || 0;

const parsePositiveInt = (value, fallback) => {
    const num = Number.parseInt(value, 10);
    if (!Number.isFinite(num) || num <= 0) return fallback;
    return num;
};

const toSafeNumber = (value, fallback = 0) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
};

const USER_ROLE = 'USER';

const buildSubmissionRoleLookupStages = (role = USER_ROLE) => ([
    {
        $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'submissionUser'
        }
    },
    { $unwind: '$submissionUser' },
    { $match: { 'submissionUser.role': role } }
]);

const buildSubmissionCountByUserRolePipeline = (match = {}, role = USER_ROLE) => ([
    { $match: match },
    ...buildSubmissionRoleLookupStages(role),
    { $count: 'count' }
]);

const getConfiguredActiveServerCount = () => {
    const explicitCount = Number.parseInt(process.env.BACKEND_INSTANCE_COUNT, 10);
    if (Number.isFinite(explicitCount) && explicitCount > 0) {
        return explicitCount;
    }

    const portListRaw = String(process.env.BACKEND_PORTS || '').trim();
    if (portListRaw) {
        const portCount = portListRaw
            .split(',')
            .map((port) => Number.parseInt(String(port).trim(), 10))
            .filter((port) => Number.isFinite(port) && port > 0).length;

        if (portCount > 0) return portCount;
    }

    return 1;
};

const toMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const buildPastMonthBuckets = (months) => {
    const now = new Date();
    const buckets = [];
    for (let i = months - 1; i >= 0; i -= 1) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        buckets.push({
            key: toMonthKey(date),
            label: date.toLocaleString('en-US', { month: 'short' }),
            year: date.getFullYear()
        });
    }
    return buckets;
};

const buildPastDayBuckets = (days) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const buckets = [];
    for (let i = days - 1; i >= 0; i -= 1) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        const key = date.toISOString().slice(0, 10);
        buckets.push({
            key,
            label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        });
    }
    return buckets;
};

const calculateCpuUsage = () => {
    const cpuCount = Math.max(1, os.cpus()?.length || 1);
    const loadAvg = os.loadavg()[0];
    let usage = (loadAvg / cpuCount) * 100;

    // Fallback for systems where loadavg is unavailable/always 0.
    if (!Number.isFinite(usage) || usage <= 0) {
        const cpuUsedMicros = process.cpuUsage();
        const totalUsed = cpuUsedMicros.user + cpuUsedMicros.system;
        const totalCapacity = process.uptime() * 1e6 * cpuCount;
        usage = totalCapacity > 0 ? (totalUsed / totalCapacity) * 100 : 0;
    }

    return Number(Math.max(0, Math.min(100, usage)).toFixed(2));
};

const formatAdminResponse = (admin, metrics = {}) => {
    const totalSubmissions = metrics.totalSubmissions || 0;
    const acceptedSubmissions = metrics.acceptedSubmissions || 0;
    const acceptanceRate = totalSubmissions > 0
        ? Number(((acceptedSubmissions / totalSubmissions) * 100).toFixed(2))
        : 0;

    return {
        _id: admin._id,
        fullName: admin.fullName || admin.username,
        username: admin.username,
        email: admin.email,
        phone: admin.phoneNumber || '',
        role: admin.role,
        accountStatus: admin.accountStatus || (admin.isActive === false ? 'Suspended' : 'Active'),
        isActive: admin.accountStatus ? admin.accountStatus === 'Active' : admin.isActive !== false,
        createdAt: admin.createdAt,
        lastLogin: admin.lastLogin || null,
        performance: {
            createdProblems: metrics.createdProblems || 0,
            approvedProblems: metrics.approvedProblems || 0,
            pendingProblems: metrics.pendingProblems || 0,
            totalSubmissions,
            acceptedSubmissions,
            acceptanceRate,
            avgRuntime: Number(toSafeNumber(metrics.avgRuntime).toFixed(2)),
            avgMemory: Number(toSafeNumber(metrics.avgMemory).toFixed(2))
        }
    };
};

exports.getSuperAdminProfile = async (req, res) => {
    try {
        const profile = await ensureSuperAdminProfile(req.user);
        const superAdmin = await SuperAdmin.findById(profile._id).lean();

        const recentActions = (superAdmin?.actionsPerformed || []).slice(-20).reverse();
        const loginHistory = (superAdmin?.loginHistory || []).slice(-20).reverse();

        const modules = [
            'User Management',
            'Admin Management',
            'Problem Approval',
            'Validation Gate Control',
            'Audit Logs',
            'Revenue Dashboard',
            'Server Control'
        ];

        return res.json({
            success: true,
            profile: {
                _id: superAdmin._id,
                fullName: superAdmin.fullName,
                username: superAdmin.username,
                email: superAdmin.email,
                phone: superAdmin.phone,
                profileImage: superAdmin.profileImage,
                role: superAdmin.role,
                permissions: superAdmin.permissions,
                permissionLevel: 'Full Access',
                modulesAccess: modules.map((moduleName) => ({
                    module: moduleName,
                    allowed: true
                })),
                isActive: superAdmin.isActive,
                lastLogin: superAdmin.lastLogin,
                loginHistory,
                recentActions,
                createdAt: superAdmin.createdAt,
                updatedAt: superAdmin.updatedAt
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.getDashboardStats = async (req, res) => {
    try {
        const [
            totalUsersAgg,
            totalAdminsAgg,
            totalSuperAdminsAgg,
            pendingProblemsAgg,
            totalSubmissionsAgg,
            monthlyRevenueSetting,
            publishedProblemStats
        ] = await Promise.all([
            User.aggregate([{ $match: { role: 'USER' } }, { $count: 'count' }]),
            User.aggregate([{ $match: { role: 'ADMIN' } }, { $count: 'count' }]),
            User.aggregate([{ $match: { role: 'SUPER_ADMIN' } }, { $count: 'count' }]),
            Problem.aggregate([
                {
                    $match: {
                        $or: [
                            { approvalStatus: 'PENDING' },
                            { status: { $in: ['DRAFT', 'READY_TO_PUBLISH', 'proposed', 'approved'] } }
                        ]
                    }
                },
                { $count: 'count' }
            ]),
            Submission.aggregate(buildSubmissionCountByUserRolePipeline()),
            Setting.findOne({ key: 'monthlyRevenue' }).lean(),
            buildPublishedProblemStats()
        ]);

        const monthlyRevenueRaw = monthlyRevenueSetting?.value ?? 0;

        return res.json({
            success: true,
            stats: {
                totalUsers: toCount(totalUsersAgg),
                totalAdmins: toCount(totalAdminsAgg),
                totalSuperAdmins: toCount(totalSuperAdminsAgg),
                totalProblems: publishedProblemStats.totalProblems,
                pendingProblems: toCount(pendingProblemsAgg),
                totalSubmissions: toCount(totalSubmissionsAgg),
                activeServers: getConfiguredActiveServerCount(),
                systemUptime: Math.round(process.uptime()),
                monthlyRevenue: Number(toSafeNumber(monthlyRevenueRaw).toFixed(2)),
                contestProblemCount: publishedProblemStats.contestProblemCount,
                difficultyBreakdown: publishedProblemStats.difficulty
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAuditLogs = async (req, res) => {
    try {
        const page = parsePositiveInt(req.query.page, 1);
        const limit = Math.min(parsePositiveInt(req.query.limit, 20), 100);
        const { actionType, targetType, startDate, endDate, actorId } = req.query;

        const match = {};
        if (actionType) match.action = actionType;
        if (targetType) match.target = targetType;
        if (actorId && mongoose.Types.ObjectId.isValid(actorId)) {
            match.actor = new mongoose.Types.ObjectId(actorId);
        }

        if (startDate || endDate) {
            match.timestamp = {};
            if (startDate) {
                const start = new Date(startDate);
                if (!Number.isNaN(start.getTime())) match.timestamp.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                if (!Number.isNaN(end.getTime())) {
                    end.setHours(23, 59, 59, 999);
                    match.timestamp.$lte = end;
                }
            }
            if (Object.keys(match.timestamp).length === 0) delete match.timestamp;
        }

        const [logs, total] = await Promise.all([
            AuditLog.find(match)
                .populate('actor', 'username fullName email role')
                .sort({ timestamp: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            AuditLog.countDocuments(match)
        ]);

        return res.json({
            success: true,
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAdmins = async (req, res) => {
    try {
        const page = parsePositiveInt(req.query.page, 1);
        const limit = Math.min(parsePositiveInt(req.query.limit, 10), 100);
        const includeSuperAdmins = req.query.includeSuperAdmins === 'true';
        const { search, status } = req.query;

        const roles = includeSuperAdmins ? ['ADMIN', 'SUPER_ADMIN'] : ['ADMIN'];
        const query = { role: { $in: roles } };

        if (search) {
            query.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { fullName: { $regex: search, $options: 'i' } }
            ];
        }

        if (status === 'active') {
            query.accountStatus = 'Active';
        } else if (status === 'suspended') {
            query.accountStatus = { $ne: 'Active' };
        }

        const [admins, total] = await Promise.all([
            User.find(query)
                .select('username email fullName phoneNumber role accountStatus isActive createdAt lastLogin')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            User.countDocuments(query)
        ]);

        const adminIds = admins.map((admin) => admin._id);
        const [createdProblemAgg, approvedProblemAgg] = await Promise.all([
            Problem.aggregate([
                { $match: { createdBy: { $in: adminIds } } },
                {
                    $group: {
                        _id: '$createdBy',
                        createdProblems: { $sum: 1 },
                        pendingProblems: {
                            $sum: {
                                $cond: [{ $eq: ['$approvalStatus', 'PENDING'] }, 1, 0]
                            }
                        }
                    }
                }
            ]),
            Problem.aggregate([
                { $match: { approvedBy: { $in: adminIds } } },
                {
                    $group: {
                        _id: '$approvedBy',
                        approvedProblems: { $sum: 1 }
                    }
                }
            ])
        ]);

        const createdProblemMap = new Map(
            createdProblemAgg.map((entry) => [String(entry._id), entry])
        );
        const approvedProblemMap = new Map(
            approvedProblemAgg.map((entry) => [String(entry._id), entry])
        );
        const enrichedAdmins = admins.map((admin) => {
            const key = String(admin._id);
            const createdMetrics = createdProblemMap.get(key) || {};
            const approvedMetrics = approvedProblemMap.get(key) || {};

            return formatAdminResponse(admin, {
                ...createdMetrics,
                ...approvedMetrics
            });
        });

        return res.json({
            success: true,
            admins: enrichedAdmins,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.createAdmin = async (req, res) => {
    try {
        const { fullName, username, email, password, phone } = req.body;

        if (!username || !email) {
            return res.status(400).json({ success: false, message: 'username and email are required' });
        }

        let adminUser = await User.findOne({ $or: [{ email }, { username }] });

        if (adminUser) {
            if (adminUser.role === 'SUPER_ADMIN') {
                return res.status(403).json({ success: false, message: 'Cannot modify SUPER_ADMIN via this endpoint' });
            }
            if (adminUser.role === 'ADMIN') {
                return res.status(409).json({ success: false, message: 'User is already an admin' });
            }

            adminUser.role = 'ADMIN';
            adminUser.accountStatus = 'Active';
            adminUser.isVerified = true;
            if (fullName) adminUser.fullName = fullName;
            if (phone) adminUser.phoneNumber = phone;
            if (password) adminUser.password = password;
            await adminUser.save();
        } else {
            if (!password) {
                return res.status(400).json({ success: false, message: 'password is required for new admin creation' });
            }

            adminUser = await User.create({
                fullName: fullName || username,
                username,
                email,
                password,
                phoneNumber: phone || '',
                role: 'ADMIN',
                isVerified: true,
                accountStatus: 'Active'
            });
        }

        req.setSuperAdminAction?.({
            description: `Created admin account for ${adminUser.username}`,
            targetType: 'USER',
            targetId: adminUser._id,
            metadata: {
                email: adminUser.email
            }
        });

        return res.status(201).json({
            success: true,
            message: 'Admin account is active',
            admin: formatAdminResponse(adminUser.toObject ? adminUser.toObject() : adminUser)
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            fullName,
            username,
            email,
            phone,
            accountStatus,
            isActive,
            password
        } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid admin id' });
        }

        const admin = await User.findById(id);
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }
        if (admin.role === 'SUPER_ADMIN') {
            return res.status(403).json({ success: false, message: 'SUPER_ADMIN cannot be updated with this endpoint' });
        }
        if (admin.role !== 'ADMIN') {
            return res.status(400).json({ success: false, message: 'Target user is not an admin' });
        }

        if (typeof username === 'string' && username.trim() && username !== admin.username) {
            const usernameTaken = await User.exists({ username, _id: { $ne: admin._id } });
            if (usernameTaken) {
                return res.status(409).json({ success: false, message: 'Username already in use' });
            }
            admin.username = username.trim();
        }

        if (typeof email === 'string' && email.trim() && email !== admin.email) {
            const emailTaken = await User.exists({ email, _id: { $ne: admin._id } });
            if (emailTaken) {
                return res.status(409).json({ success: false, message: 'Email already in use' });
            }
            admin.email = email.trim().toLowerCase();
        }

        if (typeof fullName === 'string') admin.fullName = fullName.trim();
        if (typeof phone === 'string') admin.phoneNumber = phone.trim();

        if (typeof accountStatus === 'string' && ['Active', 'Suspended', 'Deleted'].includes(accountStatus)) {
            admin.accountStatus = accountStatus;
        }

        if (typeof isActive === 'boolean') {
            admin.accountStatus = isActive ? 'Active' : 'Suspended';
        }

        if (typeof password === 'string' && password.trim()) {
            admin.password = password;
        }

        await admin.save();

        req.setSuperAdminAction?.({
            description: `Updated admin ${admin.username}`,
            targetType: 'USER',
            targetId: admin._id,
            metadata: {
                updatedFields: Object.keys(req.body || {})
            }
        });

        return res.json({
            success: true,
            message: 'Admin updated successfully',
            admin: formatAdminResponse(admin.toObject())
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.removeAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid admin id' });
        }

        const admin = await User.findById(id);
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }
        if (admin.role === 'SUPER_ADMIN') {
            return res.status(403).json({ success: false, message: 'Cannot remove SUPER_ADMIN' });
        }
        if (admin.role !== 'ADMIN') {
            return res.status(400).json({ success: false, message: 'Target user is not an admin' });
        }
        if (String(admin._id) === String(req.user._id)) {
            return res.status(400).json({ success: false, message: 'Super Admin cannot remove own account here' });
        }

        admin.role = 'USER';
        admin.accountStatus = 'Suspended';
        await admin.save();

        req.setSuperAdminAction?.({
            description: `Removed admin privileges from ${admin.username}`,
            targetType: 'USER',
            targetId: admin._id,
            metadata: {
                previousRole: 'ADMIN'
            }
        });

        return res.json({
            success: true,
            message: 'Admin access removed successfully'
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.toggleMaintenance = async (req, res) => {
    try {
        const { enabled, reason = '' } = req.body;

        const currentSetting = await Setting.findOne({ key: 'maintenanceMode' }).lean();
        const currentValue = Boolean(currentSetting?.value);
        const nextValue = typeof enabled === 'boolean' ? enabled : !currentValue;

        const updatedSetting = await Setting.findOneAndUpdate(
            { key: 'maintenanceMode' },
            {
                value: nextValue,
                updatedBy: req.user._id,
                updatedAt: new Date()
            },
            {
                upsert: true,
                new: true
            }
        ).lean();

        req.setSuperAdminAction?.({
            description: `Maintenance mode ${nextValue ? 'enabled' : 'disabled'}`,
            targetType: 'SYSTEM',
            targetId: 'maintenanceMode',
            metadata: {
                reason
            }
        });

        return res.json({
            success: true,
            maintenanceMode: Boolean(updatedSetting.value),
            updatedAt: updatedSetting.updatedAt
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.getSystemHealth = async (req, res) => {
    try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const [failedSubmissionsLastHourAgg, validationErrors] = await Promise.all([
            Submission.aggregate(buildSubmissionCountByUserRolePipeline({
                createdAt: { $gte: oneHourAgo },
                status: { $ne: 'accepted' }
            })),
            ValidationJob.countDocuments({
                createdAt: { $gte: oneHourAgo },
                $or: [
                    { result: 'FAILED' },
                    { status: 'FAILED_INTERNAL' }
                ]
            })
        ]);
        const failedSubmissionsLastHour = toCount(failedSubmissionsLastHourAgg);

        const totalMemory = os.totalmem();
        const usedMemory = totalMemory - os.freemem();
        const memoryUsage = Number(((usedMemory / Math.max(totalMemory, 1)) * 100).toFixed(2));
        const cpuUsage = calculateCpuUsage();

        const socketConnections = req.app.get('io')?.engine?.clientsCount || 0;
        const dbConnections = mongoose.connections.reduce((acc, conn) => acc + (conn.readyState === 1 ? 1 : 0), 0);
        const activeConnections = socketConnections + dbConnections;

        let serverStatus = 'HEALTHY';
        if (cpuUsage >= 90 || memoryUsage >= 92 || failedSubmissionsLastHour >= 300) {
            serverStatus = 'CRITICAL';
        } else if (cpuUsage >= 75 || memoryUsage >= 80 || failedSubmissionsLastHour >= 120) {
            serverStatus = 'DEGRADED';
        }

        return res.json({
            success: true,
            health: {
                cpuUsage,
                memoryUsage,
                activeConnections,
                serverStatus,
                failedSubmissionsLastHour,
                validationErrors
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAnalytics = async (req, res) => {
    try {
        const now = new Date();
        const monthsRange = buildPastMonthBuckets(12);
        const monthStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);

        const dayRange = buildPastDayBuckets(30);
        const dayStart = new Date(dayRange[0].key);

        const [
            userGrowthAgg,
            submissionTrendAgg,
            submissionSummaryAgg,
            failedSubmissionsLastHourAgg,
            validationErrorsLastHour,
            criticalEvents,
            publishedProblemStats
        ] = await Promise.all([
            User.aggregate([
                { $match: { role: 'USER', createdAt: { $gte: monthStart } } },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' }
                        },
                        total: { $sum: 1 }
                    }
                }
            ]),
            Submission.aggregate([
                { $match: { createdAt: { $gte: dayStart } } },
                ...buildSubmissionRoleLookupStages(USER_ROLE),
                {
                    $group: {
                        _id: {
                            date: {
                                $dateToString: {
                                    format: '%Y-%m-%d',
                                    date: '$createdAt'
                                }
                            },
                            status: '$status'
                        },
                        total: { $sum: 1 }
                    }
                }
            ]),
            Submission.aggregate([
                ...buildSubmissionRoleLookupStages(USER_ROLE),
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        accepted: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0]
                            }
                        }
                    }
                }
            ]),
            Submission.aggregate(buildSubmissionCountByUserRolePipeline({
                createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
                status: { $ne: 'accepted' }
            })),
            ValidationJob.countDocuments({
                createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
                $or: [
                    { result: 'FAILED' },
                    { status: 'FAILED_INTERNAL' }
                ]
            }),
            AuditLog.find({
                action: { $regex: 'EMERGENCY|MAINTENANCE|REMOVE_ADMIN|CREATE_ADMIN|UPDATE_ADMIN', $options: 'i' }
            })
                .populate('actor', 'username')
                .sort({ timestamp: -1 })
                .limit(10)
                .lean(),
            buildPublishedProblemStats()
        ]);
        const failedSubmissionsLastHour = toCount(failedSubmissionsLastHourAgg);

        const monthMap = new Map();
        userGrowthAgg.forEach((row) => {
            const key = `${row._id.year}-${String(row._id.month).padStart(2, '0')}`;
            monthMap.set(key, row.total);
        });

        const userGrowth = monthsRange.map((bucket) => ({
            month: bucket.label,
            year: bucket.year,
            users: monthMap.get(bucket.key) || 0
        }));

        const dayMap = new Map();
        submissionTrendAgg.forEach((row) => {
            const dateKey = row._id.date;
            const current = dayMap.get(dateKey) || { accepted: 0, failed: 0, total: 0 };
            current.total += row.total;
            if (row._id.status === 'accepted') {
                current.accepted += row.total;
            } else {
                current.failed += row.total;
            }
            dayMap.set(dateKey, current);
        });

        const submissionTrend = dayRange.map((bucket) => {
            const data = dayMap.get(bucket.key) || { accepted: 0, failed: 0, total: 0 };
            return {
                date: bucket.label,
                accepted: data.accepted,
                failed: data.failed,
                total: data.total
            };
        });

        const problemDifficultyDistribution = [
            { name: 'Easy', value: publishedProblemStats.difficulty.easy || 0 },
            { name: 'Medium', value: publishedProblemStats.difficulty.medium || 0 },
            { name: 'Hard', value: publishedProblemStats.difficulty.hard || 0 }
        ];

        const totalSubmissions = submissionSummaryAgg?.[0]?.total || 0;
        const acceptedSubmissions = submissionSummaryAgg?.[0]?.accepted || 0;
        const acceptanceRate = totalSubmissions > 0
            ? Number(((acceptedSubmissions / totalSubmissions) * 100).toFixed(2))
            : 0;

        const cpuUsage = calculateCpuUsage();
        const memoryUsage = Number((((os.totalmem() - os.freemem()) / Math.max(os.totalmem(), 1)) * 100).toFixed(2));
        const healthPenalty = Math.min(35, failedSubmissionsLastHour * 0.2)
            + Math.min(20, validationErrorsLastHour * 0.8)
            + Math.min(25, cpuUsage / 4)
            + Math.min(20, memoryUsage / 5);
        const platformHealthScore = Number(Math.max(0, 100 - healthPenalty).toFixed(2));

        const alerts = [];
        if (failedSubmissionsLastHour > 120) {
            alerts.push({
                type: 'critical',
                code: 'FAILED_SUBMISSION_SPIKE',
                message: `Failed submissions in last hour: ${failedSubmissionsLastHour}`
            });
        }
        if (validationErrorsLastHour > 30) {
            alerts.push({
                type: 'critical',
                code: 'VALIDATION_SPIKE',
                message: `Validation errors in last hour: ${validationErrorsLastHour}`
            });
        }
        if (alerts.length === 0) {
            alerts.push({
                type: 'info',
                code: 'SYSTEM_STABLE',
                message: 'No critical alerts detected in the latest health window.'
            });
        }

        return res.json({
            success: true,
            analytics: {
                userGrowth,
                submissionTrend,
                problemDifficultyDistribution,
                acceptanceMetrics: {
                    totalSubmissions,
                    acceptedSubmissions,
                    acceptanceRate
                },
                publishedProblemStats,
                platformHealthScore,
                alerts,
                recentCriticalEvents: criticalEvents.map((event) => ({
                    id: event._id,
                    action: event.action,
                    target: event.target,
                    actor: event.actor?.username || 'SYSTEM',
                    ipAddress: event.ipAddress || 'UNKNOWN',
                    timestamp: event.timestamp
                }))
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
