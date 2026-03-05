import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import '../styles/Dashboard.css';

const AdminDashboard = () => {
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
        { id: 'profile', label: 'Profile' },
        { id: 'problems', label: 'Problems' },
        { id: 'contests', label: 'Contests' },
        { id: 'submissions', label: 'Submissions' },
        { id: 'companies', label: 'Companies' },
        { id: 'tickets', label: 'Tickets' },
        { id: 'daily-challenges', label: 'Daily Challenges' },
        { id: 'social', label: 'Social Control' },
        { id: 'reports', label: 'Reports' },
        { id: 'audit-logs', label: 'Audit Logs' },
        { id: 'users', label: 'User Management' }
    ];

    const activeTabId = tabs.find((tab) => location.pathname.includes(`/admin/${tab.id}`))?.id || 'profile';

    return (
        <div className="dashboard-container" style={{ padding: isMobile ? '1rem 0.75rem' : undefined }}>
            <div className="dashboard-header text-center mb-10">
                <h1
                    className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2"
                    style={{ fontSize: isMobile ? '1.7rem' : '2.25rem' }}
                >
                    Admin Dashboard
                </h1>
                <p className="text-gray-400" style={{ fontSize: isMobile ? '0.92rem' : '1.125rem' }}>
                    Manage everything with ease and comfort.
                </p>
            </div>

            {isMobile ? (
                <div style={{ marginBottom: '14px' }}>
                    <label
                        htmlFor="admin-mobile-nav"
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
                        id="admin-mobile-nav"
                        value={activeTabId}
                        onChange={(event) => navigate(`/admin/${event.target.value}`)}
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
                    style={{
                        display: 'flex',
                        gap: '12px',
                        marginBottom: '20px',
                        overflowX: 'auto',
                        paddingBottom: '8px'
                    }}
                >
                    {tabs.map((tab) => (
                        <NavLink
                            key={tab.id}
                            to={tab.id}
                            style={({ isActive }) => ({
                                padding: '9px 14px',
                                borderRadius: '999px',
                                textDecoration: 'none',
                                fontSize: '0.88rem',
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                                color: isActive ? '#ffffff' : '#cbd5e1',
                                border: isActive ? '1px solid rgba(99,102,241,0.55)' : '1px solid rgba(148,163,184,0.22)',
                                background: isActive ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'rgba(15,23,42,0.55)'
                            })}
                        >
                            {tab.label}
                        </NavLink>
                    ))}
                </div>
            )}

            {/* Content Area */}
            <div className="fade-in min-h-[500px]">
                <Outlet />
            </div>
        </div>
    );
};

export default AdminDashboard;
