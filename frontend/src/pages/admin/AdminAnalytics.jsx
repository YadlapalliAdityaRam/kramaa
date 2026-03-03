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
        <div className="p-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <button
                    onClick={() => navigate('/superadmin/problems')} // Back to master list
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
                >
                    <FaArrowLeft /> Back to List
                </button>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                        {admin.username[0].toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">{admin.username}</h1>
                        <p className="text-gray-400">{admin.email} • Joined {new Date(admin.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
            </motion.div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="glass-panel p-6 border-l-4 border-blue-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-400 text-sm uppercase tracking-wider">Total Problems</p>
                            <h3 className="text-3xl font-bold text-white mt-1">{problemStats.total}</h3>
                        </div>
                        <FaBrain className="text-blue-500 text-2xl" />
                    </div>
                </div>
                <div className="glass-panel p-6 border-l-4 border-purple-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-400 text-sm uppercase tracking-wider">Completed Contests</p>
                            <h3 className="text-3xl font-bold text-white mt-1">{contestStats.completed} / {contestStats.total}</h3>
                        </div>
                        <FaTrophy className="text-purple-500 text-2xl" />
                    </div>
                </div>
                <div className="glass-panel p-6 border-l-4 border-green-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-400 text-sm uppercase tracking-wider">Active Rate</p>
                            <h3 className="text-3xl font-bold text-white mt-1">
                                {problemStats.total > 0
                                    ? Math.round((problemStats.statusDistribution.active / problemStats.total) * 100)
                                    : 0}%
                            </h3>
                        </div>
                        <FaCheckCircle className="text-green-500 text-2xl" />
                    </div>
                </div>
                <div className="glass-panel p-6 border-l-4 border-yellow-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-400 text-sm uppercase tracking-wider">Total Participants</p>
                            <h3 className="text-3xl font-bold text-white mt-1">{contestStats.totalParticipants}</h3>
                        </div>
                        <FaMedal className="text-yellow-500 text-2xl" />
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Problem Status & Difficulty</h3>
                    <div className="h-64 flex">
                        <MeasuredChart className="w-1/2 min-w-0 h-full">
                            {({ width, height }) => (
                                <PieChart width={width} height={height}>
                                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                                    <Legend />
                                </PieChart>
                            )}
                        </MeasuredChart>
                        <MeasuredChart className="w-1/2 min-w-0 h-full">
                            {({ width, height }) => (
                                <BarChart width={width} height={height} data={difficultyData}>
                                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                                    <YAxis stroke="#9ca3af" fontSize={12} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                        {difficultyData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            )}
                        </MeasuredChart>
                    </div>
                </div>

                <div className="glass-panel p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Contest Status Overview</h3>
                    <div className="h-64 flex justify-center items-center">
                        {contestStats.total > 0 ? (
                            <MeasuredChart className="w-full h-full min-w-0">
                                {({ width, height }) => (
                                    <PieChart width={width} height={height}>
                                    <Pie data={contestStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" label>
                                        {contestStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                                )}
                            </MeasuredChart>
                        ) : (
                            <p className="text-gray-500">No contests created yet</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Detailed Tables */}
            <div className="glass-panel p-0 overflow-hidden">
                <div className="flex border-b border-gray-700">
                    <button
                        className={`flex-1 py-4 text-center font-bold transition-colors ${activeTab === 'problems' ? 'bg-purple-600/20 text-purple-400 border-b-2 border-purple-500' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        onClick={() => setActiveTab('problems')}
                    >
                        Problems List ({problemStats.list.length})
                    </button>
                    <button
                        className={`flex-1 py-4 text-center font-bold transition-colors ${activeTab === 'contests' ? 'bg-blue-600/20 text-blue-400 border-b-2 border-blue-500' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        onClick={() => setActiveTab('contests')}
                    >
                        Contests List ({contestStats.list.length})
                    </button>
                </div>

                <div className="p-6">
                    {activeTab === 'problems' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-gray-400 border-b border-gray-700 text-sm">
                                        <th className="pb-3 px-2">Title</th>
                                        <th className="pb-3 px-2">Difficulty</th>
                                        <th className="pb-3 px-2">Status</th>
                                        <th className="pb-3 px-2">Created</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {problemStats.list.map(p => (
                                        <tr key={p._id} className="border-b border-gray-800 hover:bg-white/5 text-sm">
                                            <td className="py-3 px-2 text-white font-medium">{p.title}</td>
                                            <td className="py-3 px-2">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${p.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                                                    p.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-red-500/20 text-red-400'
                                                    }`}>{p.difficulty}</span>
                                            </td>
                                            <td className="py-3 px-2">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${p.isPublished ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                    {p.isPublished ? 'Active' : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                    {problemStats.list.length === 0 && (
                                        <tr><td colSpan="4" className="text-center py-6 text-gray-500">No problems found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-gray-400 border-b border-gray-700 text-sm">
                                        <th className="pb-3 px-2">Title</th>
                                        <th className="pb-3 px-2">Participants</th>
                                        <th className="pb-3 px-2">Status</th>
                                        <th className="pb-3 px-2">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {contestStats.list.map(c => (
                                        <tr key={c._id} className="border-b border-gray-800 hover:bg-white/5 text-sm">
                                            <td className="py-3 px-2 text-white font-medium">{c.title}</td>
                                            <td className="py-3 px-2">{c.participantCount ?? c.participantsCount ?? 0}</td>
                                            <td className="py-3 px-2">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${formatContestStatus(c.status).className}`}>
                                                    {formatContestStatus(c.status).label}
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 text-gray-500">{new Date(c.startTime).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                    {contestStats.list.length === 0 && (
                                        <tr><td colSpan="4" className="text-center py-6 text-gray-500">No contests found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminAnalytics;
