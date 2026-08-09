import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api, { getCurrentSocketBaseUrl, getSocketClientOptions } from '../../utils/api';
import { FaArrowLeft, FaBrain, FaTrophy, FaCheckCircle, FaMedal } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const SUPER_ADMIN_REFRESH_EVENT = 'superadmin:refresh';
const REFRESH_SECTIONS = new Set(['stats', 'analytics']);

const MeasuredChart = ({ className = '', children }) => {
    const hostRef = useRef(null);
    const [size, setSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const host = hostRef.current;
        if (!host) return undefined;

        const updateSize = () => {
            const nextWidth = Math.floor(host.clientWidth || 0);
            const nextHeight = Math.floor(host.clientHeight || 0);
            setSize((prev) => (
                prev.width === nextWidth && prev.height === nextHeight
                    ? prev
                    : { width: nextWidth, height: nextHeight }
            ));
        };

        updateSize();

        if (typeof ResizeObserver === 'undefined') {
            window.addEventListener('resize', updateSize);
            return () => window.removeEventListener('resize', updateSize);
        }

        const observer = new ResizeObserver(() => updateSize());
        observer.observe(host);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={hostRef} className={className}>
            {size.width > 0 && size.height > 0 ? (
                children(size)
            ) : null}
        </div>
    );
};

const AdminAnalytics = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('problems'); // problems | contests

    const fetchAnalytics = useCallback(async (silent = false) => {
        if (!silent) {
            setLoading(true);
        }
        try {
            const res = await api.get(`/admin/analytics/admin/${id}`);
            setData(res.data);
        } catch (err) {
            console.error("Failed to fetch analytics", err);
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    }, [id]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    useEffect(() => {
        const timer = setInterval(() => {
            fetchAnalytics(true);
        }, 10000);
        return () => clearInterval(timer);
    }, [fetchAnalytics]);

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
                fetchAnalytics(true);
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
    }, [fetchAnalytics]);

    if (loading) return <div className="text-center py-20 text-gray-400">Loading analytics...</div>;
    if (!data) return <div className="text-center py-20 text-red-400">Admin not found</div>;

    const { admin, problemStats, contestStats } = data;
    const formatContestStatus = (status) => {
        const normalized = String(status || '').trim().toLowerCase();
        if (normalized === 'running' || normalized === 'active') return { label: 'ACTIVE', className: 'bg-green-500/20 text-green-400' };
        if (normalized === 'completed') return { label: 'COMPLETED', className: 'bg-blue-500/20 text-blue-400' };
        if (normalized === 'cancelled' || normalized === 'canceled' || normalized === 'rejected') return { label: 'CANCELLED', className: 'bg-red-500/20 text-red-400' };
        return { label: 'SCHEDULED', className: 'bg-yellow-500/20 text-yellow-400' };
    };


    // Chart Data Preparation
    const statusData = [
        { name: 'Active', value: problemStats.statusDistribution.active, color: '#22c55e' }, // Green
        { name: 'Pending', value: problemStats.statusDistribution.pending, color: '#fbbf24' } // Yellow
    ].filter(d => d.value > 0);

    const difficultyData = [
        { name: 'Easy', count: problemStats.difficultyDistribution.easy, fill: '#22c55e' },
        { name: 'Medium', count: problemStats.difficultyDistribution.medium, fill: '#fbbf24' },
        { name: 'Hard', count: problemStats.difficultyDistribution.hard, fill: '#ef4444' }
    ];

    const contestStatusData = [
        { name: 'Active', value: contestStats.statusDistribution.active, color: '#22c55e' },
        { name: 'Completed', value: contestStats.statusDistribution.completed, color: '#3b82f6' },
        { name: 'Scheduled', value: contestStats.statusDistribution.scheduled, color: '#fbbf24' },
        { name: 'Cancelled', value: contestStats.statusDistribution.cancelled, color: '#ef4444' }
    ].filter(d => d.value > 0);

    return (
        <div style={{ padding: '0.5rem 0' }}>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: '1.8rem' }}
            >
                <button
                    onClick={() => navigate('/super-admin/problems')}
                    className="sa-btn sa-btn-secondary"
                    style={{ marginBottom: '1rem', padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
                >
                    <FaArrowLeft /> Back to Master List
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', flexWrap: 'wrap' }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.6rem', fontWeight: '800', color: '#ffffff',
                        boxShadow: '0 4px 16px rgba(168, 85, 247, 0.35)'
                    }}>
                        {(admin?.username || 'A')[0].toUpperCase()}
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: '0 0 0.2rem 0', color: 'var(--sa-text)' }}>{admin?.username}</h1>
                        <p style={{ color: 'var(--sa-text-muted)', fontSize: '0.88rem', margin: 0 }}>
                            {admin?.email} • Joined {new Date(admin?.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.8rem' }}>
                <div className="sa-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem' }}>
                    <div>
                        <span style={{ color: 'var(--sa-text-muted)', fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Problems</span>
                        <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--sa-text)', marginTop: '0.2rem' }}>{problemStats.total}</div>
                    </div>
                    <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
                        <FaBrain style={{ fontSize: '1.5rem' }} />
                    </div>
                </div>

                <div className="sa-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem' }}>
                    <div>
                        <span style={{ color: 'var(--sa-text-muted)', fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed Contests</span>
                        <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--sa-text)', marginTop: '0.2rem' }}>{contestStats.completed} / {contestStats.total}</div>
                    </div>
                    <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
                        <FaTrophy style={{ fontSize: '1.5rem' }} />
                    </div>
                </div>

                <div className="sa-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem' }}>
                    <div>
                        <span style={{ color: 'var(--sa-text-muted)', fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Rate</span>
                        <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#16a34a', marginTop: '0.2rem' }}>
                            {problemStats.total > 0
                                ? Math.round((problemStats.statusDistribution.active / problemStats.total) * 100)
                                : 0}%
                        </div>
                    </div>
                    <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
                        <FaCheckCircle style={{ fontSize: '1.5rem' }} />
                    </div>
                </div>

                <div className="sa-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem' }}>
                    <div>
                        <span style={{ color: 'var(--sa-text-muted)', fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Participants</span>
                        <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#d97706', marginTop: '0.2rem' }}>{contestStats.totalParticipants}</div>
                    </div>
                    <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                        <FaMedal style={{ fontSize: '1.5rem' }} />
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.2rem', marginBottom: '1.8rem' }}>
                <div className="sa-card">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 1rem 0', color: 'var(--sa-text)' }}>Problem Distribution</h3>
                    <div style={{ height: '220px', display: 'flex', alignItems: 'center' }}>
                        <MeasuredChart className="w-full h-full">
                            {({ width, height }) => (
                                <BarChart width={width} height={height} data={difficultyData}>
                                    <XAxis dataKey="name" stroke="var(--sa-text-muted)" fontSize={12} tickLine={false} />
                                    <YAxis stroke="var(--sa-text-muted)" fontSize={12} tickLine={false} />
                                    <Tooltip contentStyle={{ background: 'var(--sa-card-bg)', borderColor: 'var(--sa-border)', borderRadius: '8px', color: 'var(--sa-text)' }} />
                                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                        {difficultyData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            )}
                        </MeasuredChart>
                    </div>
                </div>

                <div className="sa-card">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 1rem 0', color: 'var(--sa-text)' }}>Contest Status Breakdown</h3>
                    <div style={{ height: '220px', display: 'flex', alignItems: 'center' }}>
                        <MeasuredChart className="w-full h-full">
                            {({ width, height }) => (
                                <PieChart width={width} height={height}>
                                    <Pie data={contestStatusData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                                        {contestStatusData.map((entry, index) => (
                                            <Cell key={`cell-contest-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: 'var(--sa-card-bg)', borderColor: 'var(--sa-border)', borderRadius: '8px', color: 'var(--sa-text)' }} />
                                    <Legend formatter={(val) => <span style={{ color: 'var(--sa-text)', fontSize: '0.8rem' }}>{val}</span>} />
                                </PieChart>
                            )}
                        </MeasuredChart>
                    </div>
                </div>
            </div>

            {/* Sub-Tabs: Problems vs Contests */}
            <div className="sa-card">
                <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--sa-border)', paddingBottom: '0.8rem', marginBottom: '1rem' }}>
                    <button
                        onClick={() => setActiveTab('problems')}
                        style={{
                            padding: '8px 18px', borderRadius: '999px', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', border: 'none',
                            background: activeTab === 'problems' ? 'linear-gradient(135deg, #a855f7, #6366f1)' : 'var(--sa-pill-inactive)',
                            color: activeTab === 'problems' ? '#ffffff' : 'var(--sa-text-muted)'
                        }}
                    >
                        Problems Created ({problemStats.total})
                    </button>
                    <button
                        onClick={() => setActiveTab('contests')}
                        style={{
                            padding: '8px 18px', borderRadius: '999px', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', border: 'none',
                            background: activeTab === 'contests' ? 'linear-gradient(135deg, #a855f7, #6366f1)' : 'var(--sa-pill-inactive)',
                            color: activeTab === 'contests' ? '#ffffff' : 'var(--sa-text-muted)'
                        }}
                    >
                        Contests Managed ({contestStats.total})
                    </button>
                </div>

                {activeTab === 'problems' ? (
                    <div className="sa-table-container">
                        <table className="sa-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Difficulty</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(problemStats.list || []).map((p) => (
                                    <tr key={p._id}>
                                        <td style={{ fontWeight: '600' }}>{p.title}</td>
                                        <td>
                                            <span className={`sa-badge ${p.difficulty === 'Easy' ? 'sa-badge-green' : p.difficulty === 'Medium' ? 'sa-badge-purple' : 'sa-badge-red'}`}>
                                                {p.difficulty}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--sa-text-muted)', fontSize: '0.82rem' }}>
                                            {new Date(p.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                                {(!problemStats.list || problemStats.list.length === 0) && (
                                    <tr>
                                        <td colSpan="3" className="sa-empty-row">No problems created by this admin.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="sa-table-container">
                        <table className="sa-table">
                            <thead>
                                <tr>
                                    <th>Contest Title</th>
                                    <th>Status</th>
                                    <th>Start Time</th>
                                    <th>Participants</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(contestStats.list || []).map((c) => (
                                    <tr key={c._id}>
                                        <td style={{ fontWeight: '600' }}>{c.title}</td>
                                        <td>
                                            <span className="sa-badge sa-badge-blue">{c.status || 'SCHEDULED'}</span>
                                        </td>
                                        <td style={{ color: 'var(--sa-text-muted)', fontSize: '0.82rem' }}>
                                            {new Date(c.startTime).toLocaleString()}
                                        </td>
                                        <td style={{ fontWeight: '600' }}>{c.participantCount || 0}</td>
                                    </tr>
                                ))}
                                {(!contestStats.list || contestStats.list.length === 0) && (
                                    <tr>
                                        <td colSpan="4" className="sa-empty-row">No contests managed by this admin.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminAnalytics;
