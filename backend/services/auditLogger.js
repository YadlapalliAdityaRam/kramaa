const AuditLog = require('../models/AuditLog');

const log = async (actorId, action, target, details = {}, ipAddress = null) => {
    try {
        await AuditLog.create({
            actor: actorId,
            action,
            target,
            details,
            ipAddress
        });
    } catch (error) {
        console.error('Audit Log Error:', error);
        // We don't want to crash the request if logging fails, but we should know about it
    }
};

module.exports = { log };
