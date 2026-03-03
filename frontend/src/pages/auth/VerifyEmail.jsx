import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../utils/api';

const VerifyEmail = () => {
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(true);
    const [success, setSuccess] = useState(false);
    const [message, setMessage] = useState('Verifying your email...');

    const token = useMemo(() => {
        const query = new URLSearchParams(location.search || '');
        return String(query.get('token') || '').trim();
    }, [location.search]);

    useEffect(() => {
        const verify = async () => {
            if (!token) {
                setIsLoading(false);
                setSuccess(false);
                setMessage('Verification token is missing.');
                return;
            }

            try {
                const response = await api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`);
                setSuccess(Boolean(response?.data?.success));
                setMessage(response?.data?.message || 'Email verified successfully. You can now log in.');
            } catch (error) {
                const nextMessage =
                    error?.response?.data?.message ||
                    'Unable to verify email. Please request a new verification link.';
                setSuccess(false);
                setMessage(nextMessage);
            } finally {
                setIsLoading(false);
            }
        };

        verify();
    }, [token]);

    return (
        <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="glass-panel" style={{ padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '460px', textAlign: 'center' }}>
                <h2 className="gradient-text" style={{ fontSize: '1.8rem', marginBottom: '16px' }}>
                    Email Verification
                </h2>
                <p style={{ color: success ? '#16a34a' : '#ef4444', minHeight: '24px' }}>
                    {isLoading ? 'Please wait...' : message}
                </p>
                {!isLoading && (
                    <div style={{ marginTop: '24px' }}>
                        <Link to="/login" style={{ color: 'var(--primary-teal)', fontWeight: 'bold' }}>
                            Go to Login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
