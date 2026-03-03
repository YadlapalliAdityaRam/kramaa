import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import { io } from 'socket.io-client';
import { FaBolt, FaChartLine, FaClipboardList, FaCog, FaLock, FaPlus, FaShieldAlt, FaUserShield } from 'react-icons/fa';
import api, { getCurrentSocketBaseUrl, getSocketClientOptions } from '../utils/api';
import '../styles/SuperAdminProfile.css';

const TABS = [
    { id: 'overview', label: 'Overview', icon: <FaUserShield /> },
    { id: 'admins', label: 'Admin Management', icon: <FaShieldAlt /> },
    { id: 'audit', label: 'Audit Logs', icon: <FaClipboardList /> },
    { id: 'analytics', label: 'Analytics', icon: <FaChartLine /> },
    { id: 'security', label: 'Security', icon: <FaLock /> },
    { id: 'settings', label: 'System Settings', icon: <FaCog /> }
];

const ACTION_OPTIONS = [
    'ALL',
    'CREATE_ADMIN',
    'UPDATE_ADMIN',
    'REMOVE_ADMIN',
    'TOGGLE_MAINTENANCE',
    'VIEW_AUDIT_LOGS',
    'VIEW_ANALYTICS',
    'VIEW_SYSTEM_HEALTH'
];

const DEFAULT_SETTINGS = {
    maintenanceMode: false,
    timeLimit: 1000,
    submissionLimit: 50,
    compilerConfig: { javascript: 'node', python: 'python3', java: 'javac', cpp: 'g++', c: 'gcc' },
    twoFAEnabled: false
};

const PIE_COLORS = ['#8b5cf6', '#06b6d4', '#22c55e'];
const SUPER_ADMIN_REFRESH_EVENT = 'superadmin:refresh';
const DEFAULT_REFRESH_SECTIONS = ['profile', 'stats', 'admins', 'analytics', 'health', 'settings', 'audit'];

const asDateTime = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString();
};

const toSettingsState = (settingsList = []) => {
    const map = {};
    settingsList.forEach((item) => {
        map[item.key] = item.value;
    });

    return {
        maintenanceMode: Boolean(map.maintenanceMode ?? DEFAULT_SETTINGS.maintenanceMode),
        timeLimit: Number(map.timeLimit ?? DEFAULT_SETTINGS.timeLimit),
        submissionLimit: Number(map.submissionLimit ?? DEFAULT_SETTINGS.submissionLimit),
        compilerConfig: map.compilerConfig || DEFAULT_SETTINGS.compilerConfig,
        twoFAEnabled: Boolean(map.superAdmin2FA ?? DEFAULT_SETTINGS.twoFAEnabled)
    };
};

const SuperAdminProfile = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);

    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState(null);
    const [admins, setAdmins] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [health, setHealth] = useState(null);
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);

    const [auditLogs, setAuditLogs] = useState([]);
    const [auditPaging, setAuditPaging] = useState({ page: 1, limit: 20, totalPages: 1 });
    const [auditFilters, setAuditFilters] = useState({ actionType: 'ALL', startDate: '', endDate: '' });

    const [showCreateAdmin, setShowCreateAdmin] = useState(false);
    const [adminPayload, setAdminPayload] = useState({ fullName: '', username: '', email: '', password: '', phone: '' });
    const [maintenanceReason, setMaintenanceReason] = useState('');
    const seenAlerts = useRef(new Set());
    const refreshQueueRef = useRef(new Set());
    const refreshTimerRef = useRef(null);

    const syncProfile = useCallback(async () => {
        const res = await api.get('/superadmin/profile');
        setProfile(res.data.profile || null);
    }, []);

    const syncStats = useCallback(async () => {
        const res = await api.get('/superadmin/dashboard-stats');
        setStats(res.data.stats || null);
    }, []);

    const syncAdmins = useCallback(async () => {
        const res = await api.get('/superadmin/admins?limit=50');
        setAdmins(res.data.admins || []);
    }, []);

    const syncAnalytics = useCallback(async () => {
        const res = await api.get('/superadmin/analytics');
        setAnalytics(res.data.analytics || null);
    }, []);

    const syncHealth = useCallback(async () => {
        const res = await api.get('/superadmin/system-health');
        setHealth(res.data.health || null);
    }, []);

    const syncSettings = useCallback(async () => {
        const res = await api.get('/settings');
        setSettings(toSettingsState(res.data.settings || []));
    }, []);

    const loadAudit = useCallback(async (page = 1) => {
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(auditPaging.limit || 20) });
            if (auditFilters.actionType !== 'ALL') params.append('actionType', auditFilters.actionType);
            if (auditFilters.startDate) params.append('startDate', auditFilters.startDate);
            if (auditFilters.endDate) params.append('endDate', auditFilters.endDate);
            const res = await api.get(`/superadmin/audit-logs?${params.toString()}`);
            setAuditLogs(res.data.logs || []);
            setAuditPaging(res.data.pagination || { page: 1, limit: 20, totalPages: 1 });
        } catch (error) {
            setAuditLogs([]);
            setAuditPaging((prev) => ({
                page,
                limit: prev.limit || 20,
                totalPages: 1
            }));

            const status = error?.response?.status;
            if (status && status !== 401 && status !== 403) {
                toast.error(error?.response?.data?.message || 'Failed to load audit logs');
            }
        }
    }, [auditFilters.actionType, auditFilters.endDate, auditFilters.startDate, auditPaging.limit]);

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            await Promise.all([
                syncProfile(),
                syncStats(),
                syncAdmins(),
                syncAnalytics(),
                syncHealth(),
                syncSettings()
            ]);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to load Super Admin profile');
        } finally {
            setLoading(false);
        }
    }, [syncAdmins, syncAnalytics, syncHealth, syncProfile, syncSettings, syncStats]);

    const refreshSections = useCallback(async (sections = DEFAULT_REFRESH_SECTIONS) => {
        const normalizedSections = new Set(
            (Array.isArray(sections) && sections.length > 0 ? sections : DEFAULT_REFRESH_SECTIONS)
                .map((section) => String(section || '').toLowerCase())
        );

        const requests = [];
        if (normalizedSections.has('profile')) requests.push(syncProfile());
        if (normalizedSections.has('stats')) requests.push(syncStats());
        if (normalizedSections.has('admins')) requests.push(syncAdmins());
        if (normalizedSections.has('analytics')) requests.push(syncAnalytics());
        if (normalizedSections.has('health')) requests.push(syncHealth());
        if (normalizedSections.has('settings')) requests.push(syncSettings());
        if (normalizedSections.has('audit')) requests.push(loadAudit(auditPaging.page || 1));

        if (requests.length === 0) return;
        await Promise.allSettled(requests);
    }, [auditPaging.page, loadAudit, syncAdmins, syncAnalytics, syncHealth, syncProfile, syncSettings, syncStats]);

    const queueRealtimeRefresh = useCallback((sections = []) => {
        const normalizedSections = Array.isArray(sections) && sections.length > 0 ? sections : DEFAULT_REFRESH_SECTIONS;

        normalizedSections.forEach((section) => {
            refreshQueueRef.current.add(String(section || '').toLowerCase());
        });

        if (refreshTimerRef.current) return;

        refreshTimerRef.current = setTimeout(async () => {
            const queuedSections = [...refreshQueueRef.current];
            refreshQueueRef.current.clear();
            refreshTimerRef.current = null;
            await refreshSections(queuedSections);
        }, 500);
    }, [refreshSections]);

    useEffect(() => { loadAll(); loadAudit(1); }, [loadAll, loadAudit]);
    useEffect(() => {
        const timer = setInterval(() => {
            refreshSections(DEFAULT_REFRESH_SECTIONS);
        }, 10000);
        return () => clearInterval(timer);
    }, [refreshSections]);

    useEffect(() => {
        const socket = io(getCurrentSocketBaseUrl(), getSocketClientOptions());

        const handleConnect = () => {
            socket.emit('superadmin:subscribe');
        };

        const handleRealtimeRefresh = (payload = {}) => {
            queueRealtimeRefresh(payload.sections || []);
        };

        const handleNewUser = () => {
            queueRealtimeRefresh(['stats']);
            toast.success('New user registered!');
        };
        const handleNewProblem = () => {
            queueRealtimeRefresh(['stats', 'analytics']);
            toast.success('New problem added to the platform!');
        };
        const handleNewContest = () => {
            queueRealtimeRefresh(['stats']);
            toast.success('New contest created!');
        };

        socket.on('connect', handleConnect);
        socket.on(SUPER_ADMIN_REFRESH_EVENT, handleRealtimeRefresh);
        socket.on('newUserRegistered', handleNewUser);
        socket.on('newProblemAdded', handleNewProblem);
        socket.on('newContestAdded', handleNewContest);

        return () => {
            if (refreshTimerRef.current) {
                clearTimeout(refreshTimerRef.current);
                refreshTimerRef.current = null;
            }
            refreshQueueRef.current.clear();
            socket.emit('superadmin:unsubscribe');
            socket.off('connect', handleConnect);
            socket.off(SUPER_ADMIN_REFRESH_EVENT, handleRealtimeRefresh);
            socket.off('newUserRegistered', handleNewUser);
            socket.off('newProblemAdded', handleNewProblem);
            socket.off('newContestAdded', handleNewContest);
            socket.disconnect();
        };
    }, [queueRealtimeRefresh]);

    useEffect(() => {
        (analytics?.alerts || []).forEach((alert) => {
            if (alert.type !== 'critical') return;
            const key = `${alert.code}:${alert.message}`;
            if (seenAlerts.current.has(key)) return;
            seenAlerts.current.add(key);
            toast.error(alert.message, { duration: 4500 });
        });
    }, [analytics]);

    const metrics = useMemo(() => ([
        ['Total Users', stats?.totalUsers ?? 0],
        ['Total Admins', stats?.totalAdmins ?? 0],
        ['Published Problems', stats?.totalProblems ?? 0],
        ['Contest Problems', stats?.contestProblemCount ?? 0],
        ['Pending Problems', stats?.pendingProblems ?? 0],
        ['Total Submissions', stats?.totalSubmissions ?? 0],
        ['Active Servers', stats?.activeServers ?? 0],
        ['System Uptime (sec)', stats?.systemUptime ?? 0],
        ['Monthly Revenue', `$${(stats?.monthlyRevenue ?? 0).toLocaleString()}`]
    ]), [stats]);

    const publishedDailyTrend = useMemo(() => (
        (analytics?.publishedProblemStats?.dailyAdditions || []).map((entry) => ({
            date: String(entry?.date || '').slice(5) || '-',
            count: Number(entry?.count || 0)
        }))
    ), [analytics?.publishedProblemStats?.dailyAdditions]);

    const topTopicDistribution = useMemo(() => (
        (analytics?.publishedProblemStats?.topicDistribution || [])
            .slice(0, 12)
            .map((entry) => ({
                topic: entry?.topic || 'Unknown',
                count: Number(entry?.count || 0)
            }))
    ), [analytics?.publishedProblemStats?.topicDistribution]);

    const onCreateAdmin = async (event) => {
        event.preventDefault();
        if (!adminPayload.username || !adminPayload.email || !adminPayload.password) {
            toast.error('username, email, and password are required');
            return;
        }

        setBusy(true);
        try {
            await api.post('/superadmin/create-admin', adminPayload);
            toast.success('Admin created');
            setShowCreateAdmin(false);
            setAdminPayload({ fullName: '', username: '', email: '', password: '', phone: '' });
            await Promise.all([loadAll(), loadAudit(1)]);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to create admin');
        } finally {
            setBusy(false);
        }
    };

    const onToggleAdminStatus = async (admin) => {
        setBusy(true);
        try {
            await api.patch(`/superadmin/update-admin/${admin._id}`, { isActive: !admin.isActive });
            toast.success(`Admin ${admin.isActive ? 'suspended' : 'activated'}`);
            await Promise.all([loadAll(), loadAudit(auditPaging.page)]);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to update admin');
        } finally {
            setBusy(false);
        }
    };

    const onRemoveAdmin = async (admin) => {
        if (!window.confirm(`Remove admin access for ${admin.username}?`)) return;
        setBusy(true);
        try {
            await api.delete(`/superadmin/remove-admin/${admin._id}`);
            toast.success('Admin removed');
            await Promise.all([loadAll(), loadAudit(auditPaging.page)]);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to remove admin');
        } finally {
            setBusy(false);
        }
    };

    const onToggleMaintenance = async () => {
        setBusy(true);
        try {
            const res = await api.patch('/superadmin/toggle-maintenance', {
                enabled: !settings.maintenanceMode,
                reason: maintenanceReason
            });
            setSettings((prev) => ({ ...prev, maintenanceMode: Boolean(res.data.maintenanceMode) }));
            setMaintenanceReason('');
            toast.success(`Maintenance mode ${res.data.maintenanceMode ? 'enabled' : 'disabled'}`);
            await loadAudit(1);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to toggle maintenance mode');
        } finally {
            setBusy(false);
        }
    };

    const onSaveSettings = async () => {
        setBusy(true);
        try {
            await Promise.all([
                api.put('/settings/timeLimit', { value: Number(settings.timeLimit) }),
                api.put('/settings/submissionLimit', { value: Number(settings.submissionLimit) }),
                api.put('/settings/compilerConfig', { value: settings.compilerConfig }),
                api.put('/settings/superAdmin2FA', { value: Boolean(settings.twoFAEnabled) })
            ]);
            toast.success('System settings saved');
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to save settings');
        } finally {
            setBusy(false);
        }
    };

    const onForceLogoutAll = async () => {
        setBusy(true);
        try {
            await api.put('/settings/forceLogoutAt', { value: new Date().toISOString() });
            toast.success('Force logout token updated');
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to force logout');
        } finally {
            setBusy(false);
        }
    };

    const onCompilerChange = (key, value) => {
        setSettings((prev) => ({
            ...prev,
            compilerConfig: {
                ...(prev.compilerConfig || {}),
                [key]: value
            }
        }));
    };

    if (loading) return <div className="sa-profile-loading">Loading Super Admin profile...</div>;

    return (
        <div className="sa-profile-page">
            <section className="sa-profile-header">
                <div className="sa-profile-main">
                    <div className="sa-profile-avatar">
                        {profile?.profileImage ? <img src={profile.profileImage} alt={profile?.username || 'super-admin'} /> : <span>{profile?.username?.charAt(0)?.toUpperCase() || 'S'}</span>}
                    </div>
                    <div>
                        <h1>{profile?.fullName || profile?.username || 'Super Admin'}</h1>
                        <p>{profile?.email}</p>
                        <div className="sa-role-row">
                            <span className="sa-role-badge">SUPER ADMIN</span>
                            <span className="sa-permission-pill">Permission: Full Access</span>
                        </div>
                    </div>
                </div>
                <div className="sa-header-health">
                    <div><span>Server Status</span><strong>{health?.serverStatus || 'HEALTHY'}</strong></div>
                    <div><span>Platform Health Score</span><strong>{analytics?.platformHealthScore ?? 0}</strong></div>
                </div>
            </section>

            <section className="sa-tabs-wrap">
                {TABS.map((tab) => (
                    <button key={tab.id} type="button" className={`sa-tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </section>

            <section className="sa-tab-section">
                {activeTab === 'overview' && (
                    <div className="sa-overview-section">
                        <div className="sa-overview-grid">
                            {metrics.map(([label, value]) => (
                                <article key={label} className="sa-stat-card"><span>{label}</span><strong>{value}</strong></article>
                            ))}
                        </div>
                        <div className="sa-overview-panels">
                            <article className="sa-panel">
                                <h3>Recent Activity</h3>
                                <div className="sa-activity-list">
                                    {(profile?.recentActions || []).map((action, index) => (
                                        <div key={`${action.actionType}-${index}`} className="sa-activity-item">
                                            <div><strong>{action.actionType}</strong><p>{action.description}</p></div>
                                            <span>{asDateTime(action.timestamp)}</span>
                                        </div>
                                    ))}
                                    {(!profile?.recentActions || profile.recentActions.length === 0) && <p className="sa-empty-text">No recent actions recorded.</p>}
                                </div>
                            </article>
                            <article className="sa-panel">
                                <h3>Critical Alerts</h3>
                                <div className="sa-alert-list">
                                    {(analytics?.alerts || []).map((alert) => (
                                        <div key={`${alert.code}-${alert.message}`} className={`sa-alert ${alert.type}`}>
                                            <FaBolt />
                                            <div><strong>{alert.code}</strong><p>{alert.message}</p></div>
                                        </div>
                                    ))}
                                </div>
                            </article>
                        </div>
                    </div>
                )}

                {activeTab === 'admins' && (
                    <div className="sa-admins-section">
                        <div className="sa-tab-actions">
                            <h3>Admin Management</h3>
                            <button type="button" className="sa-primary-btn" onClick={() => setShowCreateAdmin(true)}>
                                <FaPlus /> <span>Create Admin</span>
                            </button>
                        </div>
                        <div className="sa-table-wrap">
                            <table className="sa-table">
                                <thead>
                                    <tr>
                                        <th>Admin</th><th>Status</th><th>Created</th><th>Approved</th><th>Acceptance</th><th>Last Active</th><th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {admins.map((admin) => (
                                        <tr key={admin._id}>
                                            <td><div className="sa-admin-cell"><strong>{admin.fullName || admin.username}</strong><span>{admin.email}</span></div></td>
                                            <td><span className={`sa-status-pill ${admin.isActive ? 'active' : 'inactive'}`}>{admin.isActive ? 'Active' : 'Suspended'}</span></td>
                                            <td>{admin.performance?.createdProblems ?? 0}</td>
                                            <td>{admin.performance?.approvedProblems ?? 0}</td>
                                            <td>{admin.performance?.acceptanceRate ?? 0}%</td>
                                            <td>{asDateTime(admin.lastLogin)}</td>
                                            <td>
                                                <div className="sa-row-actions">
                                                    <button type="button" onClick={() => onToggleAdminStatus(admin)} disabled={busy}>{admin.isActive ? 'Suspend' : 'Activate'}</button>
                                                    <button type="button" className="danger" onClick={() => onRemoveAdmin(admin)} disabled={busy}>Remove</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {admins.length === 0 && <tr><td colSpan={7} className="sa-empty-row">No admins found.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'audit' && (
                    <div className="sa-audit-section">
                        <div className="sa-audit-filters">
                            <select value={auditFilters.actionType} onChange={(event) => setAuditFilters((prev) => ({ ...prev, actionType: event.target.value }))}>
                                {ACTION_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                            </select>
                            <input type="date" value={auditFilters.startDate} onChange={(event) => setAuditFilters((prev) => ({ ...prev, startDate: event.target.value }))} />
                            <input type="date" value={auditFilters.endDate} onChange={(event) => setAuditFilters((prev) => ({ ...prev, endDate: event.target.value }))} />
                            <button type="button" className="sa-primary-btn" onClick={() => loadAudit(1)}>Apply Filters</button>
                        </div>
                        <div className="sa-table-wrap">
                            <table className="sa-table">
                                <thead><tr><th>Action</th><th>Actor</th><th>Target</th><th>IP</th><th>Timestamp</th></tr></thead>
                                <tbody>
                                    {auditLogs.map((log) => (
                                        <tr key={log._id}>
                                            <td>{log.action}</td><td>{log.actor?.username || 'SYSTEM'}</td><td>{log.target}</td><td>{log.ipAddress || '-'}</td><td>{asDateTime(log.timestamp)}</td>
                                        </tr>
                                    ))}
                                    {auditLogs.length === 0 && <tr><td colSpan={5} className="sa-empty-row">No logs found for selected filters.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                        <div className="sa-pagination">
                            <button type="button" onClick={() => loadAudit(Math.max(1, auditPaging.page - 1))} disabled={auditPaging.page <= 1}>Prev</button>
                            <span>Page {auditPaging.page} / {auditPaging.totalPages || 1}</span>
                            <button type="button" onClick={() => loadAudit(Math.min(auditPaging.totalPages || 1, auditPaging.page + 1))} disabled={auditPaging.page >= (auditPaging.totalPages || 1)}>Next</button>
                        </div>
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="sa-chart-grid">
                        <article className="sa-chart-card">
                            <h4>User Growth</h4>
                            <ResponsiveContainer width="100%" height={260}>
                                <LineChart data={analytics?.userGrowth || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#263245" />
                                    <XAxis dataKey="month" stroke="#91a5bf" />
                                    <YAxis stroke="#91a5bf" />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </article>
                        <article className="sa-chart-card">
                            <h4>Submission Trend</h4>
                            <ResponsiveContainer width="100%" height={260}>
                                <AreaChart data={analytics?.submissionTrend || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#263245" />
                                    <XAxis dataKey="date" stroke="#91a5bf" />
                                    <YAxis stroke="#91a5bf" />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="accepted" stroke="#22c55e" fill="#22c55e33" />
                                    <Area type="monotone" dataKey="failed" stroke="#ef4444" fill="#ef444433" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </article>
                        <article className="sa-chart-card">
                            <h4>Difficulty Distribution</h4>
                            <ResponsiveContainer width="100%" height={260}>
                                <PieChart>
                                    <Pie data={analytics?.problemDifficultyDistribution || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label>
                                        {(analytics?.problemDifficultyDistribution || []).map((entry, index) => (
                                            <Cell key={`${entry.name}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </article>
                        <article className="sa-chart-card">
                            <h4>Acceptance Summary</h4>
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={[
                                    { label: 'Total', value: analytics?.acceptanceMetrics?.totalSubmissions || 0 },
                                    { label: 'Accepted', value: analytics?.acceptanceMetrics?.acceptedSubmissions || 0 }
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#263245" />
                                    <XAxis dataKey="label" stroke="#91a5bf" />
                                    <YAxis stroke="#91a5bf" />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                            <p className="sa-acceptance-rate">Acceptance Rate: {analytics?.acceptanceMetrics?.acceptanceRate ?? 0}%</p>
                        </article>
                        <article className="sa-chart-card">
                            <h4>Daily Published Problems</h4>
                            <ResponsiveContainer width="100%" height={260}>
                                <LineChart data={publishedDailyTrend}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#263245" />
                                    <XAxis dataKey="date" stroke="#91a5bf" />
                                    <YAxis stroke="#91a5bf" />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </article>
                        <article className="sa-chart-card">
                            <h4>Published Problems by Topic</h4>
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={topTopicDistribution}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#263245" />
                                    <XAxis dataKey="topic" stroke="#91a5bf" />
                                    <YAxis stroke="#91a5bf" />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </article>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="sa-security-grid">
                        <article className="sa-panel">
                            <h4>Security Controls</h4>
                            <div className="sa-security-row"><span>2FA Status</span><strong>{settings.twoFAEnabled ? 'Enabled' : 'Disabled'}</strong></div>
                            <div className="sa-security-row"><span>Active Sessions</span><strong>{health?.activeConnections ?? 0}</strong></div>
                            <div className="sa-security-row"><span>Last Login</span><strong>{asDateTime(profile?.lastLogin)}</strong></div>
                            <div className="sa-security-actions">
                                <button type="button" className="sa-primary-btn" onClick={() => setSettings((prev) => ({ ...prev, twoFAEnabled: !prev.twoFAEnabled }))}>Toggle 2FA</button>
                                <button type="button" className="sa-danger-btn" onClick={onForceLogoutAll}>Force Logout All</button>
                            </div>
                        </article>
                        <article className="sa-panel">
                            <h4>Login History</h4>
                            <div className="sa-login-history">
                                {(profile?.loginHistory || []).map((entry, index) => (
                                    <div key={`${entry.timestamp}-${index}`} className="sa-login-entry">
                                        <div><strong>{entry.device || 'Unknown device'}</strong><p>{entry.ip || '-'}</p></div>
                                        <span>{asDateTime(entry.timestamp)}</span>
                                    </div>
                                ))}
                                {(!profile?.loginHistory || profile.loginHistory.length === 0) && <p className="sa-empty-text">No login history available.</p>}
                            </div>
                        </article>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="sa-settings-grid">
                        <article className="sa-panel">
                            <h4>Maintenance Mode</h4>
                            <p>Current: <strong>{settings.maintenanceMode ? 'Enabled' : 'Disabled'}</strong></p>
                            <textarea placeholder="Reason for maintenance toggle" value={maintenanceReason} onChange={(event) => setMaintenanceReason(event.target.value)} />
                            <button type="button" className="sa-primary-btn" onClick={onToggleMaintenance} disabled={busy}>
                                {settings.maintenanceMode ? 'Disable Maintenance' : 'Enable Maintenance'}
                            </button>
                        </article>
                        <article className="sa-panel">
                            <h4>Runtime Limits</h4>
                            <label htmlFor="sa-time-limit">Time Limit (ms)</label>
                            <input id="sa-time-limit" type="number" value={settings.timeLimit} onChange={(event) => setSettings((prev) => ({ ...prev, timeLimit: Number(event.target.value) }))} />
                            <label htmlFor="sa-submission-limit">Submission Limit (per user/day)</label>
                            <input id="sa-submission-limit" type="number" value={settings.submissionLimit} onChange={(event) => setSettings((prev) => ({ ...prev, submissionLimit: Number(event.target.value) }))} />
                        </article>
                        <article className="sa-panel">
                            <h4>Compiler Config</h4>
                            {Object.entries(settings.compilerConfig || {}).map(([key, value]) => (
                                <div key={key} className="sa-compiler-row">
                                    <label htmlFor={`sa-compiler-${key}`}>{key}</label>
                                    <input id={`sa-compiler-${key}`} type="text" value={value} onChange={(event) => onCompilerChange(key, event.target.value)} />
                                </div>
                            ))}
                            <button type="button" className="sa-primary-btn" onClick={onSaveSettings} disabled={busy}>Save Settings</button>
                        </article>
                    </div>
                )}
            </section>

            {showCreateAdmin && (
                <div className="sa-modal-backdrop">
                    <div className="sa-modal">
                        <h3>Create Admin</h3>
                        <form onSubmit={onCreateAdmin}>
                            <input type="text" placeholder="Full Name" value={adminPayload.fullName} onChange={(event) => setAdminPayload((prev) => ({ ...prev, fullName: event.target.value }))} />
                            <input type="text" placeholder="Username" required value={adminPayload.username} onChange={(event) => setAdminPayload((prev) => ({ ...prev, username: event.target.value }))} />
                            <input type="email" placeholder="Email" required value={adminPayload.email} onChange={(event) => setAdminPayload((prev) => ({ ...prev, email: event.target.value }))} />
                            <input type="password" placeholder="Password" required value={adminPayload.password} onChange={(event) => setAdminPayload((prev) => ({ ...prev, password: event.target.value }))} />
                            <input type="text" placeholder="Phone" value={adminPayload.phone} onChange={(event) => setAdminPayload((prev) => ({ ...prev, phone: event.target.value }))} />
                            <div className="sa-modal-actions">
                                <button type="button" onClick={() => setShowCreateAdmin(false)}>Cancel</button>
                                <button type="submit" className="sa-primary-btn" disabled={busy}>Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminProfile;
