const User = require('../models/User');
const { verifyAccessToken, getAuthCookieName } = require('../services/auth/jwtService');

const normalizeRole = (role) => String(role || '').trim().toUpperCase();
const authCookieName = getAuthCookieName();

const parseCookies = (cookieHeader = '') => {
    return String(cookieHeader || '')
        .split(';')
        .map((pair) => pair.trim())
        .filter(Boolean)
        .reduce((acc, pair) => {
            const separatorIdx = pair.indexOf('=');
            if (separatorIdx === -1) return acc;
            const key = pair.slice(0, separatorIdx).trim();
            const value = pair.slice(separatorIdx + 1).trim();
            if (!key) return acc;
            acc[key] = decodeURIComponent(value);
            return acc;
        }, {});
};

const extractTokenFromRequest = (req) => {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        return req.headers.authorization.split(' ')[1];
    }

    const cookies = parseCookies(req.headers.cookie || '');
    return cookies[authCookieName] || cookies.token || null;
};

exports.protect = async (req, res, next) => {
    try {
        const token = extractTokenFromRequest(req);

        if (!token) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        const decoded = verifyAccessToken(token);
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (req.user.isActive === false) {
            return res.status(401).json({ success: false, message: 'Account deactivated. Contact support.' });
        }

        req.user.role = normalizeRole(req.user.role);

        if (req.user.sessionInvalidatedAt) {
            const tokenIssuedAt = Number(decoded.iat || 0) * 1000;
            if (tokenIssuedAt <= req.user.sessionInvalidatedAt.getTime()) {
                return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
            }
        }

        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Not authorized' });
    }
};

// Optional protection (populate req.user if token exists, else continue)
exports.optionalProtect = async (req, res, next) => {
    try {
        const token = extractTokenFromRequest(req);

        if (!token) {
            return next();
        }

        const decoded = verifyAccessToken(token);
        req.user = await User.findById(decoded.id).select('-password');
        if (req.user) {
            req.user.role = normalizeRole(req.user.role);
        }
        next();
    } catch (error) {
        next(); // Invalid token just means guest
    }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        const userRole = normalizeRole(req.user?.role);
        const allowedRoles = roles.map(normalizeRole);
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: `User role ${userRole || 'UNKNOWN'} is not authorized to access this route`
            });
        }
        next();
    };
};
