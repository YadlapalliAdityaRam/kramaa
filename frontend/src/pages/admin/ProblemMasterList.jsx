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
        <div className="p-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="glass-panel p-6 flex flex-col items-center justify-center">
                    <FaLayerGroup className="text-3xl text-blue-400 mb-2" />
                    <span className="text-2xl font-bold text-white">{publishedStats.totalProblems || 0}</span>
                    <span className="text-gray-400 text-sm">Published Problems</span>
                </div>
                <div className="glass-panel p-6 flex flex-col items-center justify-center bg-green-900/20 border-green-500/30">
                    <span className="text-3xl font-bold text-green-400 mb-1">{publishedStats?.difficulty?.easy || 0}</span>
                    <span className="text-gray-400 text-sm uppercase tracking-wider">Easy</span>
                </div>
                <div className="glass-panel p-6 flex flex-col items-center justify-center bg-yellow-900/20 border-yellow-500/30">
                    <span className="text-3xl font-bold text-yellow-400 mb-1">{publishedStats?.difficulty?.medium || 0}</span>
                    <span className="text-gray-400 text-sm uppercase tracking-wider">Medium</span>
                </div>
                <div className="glass-panel p-6 flex flex-col items-center justify-center bg-red-900/20 border-red-500/30">
                    <span className="text-3xl font-bold text-red-500 mb-1">{publishedStats?.difficulty?.hard || 0}</span>
                    <span className="text-gray-400 text-sm uppercase tracking-wider">Hard</span>
                </div>
            </div>

            {/* Main Content */}
            <div className="glass-panel">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Problem Master List</h2>
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-3 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search by Title or Admin..."
                            className="bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:border-purple-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-10 text-gray-400">Loading master list...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-gray-400 border-b border-gray-700">
                                    <th className="p-4 font-medium">Title</th>
                                    <th className="p-4 font-medium">Difficulty</th>
                                    <th className="p-4 font-medium">Created By</th>
                                    <th className="p-4 font-medium">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProblems.map(problem => (
                                    <tr key={problem._id} className="border-b border-gray-800 hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-white font-medium">{problem.title}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${problem.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                                                problem.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-red-500/20 text-red-400'
                                                }`}>
                                                {problem.difficulty}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => navigate(`admin/${problem.createdBy?._id}`)}
                                                className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
                                                title="View Admin Stats"
                                            >
                                                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs">
                                                    {(problem.createdBy?.username || 'U')[0].toUpperCase()}
                                                </div>
                                                {problem.createdBy?.username || 'Unknown'}
                                            </button>
                                        </td>
                                        <td className="p-4 text-gray-500 text-sm">
                                            {new Date(problem.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProblemMasterList;
