const {
    ensureSuperAdminProfile,
    getClientDevice,
    getClientIp,
    recordSuperAdminAction
} = require('../services/superAdminService');

const superAdminActionLogger = (defaultActionType, defaults = {}) => {
    return (req, res, next) => {
        if (!req.user || req.user.role !== 'SUPER_ADMIN') {
            return next();
        }

        let actionPayload = {
            actionType: defaultActionType,
            description: defaults.description || `${defaultActionType} completed`,
            targetType: defaults.targetType || 'SYSTEM',
            targetId: defaults.targetId || null,
            metadata: defaults.metadata || {}
        };

        req.setSuperAdminAction = (payload = {}) => {
            actionPayload = {
                ...actionPayload,
                ...payload,
                metadata: {
                    ...(actionPayload.metadata || {}),
                    ...(payload.metadata || {})
                }
            };
        };

        res.once('finish', async () => {
            if (res.statusCode >= 400 || !actionPayload?.actionType) {
                return;
            }

            try {
                await ensureSuperAdminProfile(req.user);
                await recordSuperAdminAction({
                    superAdminId: req.user._id,
                    actionType: actionPayload.actionType,
                    description: actionPayload.description,
                    targetId: actionPayload.targetId,
                    targetType: actionPayload.targetType,
                    metadata: actionPayload.metadata,
                    ip: getClientIp(req),
                    device: getClientDevice(req),
                    timestamp: new Date()
                });
            } catch (error) {
                console.error('Super Admin action logger failed:', error.message);
            }
        });

        next();
    };
};

module.exports = superAdminActionLogger;
