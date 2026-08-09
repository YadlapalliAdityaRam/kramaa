import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api, { getCurrentSocketBaseUrl, getSocketClientOptions } from '../../utils/api';
import { toast } from 'react-hot-toast';
import { FaTrash, FaUserPlus } from 'react-icons/fa';

const SUPER_ADMIN_REFRESH_EVENT = 'superadmin:refresh';
const AUTO_REFRESH_INTERVAL_MS = 10000;
const AUTO_REFRESH_SECTIONS = new Set(['admins', 'stats', 'analytics', 'audit', 'profile']);

const AdminManagement = () => {
    const navigate = useNavigate();
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteName, setInviteName] = useState({ first: '', last: '' });
    const [inviting, setInviting] = useState(false);

    const fetchAdmins = useCallback(async () => {
        try {
            const res = await api.get('/superadmin/admins?includeSuperAdmins=true&limit=100');
            setAdmins(res.data.admins || []);
        } catch (err) {
            console.error("Failed to fetch admins", err);
            toast.error("Failed to load admins");
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
        }, AUTO_REFRESH_INTERVAL_MS);
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
                || sections.some((section) => AUTO_REFRESH_SECTIONS.has(String(section || '').toLowerCase()));
            if (shouldRefresh) fetchAdmins();
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

    const handleInvite = async (e) => {
        e.preventDefault();
        setInviting(true);
        try {
            await api.post('/users/invite', {
                email: inviteEmail,
                role: 'ADMIN'
            });
            toast.success("Invitation sent successfully!");
            setInviteEmail('');
            setInviteName({ first: '', last: '' });
            fetchAdmins();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to invite admin");
        } finally {
            setInviting(false);
        }
    };

    const handleRevoke = async (adminId) => {
        if (!window.confirm("Are you sure you want to revoke this admin's access? They will become a normal user.")) return;
        try {
            await api.put(`/admin/users/revoke/${adminId}`);
            toast.success("Admin access revoked");
            fetchAdmins();
        } catch (err) {
            toast.error("Failed to revoke access");
        }
    };

    const handleDelete = async (adminId) => {
        const reason = prompt("REQUIRED: Enter reason for DELETION. This will deactivate the account.");
        if (!reason) return;

        try {
            await api.delete(`/admin/users/${adminId}`, { data: { reason } });
            toast.success("Admin account deactivated and deleted.");
            fetchAdmins();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete admin");
        }
    };

    return (
        <div className="sa-card">
            <div className="sa-card-header">
                <h2 className="sa-card-title">
                    <FaUserPlus style={{ color: 'var(--sa-accent)' }} /> Admin Management
                </h2>
            </div>

            {/* Invite Form */}
            <form onSubmit={handleInvite} style={{ marginBottom: '2rem', background: 'var(--sa-pill-inactive)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--sa-border)' }}>
                <h3 style={{ textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '700', color: 'var(--sa-text-muted)', marginBottom: '1rem', letterSpacing: '0.05em' }}>
                    Invite New Admin
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <input
                        type="text"
                        placeholder="First Name"
                        value={inviteName.first}
                        onChange={e => setInviteName({ ...inviteName, first: e.target.value })}
                        className="sa-input"
                        required
                    />
                    <input
                        type="text"
                        placeholder="Last Name"
                        value={inviteName.last}
                        onChange={e => setInviteName({ ...inviteName, last: e.target.value })}
                        className="sa-input"
                        required
                    />
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        className="sa-input"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={inviting}
                    className="sa-btn sa-btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                >
                    {inviting ? 'Sending...' : 'Send Invitation'}
                </button>
            </form>

            {/* Admin List */}
            <h3 style={{ textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '700', color: 'var(--sa-text-muted)', marginBottom: '1rem', letterSpacing: '0.05em' }}>
                Current Admins
            </h3>
            {loading ? (
                <p className="sa-empty-text">Loading...</p>
            ) : admins.length === 0 ? (
                <p className="sa-empty-text">No active admins found.</p>
            ) : (
                <div className="sa-table-container">
                    <table className="sa-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Created</th>
                                <th>Approved</th>
                                <th>Pending</th>
                                <th>Acceptance</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {admins.map(admin => (
                                <tr key={admin._id}>
                                    <td style={{ fontWeight: '600' }}>{admin.firstName || admin.username} {admin.lastName}</td>
                                    <td style={{ color: 'var(--sa-text-muted)' }}>{admin.email}</td>
                                    <td>
                                        <span className={`sa-badge ${admin.role === 'SUPER_ADMIN' ? 'sa-badge-purple' : 'sa-badge-blue'}`}>
                                            {admin.role}
                                        </span>
                                    </td>
                                    <td>{admin.performance?.createdProblems || 0}</td>
                                    <td>{admin.performance?.approvedProblems || 0}</td>
                                    <td>{admin.performance?.pendingProblems || 0}</td>
                                    <td style={{ fontWeight: '600' }}>{admin.performance?.acceptanceRate || 0}%</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                                            <button
                                                onClick={() => navigate(`/super-admin/problems/admin/${admin._id}`)}
                                                className="sa-btn sa-btn-primary"
                                                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                                                title="View Admin Analysis"
                                            >
                                                Analysis
                                            </button>
                                            {admin.role !== 'SUPER_ADMIN' && (
                                                <>
                                                    <button
                                                        onClick={() => handleRevoke(admin._id)}
                                                        className="sa-btn sa-btn-secondary"
                                                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                                                        title="Revoke Admin Access"
                                                    >
                                                        Revoke
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(admin._id)}
                                                        className="sa-btn sa-btn-danger"
                                                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                                                        title="Delete & Deactivate Account"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminManagement;
