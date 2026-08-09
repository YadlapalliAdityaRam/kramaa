import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/SuperAdmin.css';

const SuperAdminDashboard = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(() => (
        typeof window !== 'undefined' ? window.innerWidth <= 768 : false
    ));

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const tabs = [
        { id: 'profile', label: 'Profile', color: 'violet' },
        { id: 'admins', label: 'Admin Management', color: 'violet' },
        { id: 'problems', label: 'Problem Master List', color: 'blue' },
        { id: 'contests', label: 'Contest Management', color: 'indigo' },
        { id: 'daily-challenges', label: 'Daily Challenges', color: 'blue' },
        { id: 'social', label: 'Social Control', color: 'violet' },
        { id: 'reports', label: 'Moderation Reports', color: 'orange' },
        { id: 'audit', label: 'Audit Logs', color: 'amber' },
        { id: 'health', label: 'System Health', color: 'rose' },
        { id: 'emergency', label: 'Emergency Zone', color: 'red' }
    ];

    const getGradient = (color) => {
        const gradients = {
            violet: 'from-violet-600 to-purple-600',
            indigo: 'from-indigo-500 to-blue-600',
            blue: 'from-blue-500 to-cyan-500',
            amber: 'from-amber-400 to-orange-500',
            rose: 'from-rose-500 to-pink-600',
            red: 'from-red-600 to-orange-600'
        };
        return gradients[color] || gradients.violet;
    };

    return (
        <div className="sa-container" style={{ padding: isMobile ? '1rem 0.75rem' : undefined }}>
            <div className="sa-header text-center mb-10">
                <h1
                    className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-2"
                    style={{ fontSize: isMobile ? '1.7rem' : '2.25rem' }}
                >
                    Super Admin Dashboard
                </h1>
                <p className="text-gray-400" style={{ fontSize: isMobile ? '0.92rem' : '1.125rem' }}>
                    Manage system access, view logs, and monitor health.
                </p>
            </div>

            {isMobile ? (
                <div style={{ marginBottom: '14px' }}>
                    <label
                        htmlFor="super-admin-mobile-nav"
                        style={{
                            display: 'block',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: '#94a3b8',
                            marginBottom: '8px'
                        }}
                    >
                        Section
                    </label>
                    <select
                        id="super-admin-mobile-nav"
                        value={tabs.find((tab) => location.pathname.includes(`/super-admin/${tab.id}`))?.id || 'profile'}
                        onChange={(event) => navigate(`/super-admin/${event.target.value}`)}
                        style={{
                            width: '100%',
                            minHeight: '42px',
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.14)',
                            background: 'rgba(15,23,42,0.78)',
                            color: '#e2e8f0',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            padding: '9px 12px',
                            outline: 'none'
                        }}
                    >
                        {tabs.map((tab) => (
                            <option key={tab.id} value={tab.id}>
                                {tab.label}
                            </option>
                        ))}
                    </select>
                </div>
            ) : (
                <div
                    className="sa-nav-wrapper"
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px',
                        padding: '6px',
                        borderRadius: '999px',
                        background: 'var(--sa-pill-inactive)',
                        border: '1px solid var(--sa-border)',
                        marginBottom: '2.5rem',
                        maxWidth: '100%',
                        justifyContent: 'center'
                    }}
                >
                    {tabs.map((tab) => {
                        return (
                            <NavLink
                                key={tab.id}
                                to={tab.id}
                                style={{
                                    padding: '8px 18px',
                                    position: 'relative',
                                    borderRadius: '999px',
                                    fontSize: '0.84rem',
                                    fontWeight: '700',
                                    letterSpacing: '0.02em',
                                    whiteSpace: 'nowrap',
                                    textDecoration: 'none',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease',
                                    cursor: 'pointer'
                                }}
                            >
                                {({ isActive }) => (
                                    <>
                                        {isActive && (
                                            <motion.div
                                                layoutId="active-pill"
                                                className={`absolute inset-0 rounded-full bg-gradient-to-r ${getGradient(tab.color)} shadow-md`}
                                                initial={false}
                                                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                            />
                                        )}
                                        <span
                                            style={{
                                                position: 'relative',
                                                zIndex: 10,
                                                color: isActive ? '#ffffff' : 'var(--sa-pill-text)',
                                                transition: 'color 0.2s ease'
                                            }}
                                        >
                                            {tab.label}
                                        </span>
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </div>
            )}

            {/* Content with Transition */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="w-full"
                >
                    <Outlet />
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default SuperAdminDashboard;
