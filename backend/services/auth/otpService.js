const crypto = require('crypto');
const AuthOtp = require('../../models/AuthOtp');

const toPositiveInt = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getOtpLength = () => toPositiveInt(process.env.AUTH_OTP_LENGTH, 6);
const getOtpTtlMinutes = () => toPositiveInt(process.env.AUTH_OTP_TTL_MINUTES, 10);
const getOtpMaxAttempts = () => toPositiveInt(process.env.AUTH_OTP_MAX_ATTEMPTS, 5);
const getOtpResendCooldownSeconds = () => toPositiveInt(process.env.AUTH_OTP_RESEND_COOLDOWN_SECONDS, 60);

const getOtpPepper = () => (
    String(process.env.AUTH_OTP_HASH_PEPPER || process.env.JWT_SECRET || 'krama-otp-pepper').trim()
);

const hashOtp = (otp) => crypto
    .createHash('sha256')
    .update(`${String(otp)}:${getOtpPepper()}`)
    .digest('hex');

const generateNumericOtp = () => {
    const otpLength = getOtpLength();
    const max = 10 ** otpLength;
    const random = crypto.randomInt(0, max);
    return String(random).padStart(otpLength, '0');
};

const buildOtpError = (message, statusCode = 400, code = 'OTP_ERROR') => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    return error;
};

const clearActiveChallenges = async ({ userId, email, purpose }) => {
    await AuthOtp.deleteMany({
        user: userId,
        email: String(email || '').trim().toLowerCase(),
        purpose,
        consumedAt: null
    });
};

const issueOtpChallenge = async ({
    userId,
    email,
    purpose,
    ip = '',
    userAgent = ''
}) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const now = new Date();
    const cooldownMs = getOtpResendCooldownSeconds() * 1000;

    const latestChallenge = await AuthOtp.findOne({
        user: userId,
        email: normalizedEmail,
        purpose,
        consumedAt: null,
        expiresAt: { $gt: now }
    }).sort({ createdAt: -1 });

    if (latestChallenge?.lastSentAt) {
        const elapsedMs = Date.now() - latestChallenge.lastSentAt.getTime();
        if (elapsedMs < cooldownMs) {
            const retryAfterSeconds = Math.ceil((cooldownMs - elapsedMs) / 1000);
            throw buildOtpError(
                `Please wait ${retryAfterSeconds} seconds before requesting another OTP.`,
                429,
                'OTP_COOLDOWN'
            );
        }
    }

    await clearActiveChallenges({ userId, email: normalizedEmail, purpose });

    const otp = generateNumericOtp();
    const expiresAt = new Date(Date.now() + getOtpTtlMinutes() * 60 * 1000);

    await AuthOtp.create({
        user: userId,
        email: normalizedEmail,
        purpose,
        otpHash: hashOtp(otp),
        expiresAt,
        maxAttempts: getOtpMaxAttempts(),
        lastSentAt: now,
        requestedFromIp: String(ip || '').slice(0, 128),
        requestedFromUserAgent: String(userAgent || '').slice(0, 512)
    });

    return {
        otp,
        expiresAt
    };
};

const verifyOtpChallenge = async ({
    userId,
    email,
    purpose,
    otp
}) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedOtp = String(otp || '').trim();

    const challenge = await AuthOtp.findOne({
        user: userId,
        email: normalizedEmail,
        purpose,
        consumedAt: null
    })
        .sort({ createdAt: -1 })
        .select('+otpHash');

    if (!challenge) {
        throw buildOtpError('Invalid or expired OTP.', 400, 'OTP_NOT_FOUND');
    }

    if (!challenge.expiresAt || challenge.expiresAt.getTime() <= Date.now()) {
        await AuthOtp.deleteOne({ _id: challenge._id });
        throw buildOtpError('Invalid or expired OTP.', 400, 'OTP_EXPIRED');
    }

    if (challenge.attempts >= challenge.maxAttempts) {
        await AuthOtp.deleteOne({ _id: challenge._id });
        throw buildOtpError('Too many invalid attempts. Request a new OTP.', 429, 'OTP_ATTEMPTS_EXCEEDED');
    }

    const incomingHash = hashOtp(normalizedOtp);
    const incomingBuffer = Buffer.from(incomingHash, 'hex');
    const storedBuffer = Buffer.from(challenge.otpHash, 'hex');

    if (
        incomingBuffer.length !== storedBuffer.length ||
        !crypto.timingSafeEqual(incomingBuffer, storedBuffer)
    ) {
        challenge.attempts += 1;
        await challenge.save();
        throw buildOtpError('Invalid or expired OTP.', 400, 'OTP_INVALID');
    }

    challenge.consumedAt = new Date();
    challenge.attempts += 1;
    await challenge.save();

    return true;
};

module.exports = {
    hashOtp,
    generateNumericOtp,
    issueOtpChallenge,
    verifyOtpChallenge,
    clearActiveChallenges,
    getOtpLength,
    getOtpTtlMinutes,
    getOtpMaxAttempts,
    getOtpResendCooldownSeconds
};

