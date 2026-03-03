const jwt = require('jsonwebtoken');

const toPositiveInt = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getJwtSecret = () => String(process.env.JWT_SECRET || '').trim();
const getJwtExpiry = () => String(process.env.JWT_EXPIRE || '7d').trim();

const generateAccessToken = (userId) => {
    const secret = getJwtSecret();
    if (!secret) {
        throw new Error('JWT_SECRET is not configured.');
    }

    return jwt.sign(
        { id: String(userId), type: 'access' },
        secret,
        { expiresIn: getJwtExpiry() }
    );
};

const verifyAccessToken = (token) => {
    const secret = getJwtSecret();
    if (!secret) {
        throw new Error('JWT_SECRET is not configured.');
    }
    return jwt.verify(token, secret);
};

const getAuthCookieName = () => String(process.env.AUTH_COOKIE_NAME || 'krama_access_token').trim();

const getAuthCookieOptions = () => {
    const isProduction = String(process.env.NODE_ENV || '').trim().toLowerCase() === 'production';
    const cookieMaxAgeMinutes = toPositiveInt(process.env.AUTH_COOKIE_MAX_AGE_MINUTES, 60 * 24 * 7);

    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: cookieMaxAgeMinutes * 60 * 1000,
        path: '/'
    };
};

module.exports = {
    generateAccessToken,
    verifyAccessToken,
    getAuthCookieName,
    getAuthCookieOptions
};

