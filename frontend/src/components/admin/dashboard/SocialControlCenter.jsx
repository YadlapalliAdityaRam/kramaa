import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import api from '../../../utils/api';

const panelStyle = {
    background: 'var(--card-bg, rgba(15,23,42,0.86))',
    border: '1px solid var(--card-border, rgba(148,163,184,0.16))',
    borderRadius: '14px',
    padding: '16px'
};

const statValueStyle = {
    fontSize: '1.45rem',
    fontWeight: 800,
    color: 'var(--text-primary, #f8fafc)',
    lineHeight: 1.1
};

const statLabelStyle = {
    fontSize: '0.8rem',
    color: 'var(--text-secondary, #cbd5e1)',
    marginTop: '4px',
    letterSpacing: '0.01em'
};

const inputStyle = {
    width: '100%',
    background: 'rgba(15,23,42,0.78)',
    border: '1px solid rgba(148,163,184,0.24)',
    borderRadius: '10px',
    color: 'var(--text-primary, #f8fafc)',
    padding: '10px 12px',
    fontSize: '0.9rem',
    outline: 'none'
};

const buttonBase = {
    borderRadius: '10px',
    border: '1px solid rgba(148,163,184,0.2)',
    padding: '8px 12px',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer'
};

const SocialControlCenter = () => {
    const { user } = useSelector((state) => state.auth);
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';
    const [isMobile, setIsMobile] = useState(() => (
        typeof window !== 'undefined' ? window.innerWidth <= 768 : false
    ));
    const reportBasePath = isSuperAdmin ? '/super-admin/reports' : '/admin/reports';

    const [overview, setOverview] = useState(null);
    const [overviewLoading, setOverviewLoading] = useState(true);

    const [reportStatus, setReportStatus] = useState('pending');
    const [reports, setReports] = useState([]);
    const [reportsLoading, setReportsLoading] = useState(true);

    const [configForm, setConfigForm] = useState({
        followSystemEnabled: true,
        maxFollowsPerDay: 100,
        maxNotificationsPerHour: 20,
        feedLimit: 50
    });
    const [configLoading, setConfigLoading] = useState(false);
    const [configSaving, setConfigSaving] = useState(false);

    const fetchOverview = useCallback(async () => {
        setOverviewLoading(true);
        try {
            const { data } = await api.get('/social/admin/overview');
            setOverview(data?.overview || null);
            const cfg = data?.overview?.socialConfig;
            if (cfg) {
                setConfigForm((prev) => ({
                    ...prev,
                    followSystemEnabled: Boolean(cfg.followSystemEnabled),
                    maxFollowsPerDay: Number(cfg.maxFollowsPerDay || 100),
                    maxNotificationsPerHour: Number(cfg.maxNotificationsPerHour || 20),
                    feedLimit: Number(cfg.feedLimit || 50)
                }));
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to load social overview');
            setOverview(null);
        } finally {
            setOverviewLoading(false);
        }
    }, []);

    const fetchReports = useCallback(async () => {
        setReportsLoading(true);
        try {
            const { data } = await api.get('/social/admin/reports', {
                params: { page: 1, limit: 15, status: reportStatus }
            });
            setReports(Array.isArray(data?.reports) ? data.reports : []);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to load profile reports');
            setReports([]);
        } finally {
            setReportsLoading(false);
        }
    }, [reportStatus]);

    const fetchConfig = useCallback(async () => {
        if (!isSuperAdmin) return;
        setConfigLoading(true);
        try {
            const { data } = await api.get('/social/superadmin/config');
            const cfg = data?.config || {};
            setConfigForm({
                followSystemEnabled: Boolean(cfg.followSystemEnabled),
                maxFollowsPerDay: Number(cfg.maxFollowsPerDay || 100),
                maxNotificationsPerHour: Number(cfg.maxNotificationsPerHour || 20),
                feedLimit: Number(cfg.feedLimit || 50)
            });
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to load social config');
        } finally {
            setConfigLoading(false);
        }
    }, [isSuperAdmin]);

    useEffect(() => {
        fetchOverview();
    }, [fetchOverview]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const safeDaily = useMemo(
        () => (Array.isArray(overview?.dailyFollowActivity) ? overview.dailyFollowActivity : []),
        [overview]
    );
    const safeSpamAlerts = useMemo(
        () => (Array.isArray(overview?.spamAlerts) ? overview.spamAlerts : []),
        [overview]
    );
    const peakDailyCount = Math.max(1, ...safeDaily.map((d) => Number(d?.count || 0)));

    const handlePurgeUserFollows = async (userId, username) => {
        if (!userId) return;
        const ok = window.confirm(`Remove all follow relationships created by ${username || 'this user'}?`);
        if (!ok) return;

        try {
            const { data } = await api.delete(`/social/admin/follows/by-user/${userId}`);
            toast.success(data?.message || 'Spam follows removed');
            await fetchOverview();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to remove spam follows');
        }
    };

    const handleSaveConfig = async () => {
        if (!isSuperAdmin) return;
        setConfigSaving(true);
        try {
            const payload = {
                followSystemEnabled: Boolean(configForm.followSystemEnabled),
                maxFollowsPerDay: Math.max(1, Number(configForm.maxFollowsPerDay || 1)),
                maxNotificationsPerHour: Math.max(1, Number(configForm.maxNotificationsPerHour || 1)),
                feedLimit: Math.max(10, Number(configForm.feedLimit || 10))
            };
            const { data } = await api.put('/social/superadmin/config', payload);
            toast.success(data?.message || 'Social config updated');
            await fetchOverview();
            await fetchConfig();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to update social config');
        } finally {
            setConfigSaving(false);
        }
    };

    if (overviewLoading && !overview) {
        return <div style={panelStyle}>Loading social control center...</div>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ ...panelStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                    <h2 style={{ margin: 0, color: 'var(--text-primary, #f8fafc)', fontSize: '1.15rem' }}>Social Control Center</h2>
                    <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #cbd5e1)', fontSize: '0.85rem' }}>
                        Monitor follows, profile reports, feed health, and social safeguards.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        onClick={fetchOverview}
                        style={{ ...buttonBase, background: 'rgba(59,130,246,0.16)', color: '#93c5fd' }}
                    >
                        Refresh Overview
                    </button>
                    <Link
                        to={reportBasePath}
                        style={{
                            ...buttonBase,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            background: 'rgba(148,163,184,0.14)',
                            color: '#e2e8f0'
                        }}
                    >
                        Open Full Report Console
                    </Link>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div style={panelStyle}>
                    <div style={statValueStyle}>{Number(overview?.totalRelationships || 0).toLocaleString()}</div>
                    <div style={statLabelStyle}>Total Follow Relationships</div>
                </div>
                <div style={panelStyle}>
                    <div style={statValueStyle}>{Number(overview?.pendingProfileReports || 0).toLocaleString()}</div>
                    <div style={statLabelStyle}>Pending Profile Reports</div>
                </div>
                <div style={panelStyle}>
                    <div style={{ ...statValueStyle, color: configForm.followSystemEnabled ? '#4ade80' : '#f97316' }}>
                        {configForm.followSystemEnabled ? 'Enabled' : 'Disabled'}
                    </div>
                    <div style={statLabelStyle}>Follow System</div>
                </div>
                <div style={panelStyle}>
                    <div style={statValueStyle}>{Number(configForm.maxFollowsPerDay || 0)}</div>
                    <div style={statLabelStyle}>Max Follows Per Day</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(320px, 1fr) minmax(320px, 1fr)', gap: '12px' }}>
                <div style={panelStyle}>
                    <h3 style={{ marginTop: 0, color: 'var(--text-primary, #f8fafc)', fontSize: '1rem' }}>Daily Follow Activity (Last 14 Days)</h3>
                    {safeDaily.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary, #cbd5e1)', margin: 0 }}>No follow activity data available.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {safeDaily.map((row) => {
                                const count = Number(row?.count || 0);
                                const width = `${Math.max(6, Math.round((count / peakDailyCount) * 100))}%`;
                                return (
                                    <div key={row?.date} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 44px', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{row?.date || '-'}</span>
                                        <div style={{ height: '8px', borderRadius: '999px', background: 'rgba(148,163,184,0.2)', overflow: 'hidden' }}>
                                            <div style={{ width, height: '100%', background: 'linear-gradient(90deg, #22d3ee, #3b82f6)' }} />
                                        </div>
                                        <span style={{ color: '#cbd5e1', fontSize: '0.78rem', textAlign: 'right' }}>{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div style={panelStyle}>
                    <h3 style={{ marginTop: 0, color: 'var(--text-primary, #f8fafc)', fontSize: '1rem' }}>Spam Follow Alerts (Today)</h3>
                    {safeSpamAlerts.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary, #cbd5e1)', margin: 0 }}>No suspicious follow spikes detected.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {safeSpamAlerts.map((row) => (
                                <div key={row?.userId} style={{ border: '1px solid rgba(148,163,184,0.22)', borderRadius: '10px', padding: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <div>
                                            <div style={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.9rem' }}>{row?.username || 'Unknown'}</div>
                                            <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{row?.email || 'No email'}</div>
                                            <div style={{ color: '#fbbf24', fontSize: '0.8rem', marginTop: '2px' }}>
                                                Follows today: {Number(row?.followsToday || 0)}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handlePurgeUserFollows(row?.userId, row?.username)}
                                            style={{ ...buttonBase, background: 'rgba(239,68,68,0.15)', color: '#fca5a5', borderColor: 'rgba(239,68,68,0.4)' }}
                                        >
                                            Remove Follows
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div style={panelStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0, color: 'var(--text-primary, #f8fafc)', fontSize: '1rem' }}>Profile Report Queue</h3>
                    <select
                        value={reportStatus}
                        onChange={(event) => setReportStatus(event.target.value)}
                        style={{ ...inputStyle, width: '190px', padding: '8px 10px' }}
                    >
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="resolved">Resolved</option>
                        <option value="rejected">Rejected</option>
                        <option value="all">All</option>
                    </select>
                </div>

                {reportsLoading ? (
                    <p style={{ margin: 0, color: 'var(--text-secondary, #cbd5e1)' }}>Loading profile reports...</p>
                ) : reports.length === 0 ? (
                    <p style={{ margin: 0, color: 'var(--text-secondary, #cbd5e1)' }}>No reports in this bucket.</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', color: '#cbd5e1' }}>
                                    <th style={{ padding: '8px 6px', borderBottom: '1px solid rgba(148,163,184,0.2)' }}>Reported User</th>
                                    <th style={{ padding: '8px 6px', borderBottom: '1px solid rgba(148,163,184,0.2)' }}>Reporter</th>
                                    <th style={{ padding: '8px 6px', borderBottom: '1px solid rgba(148,163,184,0.2)' }}>Reason</th>
                                    <th style={{ padding: '8px 6px', borderBottom: '1px solid rgba(148,163,184,0.2)' }}>Status</th>
                                    <th style={{ padding: '8px 6px', borderBottom: '1px solid rgba(148,163,184,0.2)' }}>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.map((row) => (
                                    <tr key={row?._id}>
                                        <td style={{ padding: '8px 6px', borderBottom: '1px solid rgba(148,163,184,0.1)', color: '#f8fafc' }}>
                                            {row?.reportedUserId?.username || 'Unknown'}
                                        </td>
                                        <td style={{ padding: '8px 6px', borderBottom: '1px solid rgba(148,163,184,0.1)', color: '#e2e8f0' }}>
                                            {row?.reporterId?.username || 'Unknown'}
                                        </td>
                                        <td style={{ padding: '8px 6px', borderBottom: '1px solid rgba(148,163,184,0.1)', color: '#fbbf24' }}>
                                            {row?.reason || 'Other'}
                                        </td>
                                        <td style={{ padding: '8px 6px', borderBottom: '1px solid rgba(148,163,184,0.1)', color: '#cbd5e1' }}>
                                            {String(row?.status || 'pending').toUpperCase()}
                                        </td>
                                        <td style={{ padding: '8px 6px', borderBottom: '1px solid rgba(148,163,184,0.1)', color: '#94a3b8' }}>
                                            {row?.createdAt ? new Date(row.createdAt).toLocaleString() : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isSuperAdmin && (
                <div style={panelStyle}>
                    <h3 style={{ marginTop: 0, color: 'var(--text-primary, #f8fafc)', fontSize: '1rem' }}>Super Admin Social Guardrails</h3>
                    {configLoading ? (
                        <p style={{ margin: 0, color: 'var(--text-secondary, #cbd5e1)' }}>Loading social config...</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                            <label style={{ color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <span>Follow System Enabled</span>
                                <select
                                    value={configForm.followSystemEnabled ? 'enabled' : 'disabled'}
                                    onChange={(event) => setConfigForm((prev) => ({
                                        ...prev,
                                        followSystemEnabled: event.target.value === 'enabled'
                                    }))}
                                    style={inputStyle}
                                >
                                    <option value="enabled">Enabled</option>
                                    <option value="disabled">Disabled</option>
                                </select>
                            </label>
                            <label style={{ color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <span>Max Follows / Day</span>
                                <input
                                    type="number"
                                    min={1}
                                    value={configForm.maxFollowsPerDay}
                                    onChange={(event) => setConfigForm((prev) => ({
                                        ...prev,
                                        maxFollowsPerDay: event.target.value
                                    }))}
                                    style={inputStyle}
                                />
                            </label>
                            <label style={{ color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <span>Max Notifications / Hour</span>
                                <input
                                    type="number"
                                    min={1}
                                    value={configForm.maxNotificationsPerHour}
                                    onChange={(event) => setConfigForm((prev) => ({
                                        ...prev,
                                        maxNotificationsPerHour: event.target.value
                                    }))}
                                    style={inputStyle}
                                />
                            </label>
                            <label style={{ color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <span>Feed Limit</span>
                                <input
                                    type="number"
                                    min={10}
                                    value={configForm.feedLimit}
                                    onChange={(event) => setConfigForm((prev) => ({
                                        ...prev,
                                        feedLimit: event.target.value
                                    }))}
                                    style={inputStyle}
                                />
                            </label>
                        </div>
                    )}
                    <div style={{ marginTop: '12px' }}>
                        <button
                            type="button"
                            onClick={handleSaveConfig}
                            disabled={configSaving}
                            style={{
                                ...buttonBase,
                                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                color: '#fff',
                                borderColor: 'rgba(59,130,246,0.45)',
                                minWidth: '140px'
                            }}
                        >
                            {configSaving ? 'Saving...' : 'Save Config'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SocialControlCenter;
