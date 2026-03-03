import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { register, clearError, clearRegisterMessage } from '../../redux/slices/authSlice';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaLock, FaUserPlus } from 'react-icons/fa';

const RECAPTCHA_SCRIPT_ID = 'krama-recaptcha-script';
const RECAPTCHA_SCRIPT_SRC = 'https://www.google.com/recaptcha/api.js?render=explicit';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [captchaToken, setCaptchaToken] = useState('');
    const { username, email, password, confirmPassword } = formData;

    const captchaEnabled = String(import.meta.env.VITE_AUTH_CAPTCHA_ENABLED || '').trim().toLowerCase() === 'true';
    const captchaSiteKey = String(import.meta.env.VITE_RECAPTCHA_SITE_KEY || '').trim();
    const shouldRenderCaptcha = captchaEnabled && Boolean(captchaSiteKey);

    const captchaContainerRef = useRef(null);
    const captchaWidgetIdRef = useRef(null);

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const {
        isAuthenticated,
        error,
        isLoading,
        registerMessage
    } = useSelector((state) => state.auth);

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/coding-platform');
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        if (!error) return undefined;
        const timeoutId = setTimeout(() => dispatch(clearError()), 3000);
        return () => clearTimeout(timeoutId);
    }, [error, dispatch]);

    useEffect(() => {
        if (!registerMessage) return undefined;
        const timeoutId = setTimeout(() => dispatch(clearRegisterMessage()), 7000);
        return () => clearTimeout(timeoutId);
    }, [registerMessage, dispatch]);

    useEffect(() => {
        if (!shouldRenderCaptcha) return;

        const renderWidget = () => {
            if (!window.grecaptcha || !captchaContainerRef.current) return;
            if (captchaWidgetIdRef.current !== null) return;

            captchaWidgetIdRef.current = window.grecaptcha.render(captchaContainerRef.current, {
                sitekey: captchaSiteKey,
                callback: (token) => setCaptchaToken(String(token || '')),
                'expired-callback': () => setCaptchaToken(''),
                'error-callback': () => setCaptchaToken('')
            });
        };

        if (window.grecaptcha) {
            window.grecaptcha.ready(renderWidget);
            return;
        }

        const existingScript = document.getElementById(RECAPTCHA_SCRIPT_ID);
        if (existingScript) {
            existingScript.addEventListener('load', renderWidget, { once: true });
            return () => existingScript.removeEventListener('load', renderWidget);
        }

        const script = document.createElement('script');
        script.id = RECAPTCHA_SCRIPT_ID;
        script.src = RECAPTCHA_SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        script.addEventListener('load', renderWidget, { once: true });
        document.body.appendChild(script);

        return () => script.removeEventListener('load', renderWidget);
    }, [shouldRenderCaptcha, captchaSiteKey]);

    const onChange = (event) => {
        setFormData({ ...formData, [event.target.name]: event.target.value });
    };

    const onSubmit = (event) => {
        event.preventDefault();
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        if (captchaEnabled && !captchaToken) {
            alert('Please complete captcha verification');
            return;
        }

        const payload = { username, email, password };
        if (captchaEnabled) {
            payload.captchaToken = captchaToken;
        }

        dispatch(register(payload)).then((action) => {
            if (register.fulfilled.match(action) && !action.payload?.token) {
                const verificationEmail = action.payload?.verification?.email || email;
                sessionStorage.setItem('pendingVerificationEmail', verificationEmail);
                const nextQuery = new URLSearchParams({ email: verificationEmail }).toString();
                navigate(`/verify-email-otp?${nextQuery}`, {
                    state: { email: verificationEmail }
                });
            }
        });
    };

    return (
        <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel"
                style={{ padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '400px' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h2 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '10px' }}>Join Krama</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Start your coding journey today</p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '10px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', fontSize: '0.9rem' }}
                    >
                        {error}
                    </motion.div>
                )}

                {registerMessage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ background: 'rgba(34, 197, 94, 0.18)', color: '#16a34a', padding: '10px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', fontSize: '0.9rem' }}
                    >
                        {registerMessage}
                    </motion.div>
                )}

                <form onSubmit={onSubmit}>
                    <div className="search-container" style={{ marginBottom: '20px' }}>
                        <FaUser style={{ position: 'absolute', left: '14px', top: '14px', color: '#64748b' }} />
                        <input
                            type="text"
                            name="username"
                            value={username}
                            onChange={onChange}
                            placeholder="Username"
                            className="search-input"
                            style={{ width: '100%', paddingLeft: '40px' }}
                            required
                            minLength="3"
                        />
                    </div>

                    <div className="search-container" style={{ marginBottom: '20px' }}>
                        <FaEnvelope style={{ position: 'absolute', left: '14px', top: '14px', color: '#64748b' }} />
                        <input
                            type="email"
                            name="email"
                            value={email}
                            onChange={onChange}
                            placeholder="Email Address"
                            className="search-input"
                            style={{ width: '100%', paddingLeft: '40px' }}
                            required
                        />
                    </div>

                    <div className="search-container" style={{ marginBottom: '20px' }}>
                        <FaLock style={{ position: 'absolute', left: '14px', top: '14px', color: '#64748b' }} />
                        <input
                            type="password"
                            name="password"
                            value={password}
                            onChange={onChange}
                            placeholder="Password"
                            className="search-input"
                            style={{ width: '100%', paddingLeft: '40px' }}
                            required
                        />
                    </div>

                    <div className="search-container" style={{ marginBottom: '20px' }}>
                        <FaLock style={{ position: 'absolute', left: '14px', top: '14px', color: '#64748b' }} />
                        <input
                            type="password"
                            name="confirmPassword"
                            value={confirmPassword}
                            onChange={onChange}
                            placeholder="Confirm Password"
                            className="search-input"
                            style={{ width: '100%', paddingLeft: '40px' }}
                            required
                        />
                    </div>

                    {captchaEnabled && !captchaSiteKey && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '10px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', fontSize: '0.85rem' }}>
                            Captcha is enabled but site key is missing.
                        </div>
                    )}

                    {shouldRenderCaptcha && (
                        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                            <div ref={captchaContainerRef} />
                        </div>
                    )}

                    <button
                        type="submit"
                        className="control-btn"
                        style={{ width: '100%', padding: '12px', background: 'var(--primary-teal)', color: 'black', fontWeight: 'bold', justifyContent: 'center' }}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating Account...' : <><FaUserPlus /> Register</>}
                    </button>
                </form>

                <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--primary-teal)', fontWeight: 'bold' }}>Login</Link>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
