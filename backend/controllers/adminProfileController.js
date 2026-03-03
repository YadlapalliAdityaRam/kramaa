const os = require('os');
const AuditLog = require('../models/AuditLog');
const CommentReport = require('../models/CommentReport');
const Report = require('../models/Report');
const Problem = require('../models/Problem');
const Setting = require('../models/Setting');
const Submission = require('../models/Submission');
const User = require('../models/User');
const auditLogger = require('../services/auditLogger');
const {
    ADMIN_PERMISSION_KEYS,
    ADMIN_PERMISSION_TEMPLATES,
    buildEffectivePermissions,
    ensureAdminProfile
} = require('../services/adminProfileService');
const { buildPublishedProblemStats } = require('../services/problemStatsService');

const parsePositiveInt = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return parsed;
};

const toFixedNumber = (value, decimals = 2) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 0;
    return Number(parsed.toFixed(decimals));
};

const toCount = (aggregateResult) => aggregateResult?.[0]?.count || 0;

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

const getCpuUsage = () => {
    const cpuCount = Math.max(1, os.cpus()?.length || 1);
    const loadAvg = os.loadavg()[0];
    const usage = (loadAvg / cpuCount) * 100;
    return Number(Math.max(0, Math.min(100, usage)).toFixed(2));
};

const normalizePermissionPayload = (payload = {}) => {
    const normalized = {};
    ADMIN_PERMISSION_KEYS.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(payload, key)) {
            normalized[key] = Boolean(payload[key]);
        }
    });
    return normalized;
};

const buildModulesAccess = (permissions) => ([
    {
        module: 'Problem Management',
        allowed: Boolean(permissions.createProblem || permissions.editProblem || permissions.publishProblem || permissions.deleteProblem)
    },
    {
        module: 'User Management',
        allowed: Boolean(permissions.manageUsers || permissions.banUser)
    },
    {
        module: 'Submission Moderation',
        allowed: Boolean(permissions.reviewSubmissions || permissions.overrideVerdict)
    },
    {
        module: 'Contest Operations',
        allowed: Boolean(permissions.manageContests)
    },
    {
        module: 'Audit Logs',
        allowed: Boolean(permissions.viewAuditLogs)
    },
    {
        module: 'System Settings',
        allowed: Boolean(permissions.manageSettings || permissions.manageServers)
    },
    {
        module: 'Ranking Controls',
        allowed: Boolean(permissions.recalculateLeaderboard)
    }
]);

const toAdminProfileResponse = (adminUser) => {
    const { adminRole, permissions } = buildEffectivePermissions(adminUser);
    const loginHistory = (adminUser.loginHistory || []).slice(-20).reverse();
    const fallbackLastLogin = loginHistory.length > 0 ? loginHistory[0]?.timestamp : null;

    return {
        _id: adminUser._id,
        adminId: adminUser.adminId,
        fullName: adminUser.fullName || adminUser.username,
        username: adminUser.username,
        email: adminUser.email,
        isEmailVerified: Boolean(adminUser.isVerified),
        phone: adminUser.phoneNumber || '',
        profilePhoto: adminUser.avatar || '',
        role: adminUser.role,
        adminRole,
        accountStatus: adminUser.accountStatus || 'Active',
        isActive: (adminUser.accountStatus || 'Active') === 'Active',
        createdAt: adminUser.createdAt,
        lastLogin: adminUser.lastLogin || fallbackLastLogin || null,
        permissions,
        modulesAccess: buildModulesAccess(permissions),
        twoFactorEnabled: Boolean(adminUser.twoFactorEnabled),
        failedLoginAttempts: adminUser.failedLoginAttempts || 0,
        lastFailedLoginAt: adminUser.lastFailedLoginAt || null,
        loginHistory
    };
};

const buildPastDayBuckets = (days) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const buckets = [];

    for (let offset = days - 1; offset >= 0; offset -= 1) {
        const day = new Date(now);
        day.setDate(now.getDate() - offset);
        buckets.push({
            key: day.toISOString().slice(0, 10),
            label: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        });
    }

    return buckets;
};

exports.getAdminProfile = async (req, res) => {
    try {
        const adminUser = await ensureAdminProfile(req.user._id);
        if (!adminUser) {
            return res.status(404).json({ success: false, message: 'Admin user not found' });
        }

        const [recentActivity] = await Promise.all([
            AuditLog.find({ actor: adminUser._id })
                .sort({ timestamp: -1 })
                .limit(20)
                .lean()
        ]);

        return res.json({
            success: true,
            profile: toAdminProfileResponse(adminUser),
            recentActivity
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateAdminProfile = async (req, res) => {
    try {
        const adminUser = await ensureAdminProfile(req.user._id);
        if (!adminUser) {
            return res.status(404).json({ success: false, message: 'Admin user not found' });
        }

        const updatedFields = [];
        const { fullName, phone, profilePhoto, adminRole, permissions } = req.body || {};

        if (typeof fullName === 'string') {
            adminUser.fullName = fullName.trim();
            updatedFields.push('fullName');
        }

        if (typeof phone === 'string') {
            adminUser.phoneNumber = phone.trim();
            updatedFields.push('phoneNumber');
        }

        if (typeof profilePhoto === 'string') {
            adminUser.avatar = profilePhoto.trim();
            updatedFields.push('avatar');
        }

        if (typeof adminRole === 'string' && req.user.role === 'SUPER_ADMIN') {
            if (!ADMIN_PERMISSION_TEMPLATES[adminRole]) {
                return res.status(400).json({ success: false, message: 'Invalid admin role template' });
            }
            adminUser.adminRole = adminRole;
            adminUser.adminPermissions = {
                ...ADMIN_PERMISSION_TEMPLATES[adminRole],
                ...normalizePermissionPayload(permissions || {})
            };
            updatedFields.push('adminRole', 'adminPermissions');
        } else if (permissions && typeof permissions === 'object') {
            if (req.user.role !== 'SUPER_ADMIN') {
                return res.status(403).json({ success: false, message: 'Only SUPER_ADMIN can update permission matrix' });
            }
            const current = buildEffectivePermissions(adminUser).permissions;
            adminUser.adminPermissions = {
                ...current,
                ...normalizePermissionPayload(permissions)
            };
            updatedFields.push('adminPermissions');
        }

        await adminUser.save();
        await ensureAdminProfile(adminUser);

        await auditLogger.log(
            req.user._id,
            'ADMIN_PROFILE_UPDATE',
            'ADMIN_PROFILE',
            { updatedFields },
            req.ip
        );

        return res.json({
            success: true,
            message: 'Admin profile updated',
            profile: toAdminProfileResponse(adminUser)
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAdminDashboard = async (req, res) => {
    try {
        const adminUser = await ensureAdminProfile(req.user._id);
        if (!adminUser) {
            return res.status(404).json({ success: false, message: 'Admin user not found' });
        }

        const adminId = adminUser._id;
        const last14DayBuckets = buildPastDayBuckets(14);
        const trendStartDate = new Date(`${last14DayBuckets[0].key}T00:00:00.000Z`);
        const activeWindow = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const [
            totalProblemsCreated,
            pendingProblemsUnpublished,
            pendingProblemsPublishedConflict,
            commentReportsResolved,
            commentReportsPending,
            contentReportsResolved,
            contentReportsPending,
            activeUsers,
            totalSubmissionsAgg,
            acceptedSubmissionsAgg,
            failedSubmissionsLastHourAgg,
            submissionTrendAgg,
            avgReviewAgg,
            publishedProblemStats
        ] = await Promise.all([
            Problem.countDocuments({ createdBy: adminId }),
            Problem.countDocuments({
                createdBy: adminId,
                approvalStatus: 'PENDING',
                isPublished: { $ne: true },
                status: { $nin: ['published', 'PUBLISHED'] }
            }),
            Problem.countDocuments({
                createdBy: adminId,
                approvalStatus: 'PENDING',
                $or: [
                    { isPublished: true },
                    { status: { $in: ['published', 'PUBLISHED'] } }
                ]
            }),
            CommentReport.countDocuments({ status: { $in: ['reviewed', 'dismissed'] } }),
            CommentReport.countDocuments({ status: 'pending' }),
            Report.countDocuments({ status: { $in: ['reviewed', 'rejected', 'resolved', 'action_taken'] } }),
            Report.countDocuments({ status: 'pending' }),
            User.countDocuments({
                role: 'USER',
                accountStatus: 'Active',
                lastLogin: { $gte: activeWindow }
            }),
            Submission.aggregate(buildSubmissionCountByUserRolePipeline({ createdAt: { $gte: trendStartDate } })),
            Submission.aggregate(buildSubmissionCountByUserRolePipeline({ createdAt: { $gte: trendStartDate }, status: 'accepted' })),
            Submission.aggregate(buildSubmissionCountByUserRolePipeline({
                createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
                status: { $ne: 'accepted' }
            })),
            Submission.aggregate([
                { $match: { createdAt: { $gte: trendStartDate } } },
                ...buildSubmissionRoleLookupStages(USER_ROLE),
                {
                    $group: {
                        _id: {
                            date: {
                                $dateToString: {
                                    format: '%Y-%m-%d',
                                    date: '$createdAt'
                                }
                            }
                        },
                        total: { $sum: 1 },
                        accepted: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0]
                            }
                        }
                    }
                }
            ]),
            Problem.aggregate([
                {
                    $match: {
                        approvedBy: adminId,
                        publishedAt: { $type: 'date' }
                    }
                },
                {
                    $project: {
                        reviewMinutes: {
                            $divide: [{ $subtract: ['$publishedAt', '$createdAt'] }, 1000 * 60]
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        avgReviewMinutes: { $avg: '$reviewMinutes' }
                    }
                }
            ]),
            buildPublishedProblemStats({ createdBy: adminId })
        ]);
        const totalProblemsPublished = publishedProblemStats.totalProblems || 0;
        const pendingProblems = Number(pendingProblemsUnpublished || 0);
        // Align top-level report cards with /api/reports/admin (Report model).
        // CommentReport counters are still returned in breakdown fields.
        const reportsResolved = Number(contentReportsResolved || 0);
        const pendingReports = Number(contentReportsPending || 0);
        const totalSubmissions = toCount(totalSubmissionsAgg);
        const acceptedSubmissions = toCount(acceptedSubmissionsAgg);
        const failedSubmissionsLastHour = toCount(failedSubmissionsLastHourAgg);

        const acceptanceRate = totalSubmissions > 0
            ? toFixedNumber((acceptedSubmissions / totalSubmissions) * 100, 2)
            : 0;

        const trendMap = new Map(
            submissionTrendAgg.map((row) => [row._id.date, row])
        );
        const submissionTrend = last14DayBuckets.map((bucket) => {
            const row = trendMap.get(bucket.key);
            return {
                date: bucket.label,
                total: row?.total || 0,
                accepted: row?.accepted || 0
            };
        });

        const problemDifficultyDistribution = [
            { name: 'Easy', value: publishedProblemStats.difficulty.easy || 0 },
            { name: 'Medium', value: publishedProblemStats.difficulty.medium || 0 },
            { name: 'Hard', value: publishedProblemStats.difficulty.hard || 0 }
        ];

        const cpuUsage = getCpuUsage();
        const totalMemory = os.totalmem();
        const usedMemory = totalMemory - os.freemem();
        const memoryUsage = Number(((usedMemory / Math.max(totalMemory, 1)) * 100).toFixed(2));
        const serverStatus = cpuUsage > 85 || memoryUsage > 90 ? 'DEGRADED' : 'HEALTHY';

        const alerts = [];
        if (serverStatus !== 'HEALTHY') {
            alerts.push({
                type: 'critical',
                code: 'SERVER_DEGRADED',
                message: `Server health is ${serverStatus}. CPU ${cpuUsage}% / Memory ${memoryUsage}%`
            });
        }
        if (pendingProblems >= 10) {
            alerts.push({
                type: 'warning',
                code: 'PENDING_PROBLEMS_HIGH',
                message: `Pending problems require review: ${pendingProblems}`
            });
        }
        if (pendingReports >= 20) {
            alerts.push({
                type: 'warning',
                code: 'PENDING_REPORTS_HIGH',
                message: `Pending reports queue is high: ${pendingReports}`
            });
        }
        if (failedSubmissionsLastHour >= 100) {
            alerts.push({
                type: 'critical',
                code: 'FAILED_SUBMISSIONS_SPIKE',
                message: `Failed submissions in last hour: ${failedSubmissionsLastHour}`
            });
        }
        if (alerts.length === 0) {
            alerts.push({
                type: 'info',
                code: 'SYSTEM_STABLE',
                message: 'No critical admin alerts in the latest window.'
            });
        }

        return res.json({
            success: true,
            dashboard: {
                stats: {
                    totalProblemsCreated,
                    totalProblemsPublished,
                    pendingProblems,
                    reportsResolved,
                    pendingReports,
                    pendingProblemPublishedConflict: Number(pendingProblemsPublishedConflict || 0),
                    pendingReportsBreakdown: {
                        commentReports: Number(commentReportsPending || 0),
                        contentReports: Number(contentReportsPending || 0)
                    },
                    resolvedReportsBreakdown: {
                        commentReports: Number(commentReportsResolved || 0),
                        contentReports: Number(contentReportsResolved || 0)
                    },
                    averageReviewMinutes: toFixedNumber(avgReviewAgg?.[0]?.avgReviewMinutes || 0, 2),
                    activeUsers,
                    submissionsLast14Days: totalSubmissions,
                    acceptanceRate,
                    failedSubmissionsLastHour
                },
                charts: {
                    submissionTrend,
                    problemDifficultyDistribution
                },
                serverHealth: {
                    cpuUsage,
                    memoryUsage,
                    status: serverStatus
                },
                alerts
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAdminActivity = async (req, res) => {
    try {
        const adminUser = await ensureAdminProfile(req.user._id);
        if (!adminUser) {
            return res.status(404).json({ success: false, message: 'Admin user not found' });
        }

        const page = parsePositiveInt(req.query.page, 1);
        const limit = Math.min(parsePositiveInt(req.query.limit, 20), 100);

        const [logs, total] = await Promise.all([
            AuditLog.find({ actor: adminUser._id })
                .sort({ timestamp: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            AuditLog.countDocuments({ actor: adminUser._id })
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

exports.getAdminSecurity = async (req, res) => {
    try {
        const adminUser = await ensureAdminProfile(req.user._id);
        if (!adminUser) {
            return res.status(404).json({ success: false, message: 'Admin user not found' });
        }

        const [sessionTimeoutSetting] = await Promise.all([
            Setting.findOne({ key: 'sessionTimeoutMinutes' }).lean()
        ]);

        return res.json({
            success: true,
            security: {
                twoFactorEnabled: Boolean(adminUser.twoFactorEnabled),
                failedLoginAttempts: adminUser.failedLoginAttempts || 0,
                lastFailedLoginAt: adminUser.lastFailedLoginAt || null,
                lastLogin: adminUser.lastLogin || null,
                loginHistory: (adminUser.loginHistory || []).slice(-20).reverse(),
                sessionTimeoutMinutes: Number(sessionTimeoutSetting?.value || 60)
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateAdminSecurity = async (req, res) => {
    try {
        const adminUser = await ensureAdminProfile(req.user._id);
        if (!adminUser) {
            return res.status(404).json({ success: false, message: 'Admin user not found' });
        }

        const updatedFields = [];
        const { twoFactorEnabled, sessionTimeoutMinutes } = req.body || {};

        if (typeof twoFactorEnabled === 'boolean') {
            adminUser.twoFactorEnabled = twoFactorEnabled;
            updatedFields.push('twoFactorEnabled');
        }

        if (sessionTimeoutMinutes !== undefined && req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ success: false, message: 'Only SUPER_ADMIN can change session timeout' });
        }

        if (sessionTimeoutMinutes !== undefined && req.user.role === 'SUPER_ADMIN') {
            const timeout = parsePositiveInt(sessionTimeoutMinutes, 60);
            await Setting.findOneAndUpdate(
                { key: 'sessionTimeoutMinutes' },
                { value: timeout, updatedBy: req.user._id, updatedAt: new Date() },
                { upsert: true, new: true }
            );
            updatedFields.push('sessionTimeoutMinutes');
        }

        await adminUser.save();
        await auditLogger.log(
            req.user._id,
            'ADMIN_SECURITY_UPDATE',
            'ADMIN_SECURITY',
            { updatedFields },
            req.ip
        );

        return res.json({
            success: true,
            message: 'Security settings updated',
            security: {
                twoFactorEnabled: Boolean(adminUser.twoFactorEnabled),
                failedLoginAttempts: adminUser.failedLoginAttempts || 0,
                lastFailedLoginAt: adminUser.lastFailedLoginAt || null,
                lastLogin: adminUser.lastLogin || null,
                loginHistory: (adminUser.loginHistory || []).slice(-20).reverse()
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.forceLogoutAllDevices = async (req, res) => {
    try {
        const adminUser = await ensureAdminProfile(req.user._id);
        if (!adminUser) {
            return res.status(404).json({ success: false, message: 'Admin user not found' });
        }

        adminUser.sessionInvalidatedAt = new Date();
        await adminUser.save();

        await auditLogger.log(
            req.user._id,
            'ADMIN_FORCE_LOGOUT_ALL',
            'ADMIN_SECURITY',
            { adminId: adminUser.adminId },
            req.ip
        );

        return res.json({
            success: true,
            message: 'All active sessions were revoked. Please sign in again on all devices.'
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
