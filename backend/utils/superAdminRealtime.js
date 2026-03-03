const SUPER_ADMIN_ROOM = 'superadmin-room';
const SUPER_ADMIN_REFRESH_EVENT = 'superadmin:refresh';

const normalizeSections = (sections) => {
    if (!Array.isArray(sections)) return [];
    return [...new Set(sections
        .map((section) => String(section || '').trim().toLowerCase())
        .filter(Boolean))];
};

const emitSuperAdminRefresh = (appOrReq, payload = {}) => {
    const app = appOrReq?.app || appOrReq;
    const io = app?.get?.('io');
    if (!io) return;

    const sections = normalizeSections(payload.sections);

    io.to(SUPER_ADMIN_ROOM).emit(SUPER_ADMIN_REFRESH_EVENT, {
        sections,
        source: payload.source || 'system',
        method: payload.method || null,
        statusCode: payload.statusCode || null,
        at: new Date().toISOString()
    });
};

module.exports = {
    SUPER_ADMIN_ROOM,
    SUPER_ADMIN_REFRESH_EVENT,
    emitSuperAdminRefresh
};
