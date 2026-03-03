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
        <div className="p-6">
            <div className="glass-panel">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <FaUserShield className="text-purple-500" /> Admin Master List
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">Monitor admin performance and contributions</p>
                    </div>
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-3 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search admins..."
                            className="bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:border-purple-500 outline-none w-64 transition-all focus:w-80"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="spinner mb-4 border-4 border-purple-500 border-t-transparent w-12 h-12 rounded-full animate-spin mx-auto"></div>
                        <p className="text-gray-400">Loading admin data...</p>
                    </div>
                ) : filteredAdmins.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                        <FaUserShield className="text-4xl mx-auto mb-4 opacity-50" />
                        <p>No admins found matching your search.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAdmins.map((admin, index) => (
                            <motion.div
                                key={admin._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-purple-500/50 hover:bg-gray-800/80 transition-all group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                            {admin.username[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-lg group-hover:text-purple-400 transition-colors">
                                                {admin.username}
                                            </h3>
                                            <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                                                <FaEnvelope className="text-xs" /> {admin.email}
                                            </div>
                                        </div>
                                    </div>
                                    {getStatusBadge(admin.isActive)}
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
                                        <div className="text-gray-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                                            <FaBrain className="text-blue-400" /> Problems
                                        </div>
                                        <div className="text-2xl font-bold text-white">{admin.totalProblems}</div>
                                    </div>
                                    <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
                                        <div className="text-gray-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                                            <FaTrophy className="text-yellow-400" /> Contests
                                        </div>
                                        <div className="text-2xl font-bold text-white">{admin.totalContests}</div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => navigate(`admin/${admin._id}`)}
                                    className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2"
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
