const rateLimit = require('express-rate-limit');
const axios = require('axios');

const toBoolean = (value, defaultValue = false) => {
    if (value === undefined || value === null || value === '') {
        return defaultValue;
    }
    const normalized = String(value).trim().toLowerCase();
    return ['1', 'true', 'yes', 'on'].includes(normalized);
};

const toPositiveInt = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const buildLimiter = ({ defaultWindowMinutes, defaultLimit, windowEnv, limitEnv, message }) => rateLimit({
    windowMs: toPositiveInt(process.env[windowEnv], defaultWindowMinutes) * 60 * 1000,
    limit: toPositiveInt(process.env[limitEnv], defaultLimit),
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message },
    handler: (req, res, _next, options) => {
        res.status(options.statusCode).json(options.message);
    }
});

const registerLimiter = buildLimiter({
    defaultWindowMinutes: 15,
    defaultLimit: 5,
    windowEnv: 'AUTH_REGISTER_RATE_LIMIT_WINDOW_MINUTES',
    limitEnv: 'AUTH_REGISTER_RATE_LIMIT_MAX',
    message: 'Too many registration attempts. Please try again later.'
});

const loginLimiter = buildLimiter({
    defaultWindowMinutes: 15,
    defaultLimit: 10,
    windowEnv: 'AUTH_LOGIN_RATE_LIMIT_WINDOW_MINUTES',
    limitEnv: 'AUTH_LOGIN_RATE_LIMIT_MAX',
    message: 'Too many login attempts. Please try again later.'
});

const otpRequestLimiter = buildLimiter({
    defaultWindowMinutes: 60,
    defaultLimit: 5,
    windowEnv: 'AUTH_OTP_RATE_LIMIT_WINDOW_MINUTES',
    limitEnv: 'AUTH_OTP_RATE_LIMIT_MAX',
    message: 'Too many OTP requests. Please try again later.'
});

const otpVerificationLimiter = buildLimiter({
    defaultWindowMinutes: 15,
    defaultLimit: 20,
    windowEnv: 'AUTH_OTP_VERIFY_RATE_LIMIT_WINDOW_MINUTES',
    limitEnv: 'AUTH_OTP_VERIFY_RATE_LIMIT_MAX',
    message: 'Too many OTP verification attempts. Please try again later.'
});

const forgotPasswordLimiter = buildLimiter({
    defaultWindowMinutes: 60,
    defaultLimit: 5,
    windowEnv: 'AUTH_FORGOT_PASSWORD_RATE_LIMIT_WINDOW_MINUTES',
    limitEnv: 'AUTH_FORGOT_PASSWORD_RATE_LIMIT_MAX',
    message: 'Too many password reset requests. Please try again later.'
});

const verifyCaptchaOnRegister = async (req, res, next) => {
    const captchaEnabled = toBoolean(process.env.AUTH_CAPTCHA_ENABLED, false);
    if (!captchaEnabled) {
        return next();
    }

    const captchaToken = String(req.body?.captchaToken || '').trim();
    if (!captchaToken) {
        return res.status(400).json({
            success: false,
            message: 'Captcha token is required.'
        });
    }

    const secretKey = String(process.env.RECAPTCHA_SECRET_KEY || process.env.CAPTCHA_SECRET_KEY || '').trim();
    if (!secretKey) {
        return res.status(500).json({
            success: false,
            message: 'Captcha validation is enabled but server is not configured.'
        });
    }

    const verifyUrl = String(process.env.RECAPTCHA_VERIFY_URL || 'https://www.google.com/recaptcha/api/siteverify').trim();

    try {
        const payload = new URLSearchParams();
        payload.append('secret', secretKey);
        payload.append('response', captchaToken);

        const remoteIp = String(req.ip || req.headers['x-forwarded-for'] || '').split(',')[0].trim();
        if (remoteIp) {
            payload.append('remoteip', remoteIp);
        }

        const { data } = await axios.post(verifyUrl, payload.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 7000
        });

        if (!data?.success) {
            return res.status(400).json({
                success: false,
                message: 'Captcha verification failed.'
            });
        }

        const minScore = Number.parseFloat(process.env.RECAPTCHA_MIN_SCORE || '0');
        if (Number.isFinite(minScore) && minScore > 0 && typeof data.score === 'number' && data.score < minScore) {
            return res.status(400).json({
                success: false,
                message: 'Captcha score is too low. Please try again.'
            });
        }

        return next();
    } catch (error) {
        console.error('Captcha verification error:', error.message);
        return res.status(502).json({
            success: false,
            message: 'Captcha verification service is unavailable.'
        });
    }
};

module.exports = {
    registerLimiter,
    loginLimiter,
    otpRequestLimiter,
    otpVerificationLimiter,
    forgotPasswordLimiter,
    verifyCaptchaOnRegister
};
