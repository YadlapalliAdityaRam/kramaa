import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import api, { getCurrentSocketBaseUrl, getSocketClientOptions } from '../../../utils/api';
import { FaPlus, FaEdit, FaTrash, FaCheckCircle, FaTimesCircle, FaPlay } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

const ADMIN_REFRESH_EVENT = 'admin:refresh';
const SUPER_ADMIN_REFRESH_EVENT = 'superadmin:refresh';
const AUTO_REFRESH_INTERVAL_MS = 10000;
const AUTO_REFRESH_SECTIONS = new Set(['dashboard', 'activity', 'stats', 'analytics', 'admins']);

const ProblemList = () => {
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useSelector(state => state.auth);
    const isAdminOrSuper = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    const fetchProblems = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await api.get('/problems/admin-list');
            setProblems(res.data.problems || []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch problems");
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

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this problem?")) return;
        try {
            await api.delete(`/problems/${id}`);
            toast.success("Problem deleted");
            fetchProblems();
        } catch (err) {
            toast.error("Failed to delete problem");
        }
    };

    return (
        <div className="glass-panel">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Problem Management</h2>
                {isAdminOrSuper && (
                    <Link to="/admin/create-problem" className="btn-primary flex items-center gap-2">
                        <FaPlus /> Create New
                    </Link>
                )}
            </div>

            {loading ? (
                <div className="text-gray-400 text-center py-8">Loading problems...</div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Difficulty</th>
                                <th>Acceptance Rates</th>
                                <th>Tags</th>
                                <th className="text-center">Status</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {problems.map(problem => (
                                <tr key={problem._id}>
                                    <td className="font-semibold">{problem.title}</td>
                                    <td>
                                        <span className={`status-badge ${problem.difficulty === 'Easy' ? 'badge-green' :
                                            problem.difficulty === 'Medium' ? 'badge-yellow' :
                                                'badge-red'
                                            }`}>
                                            {problem.difficulty}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex flex-col text-xs space-y-1" title={`Submissions: ${problem.totalAcceptedSubmissions}/${problem.totalSubmissions} | Users: ${problem.totalUniqueSolvedUsers}/${problem.totalUniqueAttemptedUsers}`}>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-400">Sub:</span>
                                                <span className={`font-mono ${(problem.submissionAcceptanceRate || 0) > 50 ? 'text-green-400' : 'text-yellow-400'}`}>
                                                    {problem.submissionAcceptanceRate || 0}%
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-400">User:</span>
                                                <span className={`font-mono ${(problem.userAcceptanceRate || 0) > 50 ? 'text-green-400' : 'text-yellow-400'}`}>
                                                    {problem.userAcceptanceRate || 0}%
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-sm text-gray-400">
                                        {problem.tags?.join(', ') || '-'}
                                    </td>
                                    <td className="text-center">
                                        {problem.isPublished ? (
                                            <span title="Published" className="text-green-500"><FaCheckCircle /></span>
                                        ) : (
                                            <span title="Draft (Unpublished)" className="text-yellow-500"><FaTimesCircle /></span>
                                        )}
                                    </td>
                                    <td className="text-right">
                                        <div className="flex justify-end gap-5">
                                            <Link
                                                to={`/coding-platform/${problem.slug || problem._id}`}
                                                target="_blank"
                                                className="action-btn btn-icon text-green-400 hover:bg-green-500/10"
                                                title="Solve"
                                            >
                                                <FaPlay />
                                            </Link>
                                            {isAdminOrSuper && (
                                                <Link
                                                    to={`/admin/edit-problem/${problem._id}`}
                                                    className="action-btn btn-icon text-blue-400 hover:bg-blue-500/10"
                                                    title="Edit"
                                                >
                                                    <FaEdit />
                                                </Link>
                                            )}
                                            {isAdminOrSuper && (
                                                <button
                                                    onClick={() => handleDelete(problem._id)}
                                                    className="action-btn btn-icon btn-delete hover:bg-red-500/10"
                                                    title="Delete"
                                                >
                                                    <FaTrash />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {problems.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="text-center py-8 text-gray-500">
                                        {isAdminOrSuper ? 'No problems found. Create one to get started.' : 'No problems found.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ProblemList;
