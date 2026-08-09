import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api, { getCurrentSocketBaseUrl, getSocketClientOptions } from '../../utils/api';
import { FaLayerGroup, FaBolt, FaBrain, FaSearch } from 'react-icons/fa';

const ADMIN_REFRESH_EVENT = 'admin:refresh';
const SUPER_ADMIN_REFRESH_EVENT = 'superadmin:refresh';
const AUTO_REFRESH_INTERVAL_MS = 10000;
const AUTO_REFRESH_SECTIONS = new Set(['dashboard', 'activity', 'stats', 'analytics', 'admins']);

const ProblemMasterList = () => {
    const navigate = useNavigate();
    const [problems, setProblems] = useState([]);
    const [publishedStats, setPublishedStats] = useState({
        totalProblems: 0,
        difficulty: { easy: 0, medium: 0, hard: 0 }
    });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchProblems = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [problemRes, statsRes] = await Promise.all([
                api.get('/problems/admin/all'),
                api.get('/problems/stats')
            ]);

            const isPublishedProblem = (problem) => {
                const normalizedStatus = String(problem?.status || '').toLowerCase();
                return Boolean(problem?.isPublished || normalizedStatus === 'published');
            };

            const publishedProblems = Array.isArray(problemRes?.data?.problems)
                ? problemRes.data.problems.filter(isPublishedProblem)
                : [];

            setProblems(publishedProblems);
            setPublishedStats(statsRes?.data?.stats || {
                totalProblems: publishedProblems.length,
                difficulty: { easy: 0, medium: 0, hard: 0 }
            });
        } catch (err) {
            console.error("Failed to fetch problems", err);
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProblems();
    }, [fetchProblems]);

    useEffect(() => {
        const timer = setInterval(() => {
            fetchProblems(true);
        }, AUTO_REFRESH_INTERVAL_MS);
        return () => clearInterval(timer);
    }, [fetchProblems]);

    useEffect(() => {
        const socket = io(getCurrentSocketBaseUrl(), getSocketClientOptions());

        const onConnect = () => {
            socket.emit('admin:subscribe');
            socket.emit('superadmin:subscribe');
        };

        const onRealtimeRefresh = (payload = {}) => {
            const sections = Array.isArray(payload?.sections) ? payload.sections : [];
            const shouldRefresh = sections.length === 0
                || sections.some((section) => AUTO_REFRESH_SECTIONS.has(String(section || '').toLowerCase()));

            if (shouldRefresh) fetchProblems(true);
        };

        socket.on('connect', onConnect);
        socket.on(ADMIN_REFRESH_EVENT, onRealtimeRefresh);
        socket.on(SUPER_ADMIN_REFRESH_EVENT, onRealtimeRefresh);

        return () => {
            socket.emit('admin:unsubscribe');
            socket.emit('superadmin:unsubscribe');
            socket.off('connect', onConnect);
            socket.off(ADMIN_REFRESH_EVENT, onRealtimeRefresh);
            socket.off(SUPER_ADMIN_REFRESH_EVENT, onRealtimeRefresh);
            socket.disconnect();
        };
    }, [fetchProblems]);


    const filteredProblems = problems.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.createdBy?.username || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ padding: '0.5rem 0' }}>
            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="sa-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '1.25rem' }}>
                    <FaLayerGroup style={{ fontSize: '1.8rem', color: 'var(--sa-accent-blue)', marginBottom: '0.4rem' }} />
                    <span style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--sa-text)' }}>{publishedStats.totalProblems || 0}</span>
                    <span style={{ color: 'var(--sa-text-muted)', fontSize: '0.82rem', fontWeight: '600' }}>Published Problems</span>
                </div>
                <div className="sa-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '1.25rem' }}>
                    <span style={{ fontSize: '1.8rem', fontWeight: '800', color: '#16a34a', marginBottom: '0.2rem' }}>{publishedStats?.difficulty?.easy || 0}</span>
                    <span className="sa-badge sa-badge-green">Easy</span>
                </div>
                <div className="sa-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '1.25rem' }}>
                    <span style={{ fontSize: '1.8rem', fontWeight: '800', color: '#d97706', marginBottom: '0.2rem' }}>{publishedStats?.difficulty?.medium || 0}</span>
                    <span style={{ padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.74rem', fontWeight: '700', textTransform: 'uppercase', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}>Medium</span>
                </div>
                <div className="sa-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '1.25rem' }}>
                    <span style={{ fontSize: '1.8rem', fontWeight: '800', color: '#dc2626', marginBottom: '0.2rem' }}>{publishedStats?.difficulty?.hard || 0}</span>
                    <span className="sa-badge sa-badge-red">Hard</span>
                </div>
            </div>

            {/* Main Content */}
            <div className="sa-card">
                <div className="sa-card-header">
                    <h2 className="sa-card-title">
                        <FaUserShield style={{ color: 'var(--sa-accent)' }} /> Problem Master List
                    </h2>
                    <div style={{ position: 'relative', width: 'min(320px, 100%)' }}>
                        <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--sa-text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search by Title or Admin..."
                            className="sa-input"
                            style={{ paddingLeft: '36px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="sa-empty-text">Loading master list...</div>
                ) : (
                    <div className="sa-table-container">
                        <table className="sa-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Difficulty</th>
                                    <th>Created By</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProblems.map(problem => (
                                    <tr key={problem._id}>
                                        <td style={{ fontWeight: '600' }}>{problem.title}</td>
                                        <td>
                                            <span className={`sa-badge ${problem.difficulty === 'Easy' ? 'sa-badge-green' : problem.difficulty === 'Medium' ? 'sa-badge-purple' : 'sa-badge-red'}`}>
                                                {problem.difficulty}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => navigate(`admin/${problem.createdBy?._id}`)}
                                                style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                                                    background: 'transparent', border: 'none', color: 'var(--sa-accent)',
                                                    cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem'
                                                }}
                                                title="View Admin Stats"
                                            >
                                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(168,85,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', color: 'var(--sa-accent)' }}>
                                                    {(problem.createdBy?.username || 'U')[0].toUpperCase()}
                                                </div>
                                                {problem.createdBy?.username || 'Unknown'}
                                            </button>
                                        </td>
                                        <td style={{ color: 'var(--sa-text-muted)', fontSize: '0.82rem' }}>
                                            {new Date(problem.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                                {filteredProblems.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="sa-empty-row">No problems found.</td>
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

export default ProblemMasterList;
