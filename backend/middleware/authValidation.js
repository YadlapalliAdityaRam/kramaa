const { body } = require('express-validator');

const normalizeEmail = () => body('email')
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage('A valid email is required.');

const registerValidation = [
    normalizeEmail(),
    body('password')
        .isString()
        .isLength({ min: 1, max: 128 })
        .withMessage('Password must be between 1 and 128 characters.'),
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 60 })
        .withMessage('Name must be between 2 and 60 characters.'),
    body('username')
        .optional()
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters.'),
    body()
        .custom((payload) => {
            const name = String(payload?.name || '').trim();
            const username = String(payload?.username || '').trim();
            if (!name && !username) {
                throw new Error('Either name or username is required.');
            }
            return true;
        })
];

const loginValidation = [
    normalizeEmail(),
    body('password')
        .isString()
        .notEmpty()
        .withMessage('Password is required.')
];

const verifyEmailOtpValidation = [
    normalizeEmail(),
    body('otp')
        .trim()
        .matches(/^\d{6}$/)
        .withMessage('OTP must be a 6-digit number.')
];

const resendVerificationOtpValidation = [
    normalizeEmail()
];

const forgotPasswordValidation = [
    normalizeEmail()
];

const verifyPasswordResetOtpValidation = [
    normalizeEmail(),
    body('otp')
        .trim()
        .matches(/^\d{6}$/)
        .withMessage('OTP must be a 6-digit number.')
];

const resetPasswordValidation = [
    body('email')
        .optional()
        .trim()
        .toLowerCase()
        .isEmail()
        .withMessage('A valid email is required.'),
    body('token')
        .optional()
        .trim()
        .isLength({ min: 20 })
        .withMessage('Reset token is invalid.'),
    body('password')
        .isString()
        .isLength({ min: 1, max: 128 })
        .withMessage('Password must be between 1 and 128 characters.'),
    body()
        .custom((payload) => {
            const hasToken = String(payload?.token || '').trim().length > 0;
            const hasEmail = String(payload?.email || '').trim().length > 0;
            if (!hasToken && !hasEmail) {
                throw new Error('Email is required.');
            }
            return true;
        })
];

module.exports = {
    registerValidation,
    loginValidation,
    verifyEmailOtpValidation,
    resendVerificationOtpValidation,
    forgotPasswordValidation,
    verifyPasswordResetOtpValidation,
    resetPasswordValidation
};
