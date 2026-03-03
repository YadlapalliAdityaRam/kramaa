const ADMIN_ROOM = 'admin-room';
const ADMIN_REFRESH_EVENT = 'admin:refresh';

const normalizeSections = (sections) => {
    if (!Array.isArray(sections)) return [];
    return [...new Set(sections
        .map((section) => String(section || '').trim().toLowerCase())
        .filter(Boolean))];
};

const emitAdminRefresh = (appOrReq, payload = {}) => {
    const app = appOrReq?.app || appOrReq;
    const io = app?.get?.('io');
    if (!io) return;

    const sections = normalizeSections(payload.sections);

    io.to(ADMIN_ROOM).emit(ADMIN_REFRESH_EVENT, {
        sections,
        source: payload.source || 'system',
        method: payload.method || null,
        statusCode: payload.statusCode || null,
        at: new Date().toISOString()
    });
};

module.exports = {
    ADMIN_ROOM,
    ADMIN_REFRESH_EVENT,
    emitAdminRefresh
};
