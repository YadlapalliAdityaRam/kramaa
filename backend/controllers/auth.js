const crypto = require('crypto');
const User = require('../models/User');
const {
    issueOtpChallenge,
    verifyOtpChallenge,
    clearActiveChallenges,
    getOtpTtlMinutes
} = require('../services/auth/otpService');
const {
    hashPasswordResetToken,
    clearPasswordResetToken,
    issuePasswordResetOtp,
    verifyPasswordResetOtp,
    clearPasswordResetOtp,
    canResetPasswordWithVerifiedOtp,
    getPasswordResetOtpTtlMinutes,
    getPasswordResetOtpMaxAttempts
} = require('../services/auth/passwordResetService');
const {
    generateAccessToken,
    getAuthCookieName,
    getAuthCookieOptions
} = require('../services/auth/jwtService');
const { sendEmailViaBrevo } = require('../services/email/brevoEmailService');
const {
    buildOtpEmailTemplate
} = require('../services/email/authEmailTemplates');

const EMAIL_PURPOSES = {
    VERIFICATION: 'EMAIL_VERIFICATION',
    PASSWORD_RESET: 'PASSWORD_RESET'
};

const AUTH_APP_NAME = String(process.env.APP_NAME || 'Krama').trim() || 'Krama';
const authCookieName = getAuthCookieName();

const toApiSafeUser = (user) => ({
    _id: user._id,
    id: user._id,
    username: user.username,
    fullName: user.fullName || user.username,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    isVerified: Boolean(user.isVerified),
    accountStatus: user.accountStatus,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
});

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const normalizeUsernameSeed = (value, fallback = 'user') => {
    const raw = String(value || '').trim().toLowerCase();
    const normalized = raw.replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
    const base = normalized || fallback;

    if (base.length >= 3 && base.length <= 30) return base;
    if (base.length < 3) return `${base}${'user'.slice(0, 3 - base.length)}`;
    return base.slice(0, 30);
};

const resolveUniqueUsername = async ({ preferredUsername, name, email, excludeUserId = null }) => {
    const emailPrefix = String(email || '').split('@')[0] || 'user';
    const seed = normalizeUsernameSeed(preferredUsername || name || emailPrefix, 'user');

    for (let attempt = 0; attempt < 30; attempt += 1) {
        const suffix = attempt === 0 ? '' : String(1000 + Math.floor(Math.random() * 9000));
        const maxSeedLength = Math.max(3, 30 - suffix.length);
        const candidate = `${seed.slice(0, maxSeedLength)}${suffix}`;

        const query = { username: candidate };
        if (excludeUserId) {
            query._id = { $ne: excludeUserId };
        }

        // eslint-disable-next-line no-await-in-loop
        const existing = await User.exists(query);
        if (!existing) {
            return candidate;
        }
    }

    throw new Error('Unable to reserve username. Please try a different username.');
};

const createVerificationLinkToken = () => {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return {
        rawToken,
        tokenHash,
        expiresAt
    };
};

const getRequestContext = (req) => ({
    ip: String(req.ip || req.headers['x-forwarded-for'] || '').split(',')[0].trim(),
    userAgent: String(req.get('user-agent') || '').slice(0, 512)
});

const setAuthCookie = (res, token) => {
    res.cookie(authCookieName, token, getAuthCookieOptions());
};

const clearAuthCookie = (res) => {
    const cookieOptions = { ...getAuthCookieOptions() };
    delete cookieOptions.maxAge;
    res.clearCookie(authCookieName, cookieOptions);
};

const buildEmailVerificationLink = (req, rawToken) => {
    const encodedToken = encodeURIComponent(rawToken);
    const clientUrl = String(process.env.CLIENT_URL || '').trim().replace(/\/+$/, '');
    if (clientUrl) {
        return `${clientUrl}/verify-email?token=${encodedToken}`;
    }

    const backendUrl = String(process.env.BACKEND_URL || '').trim().replace(/\/+$/, '');
    if (backendUrl) {
        return `${backendUrl}/api/auth/verify-email?token=${encodedToken}`;
    }

    const forwardedProto = String(req.get('x-forwarded-proto') || '').split(',')[0].trim();
    const protocol = forwardedProto || req.protocol || 'http';
    const host = req.get('host');
    return `${protocol}://${host}/api/auth/verify-email?token=${encodedToken}`;
};

const sendVerificationEmail = async ({ user, otp, verificationLink }) => {
    const expiresInMinutes = getOtpTtlMinutes();
    const otpTemplate = buildOtpEmailTemplate({
        appName: AUTH_APP_NAME,
        recipientName: user.fullName || user.username || 'User',
        otp,
        purposeLabel: 'email verification',
        expiresInMinutes
    });

    const htmlContent = `
        ${otpTemplate.html}
        <p style="margin-top: 14px;">Prefer one-click verification?</p>
        <p>
            <a href="${verificationLink}" style="display:inline-block;padding:10px 16px;border-radius:8px;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:600;">
                Verify Email
            </a>
        </p>
    `;

    const textContent = `${otpTemplate.text}\n\nVerification link: ${verificationLink}`;

    await sendEmailViaBrevo({
        toEmail: user.email,
        toName: user.fullName || user.username,
        subject: `${AUTH_APP_NAME} email verification code`,
        htmlContent,
        textContent
    });
};

const sendPasswordResetEmail = async ({ user, resetToken }) => {
    const expiresInMinutes = getPasswordResetOtpTtlMinutes();
    const template = buildOtpEmailTemplate({
        appName: AUTH_APP_NAME,
        recipientName: user.fullName || user.username || 'User',
        otp: resetToken,
        purposeLabel: 'password reset',
        expiresInMinutes
    });

    await sendEmailViaBrevo({
        toEmail: user.email,
        toName: user.fullName || user.username,
        subject: `${AUTH_APP_NAME} password reset OTP`,
        htmlContent: template.html,
        textContent: template.text
    });
};

const genericInvalidCredentialsMessage = 'Invalid email or password.';
const genericForgotPasswordMessage = 'If an account exists for this email, a password reset OTP has been sent.';
const genericOtpVerificationMessage = 'Invalid or expired OTP.';
const genericResetSessionMessage = 'Reset session is invalid or expired.';

exports.register = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const password = String(req.body.password || '');
        const name = String(req.body.name || '').trim();
        const requestedUsername = String(req.body.username || '').trim();

        let user = await User.findOne({ email }).select('+password +emailVerificationToken +emailVerificationExpires');

        if (user && user.isVerified) {
            return res.status(409).json({
                success: false,
                message: 'An account already exists with this email. Please login.'
            });
        }

        const context = getRequestContext(req);

        if (!user) {
            const username = await resolveUniqueUsername({
                preferredUsername: requestedUsername,
                name,
                email
            });

            user = new User({
                username,
                fullName: name || undefined,
                email,
                password,
                role: 'USER',
                isVerified: false,
                emailVerificationRequired: true,
                accountStatus: 'Active'
            });
        } else {
            const shouldUpdateUsername = requestedUsername && requestedUsername.toLowerCase() !== String(user.username || '').toLowerCase();
            if (shouldUpdateUsername) {
                user.username = await resolveUniqueUsername({
                    preferredUsername: requestedUsername,
                    name,
                    email,
                    excludeUserId: user._id
                });
            }

            if (name) {
                user.fullName = name;
            }

            user.password = password;
            user.isVerified = false;
            user.emailVerificationRequired = true;
            user.accountStatus = 'Active';
        }

        const legacyToken = createVerificationLinkToken();
        user.emailVerificationToken = legacyToken.tokenHash;
        user.emailVerificationExpires = legacyToken.expiresAt;

        await user.save();

        let otpChallenge;
        try {
            otpChallenge = await issueOtpChallenge({
                userId: user._id,
                email,
                purpose: EMAIL_PURPOSES.VERIFICATION,
                ip: context.ip,
                userAgent: context.userAgent
            });
        } catch (otpError) {
            if (otpError?.code === 'OTP_COOLDOWN') {
                return res.status(200).json({
                    success: true,
                    message: 'Verification is already in progress. Please check your email for the latest OTP.',
                    verification: {
                        email,
                        method: 'otp',
                        expiresInMinutes: getOtpTtlMinutes()
                    }
                });
            }
            throw otpError;
        }

        const verificationLink = buildEmailVerificationLink(req, legacyToken.rawToken);
        await sendVerificationEmail({
            user,
            otp: otpChallenge.otp,
            verificationLink
        });

        const responsePayload = {
            success: true,
            message: 'Registration successful. Verify your email using the OTP sent to your inbox.',
            verification: {
                email,
                method: 'otp',
                expiresInMinutes: getOtpTtlMinutes()
            }
        };

        if (String(process.env.NODE_ENV || '').toLowerCase() !== 'production' && String(process.env.AUTH_DEBUG_OTP || '').toLowerCase() === 'true') {
            responsePayload.debugOtp = otpChallenge.otp;
        }

        return res.status(201).json(responsePayload);
    } catch (error) {
        const statusCode = Number(error?.statusCode || 500);
        return res.status(statusCode).json({
            success: false,
            message: statusCode >= 500
                ? 'Unable to complete registration right now. Please try again.'
                : error.message
        });
    }
};

exports.verifyEmailOtp = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const otp = String(req.body.otp || '').trim();

        const user = await User.findOne({ email }).select('+emailVerificationToken +emailVerificationExpires');

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
        }

        if (user.isVerified) {
            const token = generateAccessToken(user._id);
            setAuthCookie(res, token);
            return res.status(200).json({
                success: true,
                message: 'Email is already verified.',
                token,
                user: toApiSafeUser(user)
            });
        }

        await verifyOtpChallenge({
            userId: user._id,
            email,
            purpose: EMAIL_PURPOSES.VERIFICATION,
            otp
        });

        user.isVerified = true;
        user.emailVerificationRequired = false;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        user.failedLoginAttempts = 0;
        user.lastFailedLoginAt = undefined;
        await user.save();

        const token = generateAccessToken(user._id);
        setAuthCookie(res, token);

        return res.status(200).json({
            success: true,
            message: 'Email verified successfully.',
            token,
            user: toApiSafeUser(user)
        });
    } catch (error) {
        const statusCode = Number(error?.statusCode || 400);
        return res.status(statusCode).json({
            success: false,
            message: error.message || 'Invalid or expired OTP.'
        });
    }
};

exports.resendVerificationOtp = async (req, res) => {
    const email = normalizeEmail(req.body.email);

    try {
        const user = await User.findOne({ email });

        if (user && !user.isVerified) {
            const context = getRequestContext(req);
            const otpChallenge = await issueOtpChallenge({
                userId: user._id,
                email,
                purpose: EMAIL_PURPOSES.VERIFICATION,
                ip: context.ip,
                userAgent: context.userAgent
            });

            const legacyToken = createVerificationLinkToken();
            user.emailVerificationToken = legacyToken.tokenHash;
            user.emailVerificationExpires = legacyToken.expiresAt;
            await user.save();

            const verificationLink = buildEmailVerificationLink(req, legacyToken.rawToken);
            await sendVerificationEmail({
                user,
                otp: otpChallenge.otp,
                verificationLink
            });
        }

        return res.status(200).json({
            success: true,
            message: 'If verification is pending, a new OTP has been sent to the registered email.'
        });
    } catch (error) {
        if (error?.code === 'OTP_COOLDOWN') {
            return res.status(200).json({
                success: true,
                message: 'If verification is pending, a new OTP has been sent to the registered email.'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Unable to process request right now. Please try again.'
        });
    }
};

exports.verifyEmail = async (req, res) => {
    try {
        const token = String(req.query?.token || '').trim();
        if (!token) {
            return res.status(400).json({ success: false, message: 'Verification token is missing.' });
        }

        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({
            emailVerificationToken: tokenHash,
            emailVerificationExpires: { $gt: new Date() }
        }).select('+emailVerificationToken +emailVerificationExpires');

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Verification link is invalid or expired.'
            });
        }

        user.isVerified = true;
        user.emailVerificationRequired = false;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        await clearActiveChallenges({
            userId: user._id,
            email: user.email,
            purpose: EMAIL_PURPOSES.VERIFICATION
        });

        return res.status(200).json({
            success: true,
            message: 'Email verified successfully. You can now login.'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Unable to verify email right now. Please try again.'
        });
    }
};

exports.login = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const password = String(req.body.password || '');

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, message: genericInvalidCredentialsMessage });
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            user.failedLoginAttempts = Number(user.failedLoginAttempts || 0) + 1;
            user.lastFailedLoginAt = new Date();
            await user.save({ validateBeforeSave: false });
            return res.status(401).json({ success: false, message: genericInvalidCredentialsMessage });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: 'Please verify your email before logging in.',
                requiresVerification: true
            });
        }

        if (String(user.accountStatus || '').toLowerCase() !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Your account is not active. Please contact support.'
            });
        }

        user.failedLoginAttempts = 0;
        user.lastFailedLoginAt = undefined;
        user.lastLogin = new Date();

        const loginEntry = {
            ip: String(req.ip || req.headers['x-forwarded-for'] || '').split(',')[0].trim(),
            device: String(req.get('user-agent') || 'Unknown device').slice(0, 256),
            timestamp: new Date()
        };

        const loginHistory = Array.isArray(user.loginHistory) ? user.loginHistory : [];
        loginHistory.unshift(loginEntry);
        user.loginHistory = loginHistory.slice(0, 20);

        await user.save({ validateBeforeSave: false });

        const token = generateAccessToken(user._id);
        setAuthCookie(res, token);

        return res.status(200).json({
            success: true,
            token,
            user: toApiSafeUser(user)
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Unable to login right now. Please try again.'
        });
    }
};

exports.forgotPassword = async (req, res) => {
    const email = normalizeEmail(req.body.email);

    try {
        const user = await User.findOne({ email })
            .select('+resetOtp +resetOtpExpiry +resetOtpAttempts +resetOtpVerifiedAt +passwordResetTokenHash +passwordResetTokenExpires');

        if (user && user.isVerified && String(user.accountStatus || '').toLowerCase() === 'active') {
            const { otp } = await issuePasswordResetOtp(user);
            clearPasswordResetToken(user);
            await user.save({ validateBeforeSave: false });
            try {
                await sendPasswordResetEmail({ user, resetToken: otp });
            } catch (emailError) {
                console.warn('[auth][forgot-password] OTP delivery failed', {
                    email,
                    ip: String(req.ip || '').trim(),
                    message: emailError?.message || 'unknown-email-error'
                });
                clearPasswordResetOtp(user);
                await user.save({ validateBeforeSave: false });
            }
        } else if (user) {
            console.warn('[auth][forgot-password] blocked reset for non-resettable account', {
                email,
                userId: String(user._id),
                isVerified: Boolean(user.isVerified),
                accountStatus: String(user.accountStatus || '')
            });
        }

        return res.status(200).json({
            success: true,
            message: genericForgotPasswordMessage
        });
    } catch (error) {
        console.warn('[auth][forgot-password] request failed', {
            email,
            ip: String(req.ip || '').trim(),
            message: error?.message || 'unknown-error'
        });
        return res.status(200).json({
            success: true,
            message: genericForgotPasswordMessage
        });
    }
};

exports.verifyOtp = async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || '').trim();

    try {
        const user = await User.findOne({ email })
            .select('+resetOtp +resetOtpExpiry +resetOtpAttempts +resetOtpVerifiedAt');

        if (!user || !user.resetOtp || !user.resetOtpExpiry) {
            return res.status(400).json({ success: false, message: genericOtpVerificationMessage });
        }

        if (new Date(user.resetOtpExpiry).getTime() <= Date.now()) {
            clearPasswordResetOtp(user);
            await user.save({ validateBeforeSave: false });
            return res.status(400).json({ success: false, message: genericOtpVerificationMessage });
        }

        const maxAttempts = getPasswordResetOtpMaxAttempts();
        const attempts = Number(user.resetOtpAttempts || 0);
        if (attempts >= maxAttempts) {
            console.warn('[auth][verify-otp] attempts exceeded', {
                email,
                userId: String(user._id),
                ip: String(req.ip || '').trim()
            });
            clearPasswordResetOtp(user);
            await user.save({ validateBeforeSave: false });
            return res.status(400).json({ success: false, message: genericOtpVerificationMessage });
        }

        const isOtpValid = await verifyPasswordResetOtp(user, otp);
        if (!isOtpValid) {
            user.resetOtpAttempts = attempts + 1;
            await user.save({ validateBeforeSave: false });

            if (user.resetOtpAttempts >= maxAttempts) {
                console.warn('[auth][verify-otp] suspicious invalid OTP attempts', {
                    email,
                    userId: String(user._id),
                    attempts: user.resetOtpAttempts,
                    ip: String(req.ip || '').trim()
                });
            }

            return res.status(400).json({ success: false, message: genericOtpVerificationMessage });
        }

        user.resetOtpVerifiedAt = new Date();
        user.resetOtpAttempts = 0;
        await user.save({ validateBeforeSave: false });

        return res.status(200).json({
            success: true,
            message: 'OTP verified. You can now reset your password.'
        });
    } catch (error) {
        console.warn('[auth][verify-otp] verification failed', {
            email,
            ip: String(req.ip || '').trim(),
            message: error?.message || 'unknown-error'
        });
        return res.status(400).json({ success: false, message: genericOtpVerificationMessage });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const token = String(req.body?.token || req.query?.token || '').trim();
        const email = normalizeEmail(req.body?.email);
        const password = String(req.body?.password || '').trim();

        let user = null;

        if (token) {
            const tokenHash = hashPasswordResetToken(token);
            user = await User.findOne({
                passwordResetTokenHash: tokenHash,
                passwordResetTokenExpires: { $gt: new Date() }
            }).select('+passwordResetTokenHash +passwordResetTokenExpires +resetOtp +resetOtpExpiry +resetOtpAttempts +resetOtpVerifiedAt');

            if (!user) {
                return res.status(400).json({ success: false, message: genericResetSessionMessage });
            }
        } else {
            user = await User.findOne({ email })
                .select('+resetOtp +resetOtpExpiry +resetOtpAttempts +resetOtpVerifiedAt');

            if (!user || !canResetPasswordWithVerifiedOtp(user)) {
                if (user && (!user.resetOtpExpiry || new Date(user.resetOtpExpiry).getTime() <= Date.now())) {
                    clearPasswordResetOtp(user);
                    await user.save({ validateBeforeSave: false });
                }
                return res.status(400).json({ success: false, message: genericResetSessionMessage });
            }
        }


        user.password = password;
        clearPasswordResetOtp(user);
        clearPasswordResetToken(user);
        user.sessionInvalidatedAt = new Date();
        await user.save();

        clearAuthCookie(res);

        return res.status(200).json({
            success: true,
            message: 'Password reset successful. Please login with your new password.'
        });
    } catch (error) {
        console.warn('[auth][reset-password] reset failed', {
            email: normalizeEmail(req.body?.email),
            ip: String(req.ip || '').trim(),
            message: error?.message || 'unknown-error'
        });
        return res.status(500).json({
            success: false,
            message: 'Unable to reset password right now. Please try again.'
        });
    }
};

exports.logout = async (req, res) => {
    clearAuthCookie(res);
    return res.status(200).json({
        success: true,
        message: 'Logged out successfully.'
    });
};

exports.getMe = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        const user = await User.findById(req.user._id || req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({
            success: true,
            user: toApiSafeUser(user)
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Unable to load profile right now.'
        });
    }
};
