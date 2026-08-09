import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';
import { FaUser, FaEnvelope, FaTrash, FaUserShield, FaSearch, FaCheckCircle, FaTimesCircle, FaUserCheck, FaUserSlash } from 'react-icons/fa';

const UserManagement = () => {
    const { user: currentUser } = useSelector((state) => state.auth);
    const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isMobile, setIsMobile] = useState(() => (
        typeof window !== 'undefined' ? window.innerWidth <= 768 : false
    ));

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const queryRole = filterRole === 'all' ? 'ALL' : filterRole;
            let query = `/admin/users?role=${queryRole}&limit=100`;
            if (filterStatus !== 'all') {
                query += `&status=${filterStatus}`;
            }

            const res = await api.get(query);
            setUsers(res.data.users || []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [filterRole, filterStatus]);

    const handleRoleChange = async (userId, newRole) => {
        if (!isSuperAdmin) {
            toast.error("Only Super Admins can update roles");
            return;
        }
        if (!window.confirm(`Change user role to ${newRole}?`)) return;
        try {
            await api.put(`/admin/users/${userId}/role`, { role: newRole });
            toast.success("User role updated");
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update role");
        }
    };

    const handleDeleteUser = async (targetUser) => {
        if (targetUser.role === 'SUPER_ADMIN') {
            toast.error("Super Admin cannot be deleted");
            return;
        }
        if (targetUser.role === 'ADMIN' && !isSuperAdmin) {
            toast.error("Only Super Admins can delete other Admins");
            return;
        }

        if (!window.confirm(
            `⚠️ Permanently delete user "${targetUser.username}" (${targetUser.email})?\n\nThis will remove the account directly from the database and cannot be undone. Super Admin will be notified.`
        )) return;

        try {
            const res = await api.delete(`/admin/users/${targetUser._id}`);
            toast.success(res.data?.message || `User "${targetUser.username}" permanently deleted`);
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete user");
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.username?.toLowerCase().includes(search.toLowerCase()) ||
            user.email?.toLowerCase().includes(search.toLowerCase());
        return matchesSearch;
    });

    const getRoleBadge = (role) => {
        switch (role) {
            case 'SUPER_ADMIN': return <span className="sa-badge sa-badge-purple" style={{ fontWeight: 800 }}>SUPER ADMIN</span>;
            case 'ADMIN': return <span className="sa-badge sa-badge-blue" style={{ fontWeight: 750 }}>ADMIN</span>;
            default: return <span className="sa-badge" style={{ background: 'var(--sa-pill-inactive)', color: 'var(--sa-text-muted)', border: '1px solid var(--sa-border)' }}>USER</span>;
        }
    };

    return (
        <div className="glass-panel">
            <div className="flex justify-between items-center mb-6" style={{ flexWrap: isMobile ? 'wrap' : 'nowrap', gap: isMobile ? '10px' : undefined }}>
                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--sa-text)', margin: 0 }}>
                    <FaUserShield style={{ color: '#10b981' }} /> User Management
                </h2>
                <div className="flex gap-3" style={{ width: isMobile ? '100%' : 'auto', flexDirection: isMobile ? 'column' : 'row' }}>
                    <div className="relative" style={{ width: isMobile ? '100%' : 'auto' }}>
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--sa-text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="sa-input"
                            style={{ paddingLeft: '2.4rem', width: isMobile ? '100%' : '220px' }}
                        />
                    </div>
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="sa-input"
                        style={{ width: isMobile ? '100%' : '120px', cursor: 'pointer' }}
                    >
                        <option value="ALL">All Roles</option>
                        <option value="USER">User</option>
                        <option value="ADMIN">Admin</option>
                        <option value="SUPER_ADMIN">Super Admin</option>
                    </select>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="sa-input"
                        style={{ width: isMobile ? '100%' : '130px', cursor: 'pointer' }}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active Only</option>
                        <option value="inactive">Inactive Only</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="sa-empty-text" style={{ padding: '2rem 0', textAlign: 'center' }}>Loading users...</div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Joined</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(u => (
                                <tr key={u._id}>
                                    <td>
                                        <div className="flex flex-col">
                                            <span className="font-semibold flex items-center gap-2" style={{ color: 'var(--sa-text)' }}>
                                                <FaUser style={{ color: 'var(--sa-text-muted)', fontSize: '0.75rem' }} /> {u.username}
                                            </span>
                                            <span style={{ color: 'var(--sa-text-muted)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                                <FaEnvelope style={{ fontSize: '0.75rem' }} /> {u.email}
                                            </span>
                                        </div>
                                    </td>
                                    <td>{getRoleBadge(u.role)}</td>
                                    <td>
                                        {u.isActive !== false ? (
                                            <span className="sa-badge sa-badge-green" style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                <FaCheckCircle size={10} /> Active
                                            </span>
                                        ) : (
                                            <span className="sa-badge sa-badge-red" style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                <FaTimesCircle size={10} /> Inactive
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ color: 'var(--sa-text-muted)', fontSize: '0.85rem' }}>
                                        {new Date(u.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="text-right">
                                        <div className="flex justify-end gap-3" style={{ flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                                            {u.role !== 'SUPER_ADMIN' && (
                                                <>
                                                    {isSuperAdmin ? (
                                                        <select
                                                            value={u.role}
                                                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                                            className="sa-input"
                                                            style={{ padding: '4px 8px', fontSize: '0.82rem', height: '36px', minWidth: '90px' }}
                                                        >
                                                            <option value="USER">User</option>
                                                            <option value="ADMIN">Admin</option>
                                                        </select>
                                                    ) : null}
                                                    <button
                                                        onClick={() => handleDeleteUser(u)}
                                                        className="sa-btn sa-btn-danger"
                                                        style={{
                                                            padding: '6px 14px',
                                                            minHeight: '36px',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '6px'
                                                        }}
                                                        title="Permanently Delete User from Database"
                                                    >
                                                        <FaTrash size={12} />
                                                        <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>Delete</span>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="sa-empty-text" style={{ textAlign: 'center', padding: '2rem 0' }}>No users found matching filters.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
