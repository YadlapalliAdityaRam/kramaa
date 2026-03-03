import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import {
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
import api, { getCurrentSocketBaseUrl, getSocketClientOptions } from '../../utils/api';
import { logout } from '../../redux/slices/authSlice';
import '../../styles/AdminProfile.css';

const ADMIN_REFRESH_EVENT = 'admin:refresh';
const DEFAULT_REFRESH_SECTIONS = ['profile', 'dashboard', 'activity', 'security'];
const PIE_COLORS = ['#34d399', '#f59e0b', '#f87171'];

const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'permissions', label: 'Permissions' },
    { id: 'activity', label: 'Recent Activities' },
    { id: 'security', label: 'Security Settings' }
];

const asDateTime = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString();
};

const asLastLogin = (value) => {
    const formatted = asDateTime(value);
    return formatted === '-' ? 'Never' : formatted;
};

const AdminProfile = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [profile, setProfile] = useState(null);
    const [dashboard, setDashboard] = useState(null);
    const [activityLogs, setActivityLogs] = useState([]);
    const [activityPaging, setActivityPaging] = useState({ page: 1, limit: 20, totalPages: 1 });
    const [security, setSecurity] = useState(null);
    const [profileForm, setProfileForm] = useState({ fullName: '', phone: '', profilePhoto: '' });
    const [permissionDraft, setPermissionDraft] = useState({});
    const seenAlerts = useRef(new Set());
    const accessBlockedRef = useRef(false);
    const [accessBlocked, setAccessBlocked] = useState(false);

    const refreshQueueRef = useRef(new Set());
    const refreshTimerRef = useRef(null);
    const normalizedRole = String(user?.role || '').toUpperCase();
    const hasAdminAccess = normalizedRole === 'ADMIN' || normalizedRole === 'SUPER_ADMIN';

    const handleAccessDenied = useCallback((statusCode = 403) => {
        if (accessBlockedRef.current) return;
        accessBlockedRef.current = true;
        setAccessBlocked(true);

        if (statusCode === 401) {
            toast.error('Session expired. Please login again.');
            dispatch(logout());
            navigate('/login', { replace: true });
            return;
        }

        toast.error('Admin access is required to open this page.');
        navigate('/unauthorized', { replace: true });
    }, [dispatch, navigate]);

    const safeGet = useCallback(async (url) => {
        try {
            return await api.get(url);
        } catch (error) {
            const statusCode = error?.response?.status;
            if (statusCode === 401 || statusCode === 403) {
                handleAccessDenied(statusCode);
            }
            throw error;
        }
    }, [handleAccessDenied]);

    const syncProfile = useCallback(async () => {
        const res = await safeGet('/admin/profile');
        const nextProfile = res.data.profile || null;
        setProfile(nextProfile);
        if (nextProfile) {
            setProfileForm({
                fullName: nextProfile.fullName || '',
                phone: nextProfile.phone || '',
                profilePhoto: nextProfile.profilePhoto || ''
            });
            setPermissionDraft(nextProfile.permissions || {});
        }
    }, [safeGet]);

    const syncDashboard = useCallback(async () => {
        const res = await safeGet('/admin/profile/dashboard');
        setDashboard(res.data.dashboard || null);
    }, [safeGet]);

    const syncActivity = useCallback(async (page = activityPaging.page || 1) => {
        const res = await safeGet(`/admin/profile/activity?page=${page}&limit=${activityPaging.limit || 20}`);
        setActivityLogs(res.data.logs || []);
        setActivityPaging(res.data.pagination || { page: 1, limit: 20, totalPages: 1 });
    }, [activityPaging.limit, activityPaging.page, safeGet]);

    const syncSecurity = useCallback(async () => {
        const res = await safeGet('/admin/profile/security');
        setSecurity(res.data.security || null);
    }, [safeGet]);

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            await Promise.all([
                syncProfile(),
                syncDashboard(),
                syncActivity(1),
                syncSecurity()
            ]);
        } catch (error) {
            if (!accessBlockedRef.current) {
                toast.error(error?.response?.data?.message || 'Failed to load admin profile');
            }
        } finally {
            setLoading(false);
        }
    }, [syncActivity, syncDashboard, syncProfile, syncSecurity]);

    const refreshSections = useCallback(async (sections = DEFAULT_REFRESH_SECTIONS) => {
        const normalizedSections = new Set(
            (Array.isArray(sections) && sections.length > 0 ? sections : DEFAULT_REFRESH_SECTIONS)
                .map((section) => String(section || '').toLowerCase())
        );

        const requests = [];
        if (normalizedSections.has('profile')) requests.push(syncProfile());
        if (normalizedSections.has('dashboard')) requests.push(syncDashboard());
        if (normalizedSections.has('activity')) requests.push(syncActivity(activityPaging.page || 1));
        if (normalizedSections.has('security')) requests.push(syncSecurity());

        if (requests.length === 0) return;
        await Promise.allSettled(requests);
    }, [activityPaging.page, syncActivity, syncDashboard, syncProfile, syncSecurity]);

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
        }, 450);
    }, [refreshSections]);

    useEffect(() => {
        if (!hasAdminAccess) {
            handleAccessDenied(403);
            return;
        }
        if (accessBlocked) return;
        loadAll();
    }, [accessBlocked, handleAccessDenied, hasAdminAccess, loadAll]);

    useEffect(() => {
        if (!hasAdminAccess || accessBlocked) return undefined;
        const timer = setInterval(() => {
            refreshSections(DEFAULT_REFRESH_SECTIONS);
        }, 10000);
        return () => clearInterval(timer);
    }, [accessBlocked, hasAdminAccess, refreshSections]);

    useEffect(() => {
        if (!hasAdminAccess || accessBlocked) return undefined;

        const socket = io(getCurrentSocketBaseUrl(), getSocketClientOptions());

        const handleConnect = () => {
            socket.emit('admin:subscribe');
        };

        const handleAdminRefresh = (payload = {}) => {
            const normalizedSections = (
                Array.isArray(payload.sections) && payload.sections.length > 0
                    ? payload.sections
                    : DEFAULT_REFRESH_SECTIONS
            )
                .map((section) => String(section || '').toLowerCase());

            const uniqueSections = [...new Set(normalizedSections)];
            const shouldRefreshDashboardNow = uniqueSections.includes('dashboard');

            if (shouldRefreshDashboardNow) {
                syncDashboard().catch(() => {});
            }

            const deferredSections = uniqueSections.filter((section) => section !== 'dashboard');
            if (deferredSections.length > 0) {
                queueRealtimeRefresh(deferredSections);
            }
        };

        socket.on('connect', handleConnect);
        socket.on(ADMIN_REFRESH_EVENT, handleAdminRefresh);

        return () => {
            if (refreshTimerRef.current) {
                clearTimeout(refreshTimerRef.current);
                refreshTimerRef.current = null;
            }
            refreshQueueRef.current.clear();
            socket.emit('admin:unsubscribe');
            socket.off('connect', handleConnect);
            socket.off(ADMIN_REFRESH_EVENT, handleAdminRefresh);
            socket.disconnect();
        };
    }, [accessBlocked, hasAdminAccess, queueRealtimeRefresh, syncDashboard]);

    const cards = useMemo(() => ([
        { label: 'Total Problems Created', value: dashboard?.stats?.totalProblemsCreated ?? 0 },
        { label: 'Total Problems Published', value: dashboard?.stats?.totalProblemsPublished ?? 0 },
        { label: 'Pending Problems', value: dashboard?.stats?.pendingProblems ?? 0 },
        { label: 'Reports Resolved', value: dashboard?.stats?.reportsResolved ?? 0 },
        { label: 'Pending Reports', value: dashboard?.stats?.pendingReports ?? 0 },
        { label: 'Avg Review Time (min)', value: dashboard?.stats?.averageReviewMinutes ?? 0 },
        { label: 'Active Users (24h)', value: dashboard?.stats?.activeUsers ?? 0 },
        { label: 'Submissions (14d)', value: dashboard?.stats?.submissionsLast14Days ?? 0 },
        { label: 'Acceptance Rate', value: `${dashboard?.stats?.acceptanceRate ?? 0}%` }
    ]), [dashboard]);
    const canEditPermissions = profile?.role === 'SUPER_ADMIN';
    const canEditSessionTimeout = profile?.role === 'SUPER_ADMIN';

    useEffect(() => {
        (dashboard?.alerts || []).forEach((alert) => {
            if (alert.type === 'info') return;
            const key = `${alert.code}:${alert.message}`;
            if (seenAlerts.current.has(key)) return;
            seenAlerts.current.add(key);
            if (alert.type === 'critical') {
                toast.error(alert.message, { duration: 4500 });
                return;
            }
            toast(alert.message, { icon: '!' });
        });
    }, [dashboard?.alerts]);

    const onSaveProfile = async () => {
        setBusy(true);
        try {
            const res = await api.patch('/admin/profile', profileForm);
            setProfile(res.data.profile || null);
            toast.success('Profile updated');
            await refreshSections(['profile', 'activity']);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to update profile');
        } finally {
            setBusy(false);
        }
    };

    const onSavePermissions = async () => {
        setBusy(true);
        try {
            await api.patch('/admin/profile', { permissions: permissionDraft });
            toast.success('Permissions updated');
            await refreshSections(['profile', 'activity']);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to update permissions');
        } finally {
            setBusy(false);
        }
    };

    const onSaveSecurity = async () => {
        setBusy(true);
        try {
            const payload = {
                twoFactorEnabled: Boolean(security?.twoFactorEnabled)
            };
            if (canEditSessionTimeout) {
                payload.sessionTimeoutMinutes = Number(security?.sessionTimeoutMinutes || 60);
            }
            await api.patch('/admin/profile/security', payload);
            toast.success('Security settings updated');
            await refreshSections(['security', 'activity']);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to update security settings');
        } finally {
            setBusy(false);
        }
    };

    const onForceLogoutAll = async () => {
        setBusy(true);
        try {
            await api.post('/admin/profile/security/force-logout');
            toast.success('All sessions revoked');
            dispatch(logout());
            setTimeout(() => navigate('/login', { replace: true }), 600);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to force logout');
        } finally {
            setBusy(false);
        }
    };

    if (loading) return <div className="admin-profile-loading">Loading Admin Profile...</div>;
    if (accessBlocked) return <div className="admin-profile-loading">Checking access...</div>;

    return (
        <div className="admin-profile-page">
            <section className="admin-profile-header">
                <div className="admin-profile-main">
                    <div className="admin-profile-avatar">
                        {profile?.profilePhoto ? (
                            <img src={profile.profilePhoto} alt={profile?.username || 'admin'} />
                        ) : (
                            <span>{profile?.username?.charAt(0)?.toUpperCase() || 'A'}</span>
                        )}
                    </div>
                    <div className="admin-profile-meta">
                        <h1>{profile?.fullName || profile?.username}</h1>
                        <p>{profile?.email}</p>
                        <div className="admin-profile-badges">
                            <span className="admin-role-badge">{profile?.role || 'ADMIN'}</span>
                            <span className="admin-role-pill">{profile?.adminRole || 'ADMIN'}</span>
                            <span className={`admin-status-pill ${profile?.isActive ? 'active' : 'inactive'}`}>
                                {profile?.accountStatus || 'Active'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="admin-profile-side">
                    <div><span>Admin ID</span><strong>{profile?.adminId || '-'}</strong></div>
                    <div><span>Last Login</span><strong>{asLastLogin(profile?.lastLogin)}</strong></div>
                </div>
            </section>

            <section className="admin-profile-tabs">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        className={`admin-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </section>

            {activeTab === 'overview' && (
                <section className="admin-overview-wrap">
                    <div className="admin-metrics-grid">
                        {cards.map((card) => (
                            <article key={card.label} className="admin-metric-card">
                                <span>{card.label}</span>
                                <strong>{card.value}</strong>
                            </article>
                        ))}
                    </div>

                    <div className="admin-chart-grid">
                        <article className="admin-chart-card">
                            <h3>Alerts</h3>
                            <div className="admin-alert-list">
                                {(dashboard?.alerts || []).map((alert) => (
                                    <div key={`${alert.code}-${alert.message}`} className={`admin-alert ${alert.type}`}>
                                        <strong>{alert.code}</strong>
                                        <p>{alert.message}</p>
                                    </div>
                                ))}
                            </div>
                        </article>
                        <article className="admin-chart-card">
                            <h3>Submissions Trend</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={dashboard?.charts?.submissionTrend || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2a3547" />
                                    <XAxis dataKey="date" stroke="#8ca0be" />
                                    <YAxis stroke="#8ca0be" />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} />
                                    <Line type="monotone" dataKey="accepted" stroke="#22c55e" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </article>
                        <article className="admin-chart-card">
                            <h3>Problem Difficulty</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={dashboard?.charts?.problemDifficultyDistribution || []}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={90}
                                        label
                                    >
                                        {(dashboard?.charts?.problemDifficultyDistribution || []).map((entry, index) => (
                                            <Cell key={`${entry.name}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </article>
                        <article className="admin-chart-card">
                            <h3>Server Health</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={[
                                    { name: 'CPU', value: dashboard?.serverHealth?.cpuUsage || 0 },
                                    { name: 'Memory', value: dashboard?.serverHealth?.memoryUsage || 0 }
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2a3547" />
                                    <XAxis dataKey="name" stroke="#8ca0be" />
                                    <YAxis stroke="#8ca0be" />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#8b5cf6" />
                                </BarChart>
                            </ResponsiveContainer>
                            <p className="admin-health-status">Status: {dashboard?.serverHealth?.status || 'HEALTHY'}</p>
                        </article>
                    </div>
                </section>
            )}

            {activeTab === 'permissions' && (
                <section className="admin-permission-wrap">
                    <div className="admin-panel">
                        <h3>Basic Profile Information</h3>
                        <div className="admin-form-grid">
                            <label>Admin ID</label>
                            <input value={profile?.adminId || '-'} readOnly />
                            <label>Last Login</label>
                            <input value={asLastLogin(profile?.lastLogin)} readOnly />
                            <label htmlFor="admin-full-name">Full Name</label>
                            <input
                                id="admin-full-name"
                                value={profileForm.fullName}
                                onChange={(event) => setProfileForm((prev) => ({ ...prev, fullName: event.target.value }))}
                            />
                            <label htmlFor="admin-phone">Phone</label>
                            <input
                                id="admin-phone"
                                value={profileForm.phone}
                                onChange={(event) => setProfileForm((prev) => ({ ...prev, phone: event.target.value }))}
                            />
                            <label htmlFor="admin-photo">Profile Photo URL</label>
                            <input
                                id="admin-photo"
                                value={profileForm.profilePhoto}
                                onChange={(event) => setProfileForm((prev) => ({ ...prev, profilePhoto: event.target.value }))}
                            />
                        </div>
                        <button type="button" className="admin-primary-btn" disabled={busy} onClick={onSaveProfile}>
                            Save Profile
                        </button>
                    </div>

                    <div className="admin-panel">
                        <h3>Role & Permission Matrix</h3>
                        {!canEditPermissions && <p className="admin-note">Only SUPER_ADMIN can modify permission matrix.</p>}
                        <div className="admin-permission-table">
                            {Object.entries(permissionDraft || {}).map(([key, value]) => (
                                <div key={key} className="admin-permission-row">
                                    <span>{key}</span>
                                    <label className="admin-switch">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(value)}
                                            disabled={!canEditPermissions}
                                            onChange={(event) => {
                                                const checked = event.target.checked;
                                                setPermissionDraft((prev) => ({ ...prev, [key]: checked }));
                                            }}
                                        />
                                        <span />
                                    </label>
                                </div>
                            ))}
                        </div>
                        <button type="button" className="admin-primary-btn" disabled={busy || !canEditPermissions} onClick={onSavePermissions}>
                            Save Permissions
                        </button>
                    </div>
                </section>
            )}

            {activeTab === 'activity' && (
                <section className="admin-activity-wrap">
                    <div className="admin-panel">
                        <h3>Audit Activity</h3>
                        <div className="admin-table-wrap">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Action</th>
                                        <th>Target</th>
                                        <th>IP</th>
                                        <th>Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activityLogs.map((log) => (
                                        <tr key={log._id}>
                                            <td>{log.action}</td>
                                            <td>{log.target}</td>
                                            <td>{log.ipAddress || '-'}</td>
                                            <td>{asDateTime(log.timestamp)}</td>
                                        </tr>
                                    ))}
                                    {activityLogs.length === 0 && (
                                        <tr><td colSpan={4} className="admin-empty-row">No activities yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="admin-pagination">
                            <button
                                type="button"
                                onClick={() => syncActivity(Math.max(1, activityPaging.page - 1))}
                                disabled={activityPaging.page <= 1}
                            >
                                Prev
                            </button>
                            <span>Page {activityPaging.page} / {activityPaging.totalPages || 1}</span>
                            <button
                                type="button"
                                onClick={() => syncActivity(Math.min(activityPaging.totalPages || 1, activityPaging.page + 1))}
                                disabled={activityPaging.page >= (activityPaging.totalPages || 1)}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {activeTab === 'security' && (
                <section className="admin-security-wrap">
                    <div className="admin-panel">
                        <h3>Security Controls</h3>
                        <div className="admin-security-grid">
                            <div className="admin-security-item">
                                <span>2FA Enabled</span>
                                <label className="admin-switch">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(security?.twoFactorEnabled)}
                                        onChange={(event) => setSecurity((prev) => ({ ...prev, twoFactorEnabled: event.target.checked }))}
                                    />
                                    <span />
                                </label>
                            </div>
                            <div className="admin-security-item">
                                <span>Session Timeout (minutes)</span>
                                <input
                                    type="number"
                                    value={security?.sessionTimeoutMinutes || 60}
                                    disabled={!canEditSessionTimeout}
                                    onChange={(event) => setSecurity((prev) => ({ ...prev, sessionTimeoutMinutes: Number(event.target.value || 60) }))}
                                />
                            </div>
                            <div className="admin-security-item">
                                <span>Failed Login Attempts</span>
                                <strong>{security?.failedLoginAttempts ?? 0}</strong>
                            </div>
                            <div className="admin-security-item">
                                <span>Last Failed Login</span>
                                <strong>{asDateTime(security?.lastFailedLoginAt)}</strong>
                            </div>
                        </div>
                        <div className="admin-action-row">
                            <button type="button" className="admin-primary-btn" disabled={busy} onClick={onSaveSecurity}>
                                Save Security
                            </button>
                            <button type="button" className="admin-danger-btn" disabled={busy} onClick={onForceLogoutAll}>
                                Force Logout All Devices
                            </button>
                        </div>
                    </div>
                    <div className="admin-panel">
                        <h3>Login History</h3>
                        <div className="admin-login-history">
                            {(security?.loginHistory || []).map((entry, index) => (
                                <div key={`${entry.timestamp}-${index}`} className="admin-login-row">
                                    <div>
                                        <strong>{entry.device || 'Unknown device'}</strong>
                                        <p>{entry.ip || '-'}</p>
                                    </div>
                                    <span>{asDateTime(entry.timestamp)}</span>
                                </div>
                            ))}
                            {(!security?.loginHistory || security.loginHistory.length === 0) && (
                                <p className="admin-empty-text">No login history available.</p>
                            )}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default AdminProfile;
