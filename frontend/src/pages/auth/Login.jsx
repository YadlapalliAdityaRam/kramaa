import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login, clearError } from '../../redux/slices/authSlice';
import { motion } from 'framer-motion';
import { FaUser, FaLock, FaSignInAlt, FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const { email, password } = formData;

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isAuthenticated, error, isLoading, user } = useSelector(state => state.auth);

    useEffect(() => {
        if (isAuthenticated && user) {
            const normalizedRole = String(user.role || '').toUpperCase();
            if (normalizedRole === 'SUPER_ADMIN') {
                navigate('/super-admin');
            } else if (normalizedRole === 'ADMIN') {
                navigate('/admin');
            } else {
                navigate('/coding-platform');
            }
        }
    }, [isAuthenticated, user, navigate]);

    useEffect(() => () => dispatch(clearError()), [dispatch]);

    const onChange = e => {
        if (error) dispatch(clearError());
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const goToEmailVerification = () => {
        const verificationEmail = email.trim().toLowerCase();
        if (!verificationEmail) return;
        sessionStorage.setItem('pendingVerificationEmail', verificationEmail);
        navigate(`/verify-email-otp?${new URLSearchParams({ email: verificationEmail })}`, {
            state: { email: verificationEmail }
        });
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        const action = await dispatch(login({ email: email.trim(), password }));

        // An unverified account is not a failed sign-in. Take the user straight to
        // the OTP screen and retain the email so they never need to type it again.
        if (login.rejected.match(action) && action.payload?.requiresVerification) {
            goToEmailVerification();
        }
    };

    return (
        <div className="main-content auth-page">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel auth-card"
                style={{ padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '400px' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h2 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '10px' }}>Welcome Back</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Sign in to Kramaa to continue</p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '10px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', fontSize: '0.9rem' }}
                    >
                        <span>{error}</span>
                        {error?.requiresVerification && (
                            <button
                                type="button"
                                onClick={goToEmailVerification}
                                style={{ display: 'block', margin: '8px auto 0', border: 'none', background: 'transparent', color: 'inherit', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                Verify email now
                            </button>
                        )}
                    </motion.div>
                )}

                <form onSubmit={onSubmit}>
                    <div className="search-container" style={{ marginBottom: '20px' }}>
                        <FaUser style={{ position: 'absolute', left: '14px', top: '14px', color: '#64748b' }} />
                        <input
                            type="email"
                            name="email"
                            value={email}
                            onChange={onChange}
                            placeholder="Email Address"
                            className="search-input"
                            style={{ width: '100%', paddingLeft: '40px' }}
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className="search-container" style={{ marginBottom: '10px' }}>
                        <FaLock style={{ position: 'absolute', left: '14px', top: '14px', color: '#64748b' }} />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={password}
                            onChange={onChange}
                            placeholder="Password"
                            className="search-input"
                            style={{ width: '100%', paddingLeft: '40px' }}
                            autoComplete="current-password"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            title={showPassword ? 'Hide password' : 'Show password'}
                            style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'transparent',
                                border: 'none',
                                color: '#64748b',
                                cursor: 'pointer',
                                padding: '4px'
                            }}
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                        <Link
                            to="/forgot-password"
                            state={{ email }}
                            style={{ color: 'var(--primary-teal)', fontWeight: 700, fontSize: '0.86rem' }}
                        >
                            Forgot password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        className="control-btn"
                        style={{ width: '100%', padding: '12px', background: 'var(--primary-teal)', color: 'black', fontWeight: 'bold', justifyContent: 'center' }}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Signing In...' : <><FaSignInAlt /> Sign In</>}
                    </button>
                </form>

                <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Don't have an account? <Link to="/register" style={{ color: 'var(--primary-teal)', fontWeight: 'bold' }}>Register</Link>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
