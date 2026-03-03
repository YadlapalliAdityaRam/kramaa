import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { FaHeartbeat, FaServer, FaUsers, FaExclamationTriangle, FaShieldAlt } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const SystemHealth = () => {
    const [showModal, setShowModal] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [confirmPassword, setConfirmPassword] = useState('');

    const fetchHealth = async () => {
        try {
            const res = await api.get('/admin/health');
            setStats(res.data.stats);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHealth();
        const interval = setInterval(fetchHealth, 30000); // Poll every 30s
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
            toast.error("Reason and Password are required!");
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
            toast.error(err.response?.data?.message || "Failed to execute emergency action.");
        }
    };

    if (loading) return <div className="text-gray-500">Loading health data...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
            {/* Modal Overlay */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, backdropFilter: 'blur(5px)'
                }}>
                    <div className="sa-card" style={{ width: '100%', maxWidth: '500px', border: '1px solid #ef4444' }}>
                        <div className="sa-card-header">
                            <h2 className="sa-card-title" style={{ color: '#ef4444' }}>
                                <FaShieldAlt /> CONFIRM EMERGENCY ACTION
                            </h2>
                        </div>
                        <p style={{ color: 'white', marginBottom: '1rem' }}>
                            You are about to execute: <strong>{pendingAction}</strong>
                        </p>
                        <form onSubmit={handleConfirmEmergency} className="sa-form-group" style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={{ color: '#ccc', fontSize: '0.9rem' }}>Reason (Required)</label>
                            <input
                                type="text"
                                className="sa-input"
                                value={emergencyReason}
                                onChange={e => setEmergencyReason(e.target.value)}
                                placeholder="Why are you doing this?"
                                autoFocus
                            />

                            <label style={{ color: '#ccc', fontSize: '0.9rem', marginTop: '1rem' }}>Confirm Password</label>
                            <input
                                type="password"
                                className="sa-input"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="Enter your password"
                            />

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="sa-btn"
                                    style={{ background: '#333', color: '#ccc' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="sa-btn sa-btn-danger"
                                >
                                    CONFIRM ACTION
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Health Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div className="sa-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px', color: '#4ade80' }}>
                        <FaHeartbeat size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>System Status</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{stats?.health?.status}</div>
                    </div>
                </div>
                <div className="sa-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', color: '#60a5fa' }}>
                        <FaUsers size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Active Users</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{stats?.users?.total}</div>
                    </div>
                </div>
                <div className="sa-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '8px', color: '#c084fc' }}>
                        <FaServer size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>System Load</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{stats?.health?.systemLoad}</div>
                    </div>
                </div>
                <div className="sa-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', color: '#f87171' }}>
                        <FaExclamationTriangle size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Error Rate (24h)</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{stats?.health?.errorRate}</div>
                    </div>
                </div>
            </div>

            {/* Emergency Controls */}
            <div className="sa-card" style={{ border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                <div className="sa-card-header">
                    <h2 className="sa-card-title" style={{ color: '#f87171' }}>
                        <FaShieldAlt /> EMERGENCY ZONE
                    </h2>
                </div>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    These actions are irreversible or have major impact. <span style={{ color: '#f87171', fontWeight: 'bold' }}>Reason and Password Confirmation Required.</span>
                </p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => initiateEmergency('MAINTENANCE_MODE')}
                        className="sa-btn sa-btn-danger"
                    >
                        Enable Maintenance Mode
                    </button>
                    <button
                        onClick={() => initiateEmergency('PAUSE_CONTESTS')}
                        className="sa-btn sa-btn-danger"
                    >
                        Pause All Contests
                    </button>
                    {/* Add more buttons as needed */}
                </div>
            </div>
        </div>
    );
};

export default SystemHealth;
