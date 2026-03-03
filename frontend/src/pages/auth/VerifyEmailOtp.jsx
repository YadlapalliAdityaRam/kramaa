import React, { useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import api from '../../utils/api';
import { loadUser } from '../../redux/slices/authSlice';

const OTP_LENGTH = 6;

const VerifyEmailOtp = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const inputRefs = useRef([]);

    const initialEmail = useMemo(() => {
        const stateEmail = String(location.state?.email || '').trim().toLowerCase();
        if (stateEmail) return stateEmail;
        const query = new URLSearchParams(location.search || '');
        const queryEmail = String(query.get('email') || '').trim().toLowerCase();
        if (queryEmail) return queryEmail;
        return String(sessionStorage.getItem('pendingVerificationEmail') || '').trim().toLowerCase();
    }, [location.search, location.state]);

    const [otpDigits, setOtpDigits] = useState(Array.from({ length: OTP_LENGTH }, () => ''));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const otp = otpDigits.join('');

    const maskEmail = (email) => {
        const [namePart, domainPart] = String(email || '').split('@');
        if (!namePart || !domainPart) return email || '';
        const visible = namePart.slice(0, 2);
        const masked = '*'.repeat(Math.max(1, namePart.length - 2));
        return `${visible}${masked}@${domainPart}`;
    };

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

    const handleVerify = async (event) => {
        event.preventDefault();
        setError('');
        setMessage('');

        const normalizedEmail = String(initialEmail || '').trim().toLowerCase();
        const normalizedOtp = String(otp || '').trim();

        if (!normalizedEmail) {
            setError('Verification email is missing. Please register again.');
            return;
        }
        if (!/^\d{6}$/.test(normalizedOtp)) {
            setError('Enter a valid 6-digit OTP.');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await api.post('/auth/verify-email-otp', {
                email: normalizedEmail,
                otp: normalizedOtp
            });

            const token = response?.data?.token;
            const user = response?.data?.user;
            if (token && user) {
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
            }
            sessionStorage.removeItem('pendingVerificationEmail');

            await dispatch(loadUser());
            setMessage(response?.data?.message || 'Email verified successfully.');
            navigate('/coding-platform', { replace: true });
        } catch (requestError) {
            const fallback = 'OTP verification failed. Please try again.';
            const nextError = requestError?.response?.data?.message || fallback;
            setError(nextError);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResendOtp = async () => {
        setError('');
        setMessage('');

        const normalizedEmail = String(initialEmail || '').trim().toLowerCase();
        if (!normalizedEmail) {
            setError('Verification email is missing. Please register again.');
            return;
        }

        setIsResending(true);
        try {
            const response = await api.post('/auth/resend-verification-otp', {
                email: normalizedEmail
            });
            setMessage(response?.data?.message || 'OTP resent successfully. Please check your inbox.');
        } catch (requestError) {
            const fallback = 'Unable to resend OTP right now.';
            const nextError = requestError?.response?.data?.message || fallback;
            setError(nextError);
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div
            className="main-content"
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}
        >
            <div
                className="glass-panel"
                style={{ padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '420px' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <h2 className="gradient-text" style={{ fontSize: '1.9rem', marginBottom: '8px' }}>
                        Verify Email OTP
                    </h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Enter the 6-digit OTP sent to your email.
                    </p>
                </div>

                <div
                    style={{
                        marginBottom: '18px',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        background: 'rgba(37, 99, 235, 0.12)',
                        border: '1px solid rgba(96, 165, 250, 0.4)',
                        color: '#dbeafe',
                        textAlign: 'center',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        letterSpacing: '0.02em'
                    }}
                >
                    {maskEmail(initialEmail)}
                </div>

                {error && (
                    <div
                        style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            color: '#ef4444',
                            padding: '10px',
                            borderRadius: '8px',
                            marginBottom: '16px',
                            textAlign: 'center',
                            fontSize: '0.9rem'
                        }}
                    >
                        {error}
                    </div>
                )}

                {message && (
                    <div
                        style={{
                            background: 'rgba(34, 197, 94, 0.18)',
                            color: '#16a34a',
                            padding: '10px',
                            borderRadius: '8px',
                            marginBottom: '16px',
                            textAlign: 'center',
                            fontSize: '0.9rem'
                        }}
                    >
                        {message}
                    </div>
                )}

                <form onSubmit={handleVerify}>
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
                                ref={(node) => {
                                    inputRefs.current[index] = node;
                                }}
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

                    <button
                        type="submit"
                        className="control-btn"
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: 'var(--primary-teal)',
                            color: 'black',
                            fontWeight: 'bold',
                            justifyContent: 'center'
                        }}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Verifying...' : 'Verify OTP'}
                    </button>
                </form>

                <button
                    type="button"
                    className="control-btn"
                    onClick={handleResendOtp}
                    disabled={isResending}
                    style={{
                        width: '100%',
                        padding: '12px',
                        marginTop: '12px',
                        justifyContent: 'center'
                    }}
                >
                    {isResending ? 'Resending...' : 'Resend OTP'}
                </button>

                <div style={{ marginTop: '18px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Back to <Link to="/login" style={{ color: 'var(--primary-teal)', fontWeight: 'bold' }}>Login</Link>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmailOtp;
