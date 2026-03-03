const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const toPositiveInt = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getOtpLength = () => toPositiveInt(process.env.AUTH_OTP_LENGTH, 6);
const getPasswordResetTokenTtlMinutes = () => toPositiveInt(process.env.AUTH_PASSWORD_RESET_TOKEN_TTL_MINUTES, 30);
const getPasswordResetOtpTtlMinutes = () => toPositiveInt(
    process.env.AUTH_PASSWORD_RESET_OTP_TTL_MINUTES,
    toPositiveInt(process.env.AUTH_OTP_TTL_MINUTES, 10)
);
const getPasswordResetOtpMaxAttempts = () => toPositiveInt(
    process.env.AUTH_PASSWORD_RESET_OTP_MAX_ATTEMPTS,
    toPositiveInt(process.env.AUTH_OTP_MAX_ATTEMPTS, 5)
);
const getPasswordResetVerifiedWindowMinutes = () => toPositiveInt(
    process.env.AUTH_PASSWORD_RESET_VERIFIED_WINDOW_MINUTES,
    15
);

const generatePasswordResetToken = () => crypto.randomBytes(32).toString('hex');

const generatePasswordResetOtp = () => {
    const length = getOtpLength();
    const max = 10 ** length;
    const random = crypto.randomInt(0, max);
    return String(random).padStart(length, '0');
};

const hashPasswordResetToken = (token) => crypto
    .createHash('sha256')
    .update(String(token || '').trim())
    .digest('hex');

const issuePasswordResetToken = (user) => {
    const rawToken = generatePasswordResetToken();
    const tokenHash = hashPasswordResetToken(rawToken);
    const expiresAt = new Date(Date.now() + getPasswordResetTokenTtlMinutes() * 60 * 1000);

    user.passwordResetTokenHash = tokenHash;
    user.passwordResetTokenExpires = expiresAt;

    return {
        rawToken,
        expiresAt
    };
};

const issuePasswordResetOtp = async (user) => {
    const otp = generatePasswordResetOtp();
    const saltRounds = toPositiveInt(process.env.AUTH_PASSWORD_RESET_OTP_BCRYPT_ROUNDS, 10);
    const otpHash = await bcrypt.hash(otp, saltRounds);

    user.resetOtp = otpHash;
    user.resetOtpExpiry = new Date(Date.now() + getPasswordResetOtpTtlMinutes() * 60 * 1000);
    user.resetOtpAttempts = 0;
    user.resetOtpVerifiedAt = undefined;

    return {
        otp,
        expiresAt: user.resetOtpExpiry
    };
};

const verifyPasswordResetOtp = async (user, otp) => {
    if (!user?.resetOtp) return false;
    return bcrypt.compare(String(otp || ''), user.resetOtp);
};

const clearPasswordResetToken = (user) => {
    user.passwordResetTokenHash = undefined;
    user.passwordResetTokenExpires = undefined;
};

const clearPasswordResetOtp = (user) => {
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    user.resetOtpAttempts = 0;
    user.resetOtpVerifiedAt = undefined;
};

const canResetPasswordWithVerifiedOtp = (user) => {
    if (!user?.resetOtpExpiry || !user?.resetOtpVerifiedAt) return false;
    const now = Date.now();
    const expiryMs = new Date(user.resetOtpExpiry).getTime();
    const verifiedAtMs = new Date(user.resetOtpVerifiedAt).getTime();
    const verificationWindowMs = getPasswordResetVerifiedWindowMinutes() * 60 * 1000;

    if (!Number.isFinite(expiryMs) || !Number.isFinite(verifiedAtMs)) return false;
    if (now > expiryMs) return false;
    if (now > verifiedAtMs + verificationWindowMs) return false;
    return true;
};

const buildPasswordResetLink = (req, token) => {
    const encodedToken = encodeURIComponent(token);
    const clientUrl = String(process.env.CLIENT_URL || '').trim().replace(/\/+$/, '');

    if (clientUrl) {
        return `${clientUrl}/reset-password?token=${encodedToken}`;
    }

    const backendUrl = String(process.env.BACKEND_URL || '').trim().replace(/\/+$/, '');
    if (backendUrl) {
        return `${backendUrl}/api/auth/reset-password?token=${encodedToken}`;
    }

    const protocol = req.protocol || 'http';
    const host = req.get('host');
    return `${protocol}://${host}/api/auth/reset-password?token=${encodedToken}`;
};

module.exports = {
    issuePasswordResetToken,
    hashPasswordResetToken,
    clearPasswordResetToken,
    issuePasswordResetOtp,
    verifyPasswordResetOtp,
    clearPasswordResetOtp,
    canResetPasswordWithVerifiedOtp,
    getPasswordResetOtpTtlMinutes,
    getPasswordResetOtpMaxAttempts,
    getPasswordResetVerifiedWindowMinutes,
    buildPasswordResetLink,
    getPasswordResetTokenTtlMinutes
};
