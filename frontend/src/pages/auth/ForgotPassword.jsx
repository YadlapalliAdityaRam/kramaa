import React, { useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEnvelope, FaLock, FaRedoAlt } from 'react-icons/fa';
import api from '../../utils/api';

const OTP_LENGTH = 6;

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const maskEmail = (email) => {
    const normalized = normalizeEmail(email);
    const [namePart, domainPart] = normalized.split('@');
    if (!namePart || !domainPart) return normalized;
    const visible = namePart.slice(0, 2);
    const masked = '*'.repeat(Math.max(1, namePart.length - 2));
    return `${visible}${masked}@${domainPart}`;
};

const ForgotPassword = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const inputRefs = useRef([]);

    const initialEmail = useMemo(() => {
        const stateEmail = normalizeEmail(location.state?.email);
        if (stateEmail) return stateEmail;
        const query = new URLSearchParams(location.search || '');
        const queryEmail = normalizeEmail(query.get('email'));
        if (queryEmail) return queryEmail;
        return normalizeEmail(sessionStorage.getItem('pendingPasswordResetEmail'));
    }, [location.search, location.state]);

    const [email, setEmail] = useState(initialEmail);
    const [step, setStep] = useState('request');
    const [otpDigits, setOtpDigits] = useState(Array.from({ length: OTP_LENGTH }, () => ''));
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isRequesting, setIsRequesting] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const otp = otpDigits.join('');

    const focusInput = (index) => {
        const node = inputRefs.current[index];
        if (node && typeof node.focus === 'function') {
            node.focus();
            node.select?.();
        }
    };

    const handleDigitChange = (index, value) => {
        const nextValue = String(value || '').replace(/\D/g, '');
        if (!nextValue) {
            setOtpDigits((prev) => {
                const next = [...prev];
                next[index] = '';
                return next;
            });
            return;
        }

        if (nextValue.length > 1) {
            const pasted = nextValue.slice(0, OTP_LENGTH).split('');
            setOtpDigits((prev) => {
                const next = [...prev];
                for (let i = 0; i < OTP_LENGTH; i += 1) {
                    next[i] = pasted[i] || '';
                }
                return next;
            });
            focusInput(Math.min(pasted.length, OTP_LENGTH - 1));
            return;
        }

        setOtpDigits((prev) => {
            const next = [...prev];
            next[index] = nextValue;
            return next;
        });
        if (index < OTP_LENGTH - 1) {
            focusInput(index + 1);
        }
    };

    const handleDigitKeyDown = (index, event) => {
        if (event.key === 'Backspace' && !otpDigits[index] && index > 0) {
            focusInput(index - 1);
            return;
        }

        if (event.key === 'ArrowLeft' && index > 0) {
            event.preventDefault();
            focusInput(index - 1);
            return;
        }

        if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
            event.preventDefault();
            focusInput(index + 1);
        }
    };

    const requestOtp = async ({ resend = false } = {}) => {
        const normalizedEmail = normalizeEmail(email);
        if (!normalizedEmail) {
            setError('Email is required.');
            return;
        }

        setError('');
        setMessage('');
        if (resend) setIsResending(true);
        else setIsRequesting(true);

        try {
            const response = await api.post('/auth/forgot-password', { email: normalizedEmail });
            sessionStorage.setItem('pendingPasswordResetEmail', normalizedEmail);
            setStep('verify');
            setMessage(response?.data?.message || 'If your account exists, an OTP has been sent to your email.');
        } catch (requestError) {
            const fallback = 'Unable to process request right now. Please try again.';
            setError(requestError?.response?.data?.message || fallback);
        } finally {
            if (resend) setIsResending(false);
            else setIsRequesting(false);
        }
    };

    const handleRequestOtp = async (event) => {
        event.preventDefault();
        await requestOtp({ resend: false });
    };

    const handleVerifyOtp = async (event) => {
        event.preventDefault();
        const normalizedEmail = normalizeEmail(email);

        setError('');
        setMessage('');

        if (!normalizedEmail) {
            setError('Email is required.');
            return;
        }
        if (!/^\d{6}$/.test(otp)) {
            setError('Enter a valid 6-digit OTP.');
            return;
        }

        setIsVerifying(true);
        try {
            const response = await api.post('/auth/verify-otp', {
                email: normalizedEmail,
                otp
            });
            setStep('reset');
            setMessage(response?.data?.message || 'OTP verified. Set your new password.');
        } catch (requestError) {
            const fallback = 'Invalid or expired OTP.';
            setError(requestError?.response?.data?.message || fallback);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResetPassword = async (event) => {
        event.preventDefault();
        const normalizedEmail = normalizeEmail(email);

        setError('');
        setMessage('');

        if (!normalizedEmail) {
            setError('Email is required.');
            return;
        }
        if (!password) {
            setError('New password is required.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsResetting(true);
        try {
            const response = await api.post('/auth/reset-password', {
                email: normalizedEmail,
                password
            });
            sessionStorage.removeItem('pendingPasswordResetEmail');
            setStep('done');
            setMessage(response?.data?.message || 'Password reset successful.');
            setTimeout(() => {
                navigate('/login', { replace: true, state: { email: normalizedEmail } });
            }, 1200);
        } catch (requestError) {
            const fallback = 'Unable to reset password right now. Please retry.';
            setError(requestError?.response?.data?.message || fallback);
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel"
                style={{ padding: '36px', borderRadius: '20px', width: '100%', maxWidth: '460px' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '22px' }}>
                    <h2 className="gradient-text" style={{ fontSize: '1.9rem', marginBottom: '8px' }}>Forgot Password</h2>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                        {step === 'request' && 'Get an OTP to securely reset your password.'}
                        {step === 'verify' && `Enter OTP sent to ${maskEmail(email)}.`}
                        {step === 'reset' && `Set a new password for ${maskEmail(email)}.`}
                        {step === 'done' && 'Password updated. Redirecting to login...'}
                    </p>
                </div>

                {error && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '10px', borderRadius: '8px', marginBottom: '16px', textAlign: 'center', fontSize: '0.9rem' }}>
                        {error}
                    </div>
                )}

                {message && (
                    <div style={{ background: 'rgba(34, 197, 94, 0.18)', color: '#16a34a', padding: '10px', borderRadius: '8px', marginBottom: '16px', textAlign: 'center', fontSize: '0.9rem' }}>
                        {message}
                    </div>
                )}

                {step === 'request' && (
                    <form onSubmit={handleRequestOtp}>
                        <div className="search-container" style={{ marginBottom: '20px' }}>
                            <FaEnvelope style={{ position: 'absolute', left: '14px', top: '14px', color: '#64748b' }} />
                            <input
                                type="email"
                                name="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="Email Address"
                                className="search-input"
                                style={{ width: '100%', paddingLeft: '40px' }}
                                autoComplete="email"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="control-btn"
                            style={{ width: '100%', padding: '12px', background: 'var(--primary-teal)', color: 'black', fontWeight: 'bold', justifyContent: 'center' }}
                            disabled={isRequesting}
                        >
                            {isRequesting ? 'Sending OTP...' : 'Send OTP'}
                        </button>
                    </form>
                )}

                {step === 'verify' && (
                    <form onSubmit={handleVerifyOtp}>
                        <div
                            style={{
                                marginBottom: '18px',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
                                gap: '10px'
                            }}
                        >
                            {otpDigits.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(node) => { inputRefs.current[index] = node; }}
                                    type="text"
                                    value={digit}
                                    onChange={(event) => handleDigitChange(index, event.target.value)}
                                    onKeyDown={(event) => handleDigitKeyDown(index, event)}
                                    inputMode="numeric"
                                    maxLength={1}
                                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                                    style={{
                                        height: '52px',
                                        borderRadius: '14px',
                                        border: '1px solid rgba(99, 102, 241, 0.35)',
                                        background: 'rgba(15, 23, 42, 0.68)',
                                        color: '#f8fafc',
                                        fontSize: '1.32rem',
                                        fontWeight: 700,
                                        textAlign: 'center',
                                        outline: 'none',
                                        boxShadow: 'inset 0 0 0 1px rgba(59, 130, 246, 0.12), 0 6px 14px rgba(2, 6, 23, 0.25)'
                                    }}
                                    required
                                    aria-label={`OTP digit ${index + 1}`}
                                />
                            ))}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <button
                                type="submit"
                                className="control-btn"
                                style={{ padding: '12px', background: 'var(--primary-teal)', color: 'black', fontWeight: 'bold', justifyContent: 'center' }}
                                disabled={isVerifying}
                            >
                                {isVerifying ? 'Verifying...' : 'Verify OTP'}
                            </button>
                            <button
                                type="button"
                                className="control-btn"
                                onClick={() => requestOtp({ resend: true })}
                                disabled={isResending}
                                style={{ padding: '12px', justifyContent: 'center' }}
                            >
                                {isResending ? 'Resending...' : <><FaRedoAlt /> Resend</>}
                            </button>
                        </div>
                    </form>
                )}

                {step === 'reset' && (
                    <form onSubmit={handleResetPassword}>
                        <div className="search-container" style={{ marginBottom: '16px' }}>
                            <FaLock style={{ position: 'absolute', left: '14px', top: '14px', color: '#64748b' }} />
                            <input
                                type="password"
                                name="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="New Password"
                                className="search-input"
                                style={{ width: '100%', paddingLeft: '40px' }}
                                autoComplete="new-password"
                                required
                            />
                        </div>
                        <div className="search-container" style={{ marginBottom: '18px' }}>
                            <FaLock style={{ position: 'absolute', left: '14px', top: '14px', color: '#64748b' }} />
                            <input
                                type="password"
                                name="confirmPassword"
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                placeholder="Confirm New Password"
                                className="search-input"
                                style={{ width: '100%', paddingLeft: '40px' }}
                                autoComplete="new-password"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="control-btn"
                            style={{ width: '100%', padding: '12px', background: 'var(--primary-teal)', color: 'black', fontWeight: 'bold', justifyContent: 'center' }}
                            disabled={isResetting}
                        >
                            {isResetting ? 'Updating...' : 'Reset Password'}
                        </button>
                    </form>
                )}

                {step === 'done' && (
                    <button
                        type="button"
                        className="control-btn"
                        style={{ width: '100%', padding: '12px', justifyContent: 'center' }}
                        onClick={() => navigate('/login', { replace: true, state: { email } })}
                    >
                        Back to Login
                    </button>
                )}

                <div style={{ marginTop: '18px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Back to <Link to="/login" style={{ color: 'var(--primary-teal)', fontWeight: 'bold' }}>Login</Link>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
