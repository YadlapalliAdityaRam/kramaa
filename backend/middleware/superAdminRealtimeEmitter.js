const { emitSuperAdminRefresh } = require('../utils/superAdminRealtime');
const { emitAdminRefresh } = require('../utils/adminRealtime');

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const getPathWithoutQuery = (url = '') => String(url || '').split('?')[0];
const isSubmissionSubmitPath = (path = '') => String(path || '').startsWith('/api/submissions/submit');
const isAuthLoginPath = (path = '') => String(path || '') === '/api/auth/login';
const isDoubtReportPath = (path = '') => {
    const normalized = String(path || '');
    return normalized.startsWith('/api/doubts') && normalized.includes('/report');
};
const isReportPath = (path = '') => String(path || '').startsWith('/api/reports');

const resolveRefreshSections = (method, path) => {
    if (!MUTATION_METHODS.has(method)) return [];

    if (path === '/api/auth/register') {
        return ['stats', 'analytics'];
    }

    if (isAuthLoginPath(path)) {
        return ['stats', 'analytics'];
    }

    if (isSubmissionSubmitPath(path)) {
        return ['stats', 'analytics', 'health'];
    }

    if (isDoubtReportPath(path) || isReportPath(path)) {
        return ['stats', 'analytics'];
    }

    if (path.startsWith('/api/superadmin/create-admin')
        || path.startsWith('/api/superadmin/update-admin')
        || path.startsWith('/api/superadmin/remove-admin')) {
        return ['profile', 'stats', 'admins', 'audit', 'analytics'];
    }

    if (path.startsWith('/api/superadmin/toggle-maintenance')) {
        return ['profile', 'settings', 'health', 'audit', 'analytics'];
    }

    if (method === 'PUT' && path.startsWith('/api/settings/')) {
        return ['settings', 'health', 'analytics'];
    }

    if (path.startsWith('/api/problems')) {
        if (path.includes('/react') || path.includes('/like')) return [];
        return ['stats', 'analytics'];
    }

    if (path.startsWith('/api/contests')) {
        return ['stats', 'analytics'];
    }

    if (path.startsWith('/api/tickets')) {
        return ['profile', 'stats', 'audit', 'analytics'];
    }

    if (path.startsWith('/api/admin')) {
        return ['stats', 'admins', 'audit', 'analytics'];
    }

    return [];
};

const resolveAdminRefreshSections = (method, path) => {
    if (!MUTATION_METHODS.has(method)) return [];

    if (isAuthLoginPath(path)) {
        return ['dashboard'];
    }

    if (isSubmissionSubmitPath(path)) {
        return ['dashboard'];
    }

    if (isDoubtReportPath(path) || isReportPath(path)) {
        return ['dashboard', 'activity'];
    }

    if (path.startsWith('/api/admin/profile')) {
        return ['profile', 'security', 'activity', 'dashboard'];
    }

    if (path.startsWith('/api/problems')) {
        if (path.includes('/react') || path.includes('/like')) return [];
        return ['dashboard', 'activity'];
    }

    if (path.startsWith('/api/contests')) {
        return ['dashboard', 'activity'];
    }

    if (path.startsWith('/api/tickets')) {
        return ['dashboard', 'activity'];
    }

    if (path.startsWith('/api/admin/users') || path.startsWith('/api/admin/emergency')) {
        return ['dashboard', 'activity'];
    }

    if (method === 'PUT' && path.startsWith('/api/settings/')) {
        return ['dashboard', 'security'];
    }

    return [];
};

const superAdminRealtimeEmitter = () => {
    return (req, res, next) => {
        const requestMethod = String(req.method || '').toUpperCase();
        const requestPath = getPathWithoutQuery(req.originalUrl || req.url);

        res.on('finish', () => {
            if (res.statusCode >= 400) return;

            const sections = resolveRefreshSections(requestMethod, requestPath);
            const adminSections = resolveAdminRefreshSections(requestMethod, requestPath);

            if (sections.length === 0 && adminSections.length === 0) return;

            if (sections.length > 0) {
                emitSuperAdminRefresh(req, {
                    sections,
                    source: requestPath,
                    method: requestMethod,
                    statusCode: res.statusCode
                });
            }

            if (adminSections.length > 0) {
                emitAdminRefresh(req, {
                    sections: adminSections,
                    source: requestPath,
                    method: requestMethod,
                    statusCode: res.statusCode
                });
            }
        });

        next();
    };
};

module.exports = superAdminRealtimeEmitter;
