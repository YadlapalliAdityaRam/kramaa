import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';
import { FaUser, FaEnvelope, FaShieldAlt, FaTrash, FaUserShield, FaBan, FaSearch } from 'react-icons/fa';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('USER');
    const [filterStatus, setFilterStatus] = useState('all');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const queryRole = filterRole === 'all' ? 'ALL' : filterRole;
            let query = `/admin/users?role=${queryRole}`;
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
        if (!window.confirm(`Change user role to ${newRole}?`)) return;
        try {
            await api.put(`/admin/users/${userId}/role`, { role: newRole });
            toast.success("User role updated");
            fetchUsers();
        } catch (err) {
            toast.error("Failed to update role");
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure? This action cannot be undone.")) return;
        try {
            await api.delete(`/admin/users/${userId}`);
            toast.success("User deleted");
            fetchUsers();
        } catch (err) {
            toast.error("Failed to delete user");
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.username?.toLowerCase().includes(search.toLowerCase()) ||
            user.email?.toLowerCase().includes(search.toLowerCase());
        return matchesSearch;
    });

    const getRoleBadge = (role) => {
        switch (role) {
            case 'SUPER_ADMIN': return <span className="bg-purple-900/30 text-purple-300 text-xs px-3 py-1.5 rounded-lg font-bold border-2 border-purple-600/40 shadow-lg shadow-purple-500/20">SUPER ADMIN</span>;
            case 'ADMIN': return <span className="bg-blue-900/30 text-blue-300 text-xs px-3 py-1.5 rounded-lg font-bold border-2 border-blue-600/40 shadow-lg shadow-blue-500/20">ADMIN</span>;
            default: return <span className="bg-gray-800/50 text-gray-300 text-xs px-3 py-1.5 rounded-lg font-bold border-2 border-gray-600/40">USER</span>;
        }
    };

    return (
        <div className="glass-panel">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FaUserShield className="text-green-400" /> User Management
                </h2>
                <div className="flex gap-5">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-[#252526] text-white pl-10 pr-4 py-2.5 rounded-lg border border-[#444] text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none w-64 transition-all"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-[#252526] text-white px-4 py-2.5 rounded-lg border border-[#444] text-sm outline-none cursor-pointer hover:border-gray-500 transition-all min-w-[140px]"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="text-gray-400 text-center py-8">Loading users...</div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Joined</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user._id}>
                                    <td>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-white flex items-center gap-2">
                                                <FaUser className="text-gray-500 text-xs" /> {user.username}
                                            </span>
                                            <span className="text-gray-500 text-xs flex items-center gap-2 mt-0.5">
                                                <FaEnvelope className="text-xs" /> {user.email}
                                            </span>
                                        </div>
                                    </td>
                                    <td>{getRoleBadge(user.role)}</td>
                                    <td className="text-gray-400 text-sm">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="text-right">
                                        <div className="flex justify-end gap-5">
                                            {user.role !== 'SUPER_ADMIN' && (
                                                <>
                                                    <select
                                                        value={user.role}
                                                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                                        className="bg-[#111] text-gray-300 text-sm px-3 py-2 rounded-lg border border-[#444] outline-none hover:border-gray-500 transition-all cursor-pointer min-h-[40px]"
                                                    >
                                                        <option value="USER">User</option>
                                                        <option value="ADMIN">Admin</option>
                                                    </select>
                                                    <button
                                                        onClick={() => handleDeleteUser(user._id)}
                                                        className="text-red-400 hover:text-red-300 px-3 py-2 hover:bg-red-900/30 rounded-lg transition-all border border-transparent hover:border-red-500/50 min-h-[40px] min-w-[40px]"
                                                        title="Delete User"
                                                    >
                                                        <FaTrash size={16} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="text-center py-8 text-gray-500">No users found matching filters.</td>
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
