const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
const SuperAdmin = require('../models/SuperAdmin');

const MAX_LOGIN_HISTORY = 50;
const MAX_ACTION_HISTORY = 500;

const getClientIp = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.trim()) {
        return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket?.remoteAddress || 'UNKNOWN';
};

const getClientDevice = (req) => req.get('user-agent') || 'UNKNOWN';

const normalizeObjectId = (value) => {
    if (!value) return null;
    if (value instanceof mongoose.Types.ObjectId) return value;
    if (typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)) {
        return new mongoose.Types.ObjectId(value);
    }
    return null;
};

const ensureSuperAdminProfile = async (user) => {
    if (!user || !user._id) {
        throw new Error('Missing user payload for Super Admin profile sync');
    }

    const superAdminId = normalizeObjectId(user._id);
    if (!superAdminId) {
        throw new Error('Invalid Super Admin user id');
    }

    const isAccountActive = user.accountStatus ? user.accountStatus === 'Active' : user.isActive !== false;

    const update = {
        $set: {
            fullName: user.fullName || user.username,
            username: user.username,
            email: user.email,
            phone: user.phoneNumber || '',
            profileImage: user.avatar || '',
            role: user.role || 'SUPER_ADMIN',
            isActive: isAccountActive
        },
        $setOnInsert: {
            permissions: ['ALL'],
            loginHistory: [],
            actionsPerformed: []
        }
    };

    return SuperAdmin.findByIdAndUpdate(
        superAdminId,
        update,
        {
            new: true,
            upsert: true,
            runValidators: true
        }
    );
};

const appendSuperAdminLogin = async (user, context = {}) => {
    const profile = await ensureSuperAdminProfile(user);
    const timestamp = context.timestamp ? new Date(context.timestamp) : new Date();

    return SuperAdmin.findByIdAndUpdate(
        profile._id,
        {
            $set: { lastLogin: timestamp },
            $push: {
                loginHistory: {
                    $each: [{
                        ip: context.ip || 'UNKNOWN',
                        device: context.device || 'UNKNOWN',
                        timestamp
                    }],
                    $slice: -MAX_LOGIN_HISTORY
                }
            }
        },
        { new: true }
    );
};

const recordSuperAdminAction = async ({
    superAdminId,
    actionType,
    description,
    targetId = null,
    targetType = 'SYSTEM',
    ip = 'UNKNOWN',
    device = 'UNKNOWN',
    metadata = {},
    timestamp = new Date()
}) => {
    const normalizedId = normalizeObjectId(superAdminId);
    if (!normalizedId) {
        throw new Error('Invalid Super Admin id for audit action');
    }

    const action = {
        actionType,
        description,
        targetId: targetId ? String(targetId) : null,
        targetType,
        ip,
        device,
        metadata,
        timestamp
    };

    await SuperAdmin.findByIdAndUpdate(
        normalizedId,
        {
            $push: {
                actionsPerformed: {
                    $each: [action],
                    $slice: -MAX_ACTION_HISTORY
                }
            }
        },
        { new: false }
    );

    await AuditLog.create({
        actor: normalizedId,
        action: actionType,
        target: targetType,
        details: {
            description,
            targetId: targetId ? String(targetId) : null,
            device,
            metadata
        },
        ipAddress: ip,
        timestamp
    });

    return action;
};

module.exports = {
    appendSuperAdminLogin,
    ensureSuperAdminProfile,
    getClientDevice,
    getClientIp,
    recordSuperAdminAction
};
