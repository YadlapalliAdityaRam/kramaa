import React, { useEffect, useState } from 'react';
import api from '../../../utils/api';
import { FaExclamationTriangle, FaHeartbeat, FaServer, FaShieldAlt, FaUsers } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const INITIAL_STATS = {
    health: {
        status: 'Unknown',
        systemLoad: '-',
        errorRate: '-'
    },
    users: {
        total: 0
    }
};

const SystemHealth = () => {
    const [stats, setStats] = useState(INITIAL_STATS);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [emergencyReason, setEmergencyReason] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isMobile, setIsMobile] = useState(() => (
        typeof window !== 'undefined' ? window.innerWidth <= 768 : false
    ));

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const fetchHealth = async () => {
        try {
            const res = await api.get('/admin/health');
            setStats(res?.data?.stats || INITIAL_STATS);
        } catch (err) {
            setStats(INITIAL_STATS);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHealth();
        const interval = setInterval(fetchHealth, 30000);
        return () => clearInterval(interval);
    }, []);

    const initiateEmergency = (action) => {
        setPendingAction(action);
        setEmergencyReason('');
        setConfirmPassword('');
        setShowModal(true);
    };

    const handleConfirmEmergency = async (e) => {
        e.preventDefault();
        if (!emergencyReason || !confirmPassword) {
            toast.error('Reason and Password are required!');
            return;
        }

        try {
            await api.post('/admin/emergency', {
                action: pendingAction,
                reason: emergencyReason,
                password: confirmPassword
            });
            toast.success(`${pendingAction} executed successfully.`);
            setShowModal(false);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to execute emergency action.');
        }
    };

    if (loading) {
        return <div className="text-gray-500">Loading health data...</div>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
            {showModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        backdropFilter: 'blur(5px)',
                        padding: '12px'
                    }}
                >
                    <div className="sa-card" style={{ width: '100%', maxWidth: '500px', border: '1px solid #ef4444', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                        <div className="sa-card-header">
                            <h2 className="sa-card-title" style={{ color: '#ef4444' }}>
                                <FaShieldAlt /> CONFIRM EMERGENCY ACTION
                            </h2>
                        </div>
                        <p style={{ color: 'var(--sa-text)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                            You are about to execute: <strong style={{ color: '#ef4444' }}>{pendingAction}</strong>
                        </p>
                        <form onSubmit={handleConfirmEmergency} className="sa-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            <label style={{ color: 'var(--sa-text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Reason (Required)</label>
                            <input
                                type="text"
                                className="sa-input"
                                value={emergencyReason}
                                onChange={(e) => setEmergencyReason(e.target.value)}
                                placeholder="Why are you doing this?"
                                autoFocus
                            />

                            <label style={{ color: 'var(--sa-text-muted)', fontSize: '0.85rem', fontWeight: '600', marginTop: '0.6rem' }}>Confirm Password</label>
                            <input
                                type="password"
                                className="sa-input"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Enter your password"
                            />

                            <div
                                style={{
                                    display: 'flex',
                                    gap: '0.8rem',
                                    marginTop: '1.2rem',
                                    justifyContent: 'flex-end',
                                    flexWrap: isMobile ? 'wrap' : 'nowrap'
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="sa-btn sa-btn-secondary"
                                    style={{ width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="sa-btn sa-btn-danger"
                                    style={{ width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}
                                >
                                    CONFIRM ACTION
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div className="sa-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
                    <div style={{ padding: '0.75rem', background: 'rgba(34, 197, 94, 0.15)', borderRadius: '12px', color: '#16a34a' }}>
                        <FaHeartbeat size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--sa-text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>System Status</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--sa-text)' }}>{stats?.health?.status || 'Unknown'}</div>
                    </div>
                </div>
                <div className="sa-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
                    <div style={{ padding: '0.75rem', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '12px', color: '#3b82f6' }}>
                        <FaUsers size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--sa-text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active Users</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--sa-text)' }}>{Number(stats?.users?.total || 0)}</div>
                    </div>
                </div>
                <div className="sa-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
                    <div style={{ padding: '0.75rem', background: 'rgba(168, 85, 247, 0.15)', borderRadius: '12px', color: '#a855f7' }}>
                        <FaServer size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--sa-text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>System Load</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--sa-text)' }}>{stats?.health?.systemLoad || '-'}</div>
                    </div>
                </div>
                <div className="sa-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
                    <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.15)', borderRadius: '12px', color: '#ef4444' }}>
                        <FaExclamationTriangle size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--sa-text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Error Rate (24h)</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--sa-text)' }}>{stats?.health?.errorRate || '-'}</div>
                    </div>
                </div>
            </div>

            <div className="sa-card" style={{ border: '1px solid rgba(239, 68, 68, 0.35)', padding: '1.5rem' }}>
                <div className="sa-card-header" style={{ marginBottom: '0.6rem' }}>
                    <h3 className="sa-card-title" style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FaShieldAlt /> System Emergency Actions
                    </h3>
                </div>
                <p style={{ color: 'var(--sa-text-muted)', fontSize: '0.88rem', margin: '0 0 1.2rem 0' }}>
                    Trigger immediate security responses. These actions require password confirmation and are recorded in the audit log.
                </p>
                <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => initiateEmergency('MAINTENANCE_MODE')}
                        className="sa-btn sa-btn-danger"
                        style={{ padding: '0.65rem 1.2rem' }}
                    >
                        Trigger Maintenance Mode
                    </button>
                    <button
                        onClick={() => initiateEmergency('SYSTEM_LOCKDOWN')}
                        className="sa-btn sa-btn-danger"
                        style={{ padding: '0.65rem 1.2rem' }}
                    >
                        Initiate System Lockdown
                    </button>
                    <button
                        onClick={() => initiateEmergency('PURGE_CACHE')}
                        className="sa-btn sa-btn-secondary"
                        style={{ padding: '0.65rem 1.2rem' }}
                    >
                        Purge Application Cache
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SystemHealth;
