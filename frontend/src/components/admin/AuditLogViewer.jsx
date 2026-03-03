import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FaHistory, FaFilter } from 'react-icons/fa';

const AuditLogViewer = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({ action: '', actor: '' });

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page,
                limit: 10,
                ...filters
            }).toString();

            const res = await api.get(`/admin/audit-logs?${query}`);
            setLogs(res.data.logs);
            setTotalPages(res.data.totalPages);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, filters]); // Re-fetch when page or filters change

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setPage(1); // Reset to page 1 on filter change
    };

    return (
        <div className="glass-panel">
            <div className="sa-card-header mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FaHistory className="text-blue-400" /> Audit Logs
                </h2>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-5 mb-6 bg-[#1e1e1e] p-4 rounded-xl border border-[#333]">
                <div className="flex items-center gap-2 text-gray-400">
                    <FaFilter />
                    <span className="text-sm font-bold tracking-wider">FILTERS</span>
                </div>
                <input
                    type="text"
                    name="action"
                    placeholder="Filter by Action (e.g. USER_LOGIN)"
                    value={filters.action}
                    onChange={handleFilterChange}
                    className="bg-[#252526] text-white px-4 py-2.5 rounded-lg border border-[#444] text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none flex-1 transition-all"
                />
            </div>

            {/* Logs Table */}
            {loading ? (
                <div className="text-gray-400 text-center py-8">Loading logs...</div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Action</th>
                                <th>Target</th>
                                <th>Actor</th>
                                <th>Details</th>
                                <th>IP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log._id}>
                                    <td className="text-gray-400 text-sm">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="font-semibold text-blue-400 text-sm">
                                        {log.action}
                                    </td>
                                    <td className="text-gray-300 text-sm">{log.targetType}</td>
                                    <td className="text-purple-400 text-sm">
                                        {log.actor ? (log.actor.username || log.actor.email) : 'System'}
                                    </td>
                                    <td className="text-gray-500 text-xs max-w-xs truncate" title={JSON.stringify(log.details, null, 2)}>
                                        {JSON.stringify(log.details)}
                                    </td>
                                    <td className="text-gray-500 font-mono text-xs">{log.ipAddress}</td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="text-center py-8 text-gray-500">No logs found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            <div className="flex justify-between items-center mt-6 gap-5">
                <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="px-5 py-2.5 bg-[#333] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#444] text-sm font-semibold transition-all min-h-[44px] border border-transparent hover:border-teal-500/30"
                >
                    Previous
                </button>
                <span className="text-gray-400 text-sm font-semibold">Page {page} of {totalPages}</span>
                <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-5 py-2.5 bg-[#333] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#444] text-sm font-semibold transition-all min-h-[44px] border border-transparent hover:border-teal-500/30"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default AuditLogViewer;
