import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { FaBell } from 'react-icons/fa';
import api, { getCurrentSocketBaseUrl, getSocketClientOptions } from '../../../utils/api';
import './NotificationBell.css';

/* ─── helpers ─── */
const timeAgo = (dateStr) => {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = Math.max(0, now - then);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const groupNotifications = (list) => {
    const safeList = Array.isArray(list) ? list : [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups = { today: [], yesterday: [], earlier: [] };
    for (const n of safeList) {
        const d = new Date(n.createdAt);
        d.setHours(0, 0, 0, 0);
        if (d.getTime() === today.getTime()) groups.today.push(n);
        else if (d.getTime() === yesterday.getTime()) groups.yesterday.push(n);
        else groups.earlier.push(n);
    }
    return groups;
};

const TYPE_ICONS = {
    contest: '🏆',
    submission: '📝',
    reply: '💬',
    like: '❤️',
    achievement: '🏅',
    system: '🔔'
};

/* ═══════════════════════════════════════════════ */

const NotificationBell = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useSelector((s) => s.auth);
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [ringAnim, setRingAnim] = useState(false);
    const [filter, setFilter] = useState('all');
    const dropdownRef = useRef(null);
    const bellRef = useRef(null);
    const socketRef = useRef(null);

    const FILTER_TABS = [
        { key: 'all', label: 'All' },
        { key: 'contest', label: '🏆 Contest' },
        { key: 'submission', label: '📝 Submit' },
        { key: 'reply', label: '💬 Reply' },
        { key: 'system', label: '🔔 System' }
    ];

    /* ─── Fetch unread count ─── */
    const fetchUnreadCount = useCallback(async () => {
        if (!localStorage.getItem('token')) return;
        try {
            const res = await api.get('/notifications/unread-count');
            setUnreadCount(res.data.count || 0);
        } catch (_) { /* silent */ }
    }, []);

    /* ─── Fetch notifications ─── */
    const fetchNotifications = useCallback(async () => {
        if (!localStorage.getItem('token')) return;
        setLoading(true);
        try {
            const res = await api.get('/notifications?limit=20');
            setNotifications(Array.isArray(res.data?.notifications) ? res.data.notifications : []);
            setUnreadCount(res.data.unreadCount ?? 0);
        } catch (_) { /* silent */ }
        setLoading(false);
    }, []);

    /* ─── Socket.IO ─── */
    useEffect(() => {
        if (!isAuthenticated || !user?._id) return;

        const socketUrl = getCurrentSocketBaseUrl();
        const socket = io(socketUrl, getSocketClientOptions({
            reconnectionAttempts: 20
        }));

        socket.on('connect', () => {
            socket.emit('notification:join', user._id);
        });

        socket.on('notification:new', (payload) => {
            setNotifications((prev) => [payload, ...prev].slice(0, 30));
            setUnreadCount((c) => c + 1);
            // bell ring animation
            setRingAnim(true);
            setTimeout(() => setRingAnim(false), 700);
        });

        socketRef.current = socket;

        return () => {
            socket.emit('notification:leave', user._id);
            socket.disconnect();
            socketRef.current = null;
        };
    }, [isAuthenticated, user?._id]);

    /* ─── Initial load + polling ─── */
    useEffect(() => {
        if (!isAuthenticated) return;
        fetchUnreadCount();
        const interval = setInterval(() => {
            fetchUnreadCount();
            // Also refresh full list if dropdown is open
            if (open) fetchNotifications();
        }, 30000);
        return () => clearInterval(interval);
    }, [isAuthenticated, fetchUnreadCount, fetchNotifications, open]);

    /* ─── When dropdown opens, fetch full list ─── */
    useEffect(() => {
        if (open && isAuthenticated) {
            fetchNotifications();
        }
    }, [open, isAuthenticated, fetchNotifications]);

    /* ─── Click outside / Escape ─── */
    useEffect(() => {
        if (!open) return;
        const onClickOutside = (e) => {
            if (dropdownRef.current?.contains(e.target) || bellRef.current?.contains(e.target)) return;
            setOpen(false);
        };
        const onEscape = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onClickOutside);
        document.addEventListener('keydown', onEscape);
        return () => {
            document.removeEventListener('mousedown', onClickOutside);
            document.removeEventListener('keydown', onEscape);
        };
    }, [open]);

    /* ─── Handlers ─── */
    const handleToggle = () => setOpen((p) => !p);

    const handleClickNotification = async (n) => {
        // Mark as read
        if (!n.isRead) {
            try {
                await api.put(`/notifications/${n._id}/read`);
                setNotifications((prev) => prev.map((x) => x._id === n._id ? { ...x, isRead: true } : x));
                setUnreadCount((c) => Math.max(0, c - 1));
            } catch (_) { /* silent */ }
        }
        setOpen(false);
        if (n.link) navigate(n.link);
    };

    const handleMarkAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (_) { /* silent */ }
    };

    const handleClearAll = async () => {
        try {
            await api.delete('/notifications/all');
            setNotifications([]);
            setUnreadCount(0);
        } catch (_) {
            setNotifications([]);
            setUnreadCount(0);
        }
    };

    if (!isAuthenticated) return null;

    const safeNotifications = Array.isArray(notifications) ? notifications : [];
    const badgeText = unreadCount > 99 ? '99+' : String(unreadCount);
    const filtered = filter === 'all'
        ? safeNotifications
        : safeNotifications.filter((n) => n?.type === filter);
    const grouped = groupNotifications(filtered);

    const renderGroup = (label, items) => {
        const safeItems = Array.isArray(items) ? items : [];
        if (safeItems.length === 0) return null;
        return (
            <div key={label}>
                <div className="notification-group-heading">{label}</div>
                {safeItems.map((n) => (
                    <button
                        key={n._id || n.createdAt}
                        className={`notification-item${n.isRead ? '' : ' unread'}`}
                        onClick={() => handleClickNotification(n)}
                        type="button"
                    >
                        <div className={`notification-item-icon type-${n.type || 'system'}`}>
                            {n.icon || TYPE_ICONS[n.type] || '🔔'}
                        </div>
                        <div className="notification-item-content">
                            <p className="notification-item-title">{n.title}</p>
                            <p className="notification-item-message">{n.message}</p>
                            <span className="notification-item-time">{timeAgo(n.createdAt)}</span>
                        </div>
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="notification-bell-wrapper">
            <button
                ref={bellRef}
                className={`notification-bell-btn${unreadCount > 0 ? ' has-unread' : ''}${ringAnim ? ' ring-anim' : ''}`}
                onClick={handleToggle}
                title="Notifications"
                type="button"
            >
                <FaBell />
                {unreadCount > 0 && <span className="notification-badge">{badgeText}</span>}
            </button>

            {open && (
                <div className="notification-dropdown" ref={dropdownRef}>
                    {/* Header */}
                    <div className="notification-dropdown-header">
                        <h3>Notifications</h3>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            {unreadCount > 0 && (
                                <button
                                    className="notification-mark-all-btn"
                                    onClick={handleMarkAllRead}
                                    type="button"
                                >
                                    Mark all read
                                </button>
                            )}
                            {safeNotifications.length > 0 && (
                                <button
                                    className="notification-mark-all-btn"
                                    onClick={handleClearAll}
                                    type="button"
                                    style={{ color: '#ef4444' }}
                                >
                                    Clear all
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filter tabs */}
                    <div className="notification-filter-tabs">
                        {FILTER_TABS.map(tab => (
                            <button
                                key={tab.key}
                                className={`notification-filter-tab${filter === tab.key ? ' active' : ''}`}
                                onClick={() => setFilter(tab.key)}
                                type="button"
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* List */}
                    <div className="notification-list">
                        {loading && safeNotifications.length === 0 ? (
                            <div className="notification-empty">
                                <div className="notification-empty-icon">⏳</div>
                                <p>Loading...</p>
                            </div>
                        ) : safeNotifications.length === 0 ? (
                            <div className="notification-empty">
                                <div className="notification-empty-icon">🔔</div>
                                <p>No notifications yet</p>
                                <span>Stay tuned! We'll let you know when something happens.</span>
                            </div>
                        ) : (
                            <>
                                {renderGroup('Today', grouped.today)}
                                {renderGroup('Yesterday', grouped.yesterday)}
                                {renderGroup('Earlier', grouped.earlier)}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
