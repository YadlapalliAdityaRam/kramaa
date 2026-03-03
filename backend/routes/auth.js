const express = require('express');
const router = express.Router();

const {
    register,
    login,
    getMe,
    verifyEmail,
    verifyEmailOtp,
    resendVerificationOtp,
    forgotPassword,
    verifyOtp,
    resetPassword,
    logout
} = require('../controllers/auth');
const { protect } = require('../middleware/auth');
const {
    registerLimiter,
    loginLimiter,
    otpRequestLimiter,
    otpVerificationLimiter,
    forgotPasswordLimiter,
    verifyCaptchaOnRegister
} = require('../middleware/authSecurity');
const {
    registerValidation,
    loginValidation,
    verifyEmailOtpValidation,
    resendVerificationOtpValidation,
    forgotPasswordValidation,
    verifyPasswordResetOtpValidation,
    resetPasswordValidation
} = require('../middleware/authValidation');
const { validateRequest } = require('../middleware/validateRequest');

router.post('/register', registerLimiter, verifyCaptchaOnRegister, registerValidation, validateRequest, register);
router.post('/verify-email-otp', otpVerificationLimiter, verifyEmailOtpValidation, validateRequest, verifyEmailOtp);
router.post('/resend-verification-otp', otpRequestLimiter, resendVerificationOtpValidation, validateRequest, resendVerificationOtp);
router.post('/login', loginLimiter, loginValidation, validateRequest, login);
router.get('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPasswordLimiter, forgotPasswordValidation, validateRequest, forgotPassword);
router.post('/verify-otp', otpVerificationLimiter, verifyPasswordResetOtpValidation, validateRequest, verifyOtp);
router.post('/reset-password', resetPasswordValidation, validateRequest, resetPassword);
router.post('/logout', logout);
router.get('/me', protect, getMe);

module.exports = router;
