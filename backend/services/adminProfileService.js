const User = require('../models/User');

const normalizeRole = (role) => String(role || '').trim().toUpperCase();

const ADMIN_PERMISSION_KEYS = [
    'createProblem',
    'editProblem',
    'deleteProblem',
    'publishProblem',
    'banUser',
    'manageUsers',
    'reviewSubmissions',
    'overrideVerdict',
    'manageContests',
    'viewAuditLogs',
    'manageSettings',
    'manageServers',
    'recalculateLeaderboard'
];

const ADMIN_PERMISSION_TEMPLATES = {
    SUPER_ADMIN: {
        createProblem: true,
        editProblem: true,
        deleteProblem: true,
        publishProblem: true,
        banUser: true,
        manageUsers: true,
        reviewSubmissions: true,
        overrideVerdict: true,
        manageContests: true,
        viewAuditLogs: true,
        manageSettings: true,
        manageServers: true,
        recalculateLeaderboard: true
    },
    ADMIN: {
        createProblem: true,
        editProblem: true,
        deleteProblem: false,
        publishProblem: true,
        banUser: false,
        manageUsers: false,
        reviewSubmissions: true,
        overrideVerdict: false,
        manageContests: true,
        viewAuditLogs: true,
        manageSettings: false,
        manageServers: false,
        recalculateLeaderboard: false
    },
    PROBLEM_ADMIN: {
        createProblem: true,
        editProblem: true,
        deleteProblem: true,
        publishProblem: true,
        banUser: false,
        manageUsers: false,
        reviewSubmissions: true,
        overrideVerdict: false,
        manageContests: true,
        viewAuditLogs: true,
        manageSettings: false,
        manageServers: false,
        recalculateLeaderboard: false
    },
    USER_ADMIN: {
        createProblem: false,
        editProblem: false,
        deleteProblem: false,
        publishProblem: false,
        banUser: true,
        manageUsers: true,
        reviewSubmissions: true,
        overrideVerdict: true,
        manageContests: false,
        viewAuditLogs: true,
        manageSettings: false,
        manageServers: false,
        recalculateLeaderboard: false
    },
    MODERATOR: {
        createProblem: false,
        editProblem: false,
        deleteProblem: false,
        publishProblem: false,
        banUser: false,
        manageUsers: false,
        reviewSubmissions: true,
        overrideVerdict: true,
        manageContests: false,
        viewAuditLogs: true,
        manageSettings: false,
        manageServers: false,
        recalculateLeaderboard: false
    }
};

const isElevatedRole = (role) => ['ADMIN', 'SUPER_ADMIN'].includes(normalizeRole(role));

const getDefaultAdminRole = (user) => {
    if (normalizeRole(user.role) === 'SUPER_ADMIN') return 'SUPER_ADMIN';
    if (user.adminRole && ADMIN_PERMISSION_TEMPLATES[user.adminRole]) return user.adminRole;
    return 'ADMIN';
};

const toPlainPermissionObject = (permissions) => {
    if (!permissions) return {};
    if (permissions instanceof Map) {
        return Object.fromEntries(permissions.entries());
    }
    if (typeof permissions.toObject === 'function') {
        return permissions.toObject();
    }
    return { ...permissions };
};

const normalizePermissionObject = (permissions = {}) => {
    const normalized = {};
    ADMIN_PERMISSION_KEYS.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(permissions, key)) {
            normalized[key] = Boolean(permissions[key]);
        }
    });
    return normalized;
};

const getDefaultPermissions = (adminRole) => {
    return { ...(ADMIN_PERMISSION_TEMPLATES[adminRole] || ADMIN_PERMISSION_TEMPLATES.ADMIN) };
};

const buildEffectivePermissions = (user) => {
    const adminRole = getDefaultAdminRole(user);
    const defaults = getDefaultPermissions(adminRole);
    const stored = normalizePermissionObject(toPlainPermissionObject(user.adminPermissions));
    return {
        adminRole,
        permissions: {
            ...defaults,
            ...stored
        }
    };
};

const generateAdminId = (user) => {
    const prefix = normalizeRole(user.role) === 'SUPER_ADMIN' ? 'SA' : 'AD';
    return `${prefix}-${String(user._id).slice(-6).toUpperCase()}`;
};

const ensureAdminProfile = async (userOrId) => {
    let adminUser = userOrId;
    if (!adminUser || !adminUser._id) {
        adminUser = await User.findById(userOrId);
    }
    if (!adminUser) return adminUser;

    const normalizedRole = normalizeRole(adminUser.role);
    let shouldSave = false;

    if (['USER', 'ADMIN', 'SUPER_ADMIN'].includes(normalizedRole) && adminUser.role !== normalizedRole) {
        adminUser.role = normalizedRole;
        shouldSave = true;
    }

    if (!isElevatedRole(adminUser.role)) {
        if (shouldSave && typeof adminUser.save === 'function') {
            await adminUser.save();
        }
        return adminUser;
    }

    shouldSave = Boolean(shouldSave);

    if (!adminUser.adminId) {
        adminUser.adminId = generateAdminId(adminUser);
        shouldSave = true;
    }

    const { adminRole, permissions } = buildEffectivePermissions(adminUser);

    if (adminUser.adminRole !== adminRole) {
        adminUser.adminRole = adminRole;
        shouldSave = true;
    }

    const currentPermissions = normalizePermissionObject(toPlainPermissionObject(adminUser.adminPermissions));
    const permissionMismatch = ADMIN_PERMISSION_KEYS.some((key) => currentPermissions[key] !== permissions[key]);
    if (permissionMismatch) {
        adminUser.adminPermissions = permissions;
        shouldSave = true;
    }

    if (typeof adminUser.twoFactorEnabled !== 'boolean') {
        adminUser.twoFactorEnabled = false;
        shouldSave = true;
    }

    if (!Array.isArray(adminUser.loginHistory)) {
        adminUser.loginHistory = [];
        shouldSave = true;
    }

    if (typeof adminUser.failedLoginAttempts !== 'number') {
        adminUser.failedLoginAttempts = 0;
        shouldSave = true;
    }

    if (shouldSave && typeof adminUser.save === 'function') {
        await adminUser.save();
    }

    return adminUser;
};

const appendAdminLoginHistory = async (userOrId, context = {}) => {
    const adminUser = await ensureAdminProfile(userOrId);
    if (!adminUser || !isElevatedRole(adminUser.role)) return adminUser;

    const timestamp = context.timestamp ? new Date(context.timestamp) : new Date();
    const nextEntry = {
        ip: context.ip || '',
        device: context.device || 'Unknown device',
        timestamp: Number.isNaN(timestamp.getTime()) ? new Date() : timestamp
    };

    const existingHistory = Array.isArray(adminUser.loginHistory) ? adminUser.loginHistory : [];
    adminUser.loginHistory = [...existingHistory, nextEntry].slice(-50);
    await adminUser.save();
    return adminUser;
};

module.exports = {
    ADMIN_PERMISSION_KEYS,
    ADMIN_PERMISSION_TEMPLATES,
    buildEffectivePermissions,
    ensureAdminProfile,
    appendAdminLoginHistory,
    isElevatedRole,
    normalizeRole
};
