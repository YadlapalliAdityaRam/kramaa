import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api, { getCurrentSocketBaseUrl, getSocketClientOptions } from '../../utils/api';
import { FaUserShield, FaEnvelope, FaBrain, FaTrophy, FaChartLine, FaCheckCircle, FaTimesCircle, FaSearch } from 'react-icons/fa';
import { motion } from 'framer-motion';

const SUPER_ADMIN_REFRESH_EVENT = 'superadmin:refresh';
const REFRESH_SECTIONS = new Set(['admins', 'stats', 'analytics']);

const AdminMasterList = () => {
    const navigate = useNavigate();
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAdmins = useCallback(async () => {
        try {
            const res = await api.get('/admin/analytics/admins');
            setAdmins(res.data.admins || []);
        } catch (err) {
            console.error("Failed to fetch admin list", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAdmins();
    }, [fetchAdmins]);

    useEffect(() => {
        const timer = setInterval(() => {
            fetchAdmins();
        }, 10000);
        return () => clearInterval(timer);
    }, [fetchAdmins]);

    useEffect(() => {
        const socket = io(getCurrentSocketBaseUrl(), getSocketClientOptions());

        const onConnect = () => {
            socket.emit('superadmin:subscribe');
        };

        const onRealtimeRefresh = (payload = {}) => {
            const sections = Array.isArray(payload?.sections) ? payload.sections : [];
            const shouldRefresh = sections.length === 0
                || sections.some((section) => REFRESH_SECTIONS.has(String(section || '').toLowerCase()));

            if (shouldRefresh) {
                fetchAdmins();
            }
        };

        socket.on('connect', onConnect);
        socket.on(SUPER_ADMIN_REFRESH_EVENT, onRealtimeRefresh);

        return () => {
            socket.emit('superadmin:unsubscribe');
            socket.off('connect', onConnect);
            socket.off(SUPER_ADMIN_REFRESH_EVENT, onRealtimeRefresh);
            socket.disconnect();
        };
    }, [fetchAdmins]);

    const filteredAdmins = admins.filter(admin =>
        admin.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (isActive) => {
        return isActive ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400 flex items-center gap-1 w-fit">
                <FaCheckCircle /> Active
            </span>
        ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 flex items-center gap-1 w-fit">
                <FaTimesCircle /> Disabled
            </span>
        );
    };

    return (
        <div style={{ padding: '0.5rem 0' }}>
            <div className="sa-card">
                <div className="sa-card-header" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h2 className="sa-card-title">
                            <FaUserShield style={{ color: 'var(--sa-accent)' }} /> Admin Master List
                        </h2>
                        <p style={{ color: 'var(--sa-text-muted)', fontSize: '0.86rem', margin: '0.3rem 0 0 0' }}>
                            Monitor admin performance, question curation, and contest contributions
                        </p>
                    </div>
                    <div style={{ position: 'relative', width: 'min(320px, 100%)' }}>
                        <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--sa-text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search admins..."
                            className="sa-input"
                            style={{ paddingLeft: '36px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="sa-empty-text" style={{ padding: '3rem 0' }}>
                        <p>Loading admin data...</p>
                    </div>
                ) : filteredAdmins.length === 0 ? (
                    <div className="sa-empty-text" style={{ padding: '3rem 0' }}>
                        <FaUserShield style={{ fontSize: '2.5rem', margin: '0 auto 0.75rem', opacity: 0.4 }} />
                        <p>No admins found matching your search.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.2rem' }}>
                        {filteredAdmins.map((admin, index) => (
                            <motion.div
                                key={admin._id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.04 }}
                                className="sa-stat-card"
                                style={{ padding: '1.4rem', border: '1px solid var(--sa-border)', borderRadius: '16px' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.2rem', gap: '0.8rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                        <div style={{
                                            width: '46px', height: '46px', borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: '#ffffff', fontWeight: '800', fontSize: '1.2rem',
                                            boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)'
                                        }}>
                                            {admin.username[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', margin: '0 0 0.2rem 0', color: 'var(--sa-text)' }}>
                                                {admin.username}
                                            </h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--sa-text-muted)', fontSize: '0.78rem' }}>
                                                <FaEnvelope style={{ fontSize: '0.72rem' }} /> {admin.email}
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`sa-badge ${admin.isActive ? 'sa-badge-green' : 'sa-badge-red'}`}>
                                        {admin.isActive ? <><FaCheckCircle /> Active</> : <><FaTimesCircle /> Disabled</>}
                                    </span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.2rem' }}>
                                    <div style={{ background: 'var(--sa-pill-inactive)', borderRadius: '12px', padding: '0.8rem', border: '1px solid var(--sa-border-subtle)' }}>
                                        <div style={{ color: 'var(--sa-text-muted)', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                                            <FaBrain style={{ color: 'var(--sa-accent-blue)' }} /> Problems
                                        </div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--sa-text)' }}>{admin.totalProblems || 0}</div>
                                    </div>
                                    <div style={{ background: 'var(--sa-pill-inactive)', borderRadius: '12px', padding: '0.8rem', border: '1px solid var(--sa-border-subtle)' }}>
                                        <div style={{ color: 'var(--sa-text-muted)', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                                            <FaTrophy style={{ color: '#eab308' }} /> Contests
                                        </div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--sa-text)' }}>{admin.totalContests || 0}</div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => navigate(`admin/${admin._id}`)}
                                    className="sa-btn sa-btn-primary"
                                    style={{ width: '100%', justifyContent: 'center', borderRadius: '10px', padding: '0.65rem' }}
                                >
                                    <FaChartLine /> View Detailed Analytics
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminMasterList;
