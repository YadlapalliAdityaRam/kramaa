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
        <div className="sa-card">
            <div className="sa-card-header" style={{ marginBottom: '1.2rem' }}>
                <h2 className="sa-card-title">
                    <FaHistory style={{ color: 'var(--sa-accent-blue)' }} /> System Audit Logs
                </h2>
            </div>

            {/* Filters */}
            <div className="sa-filter-bar" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.2rem', padding: '0.85rem 1.2rem', borderRadius: '14px', background: 'var(--sa-pill-inactive)', border: '1px solid var(--sa-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--sa-text-muted)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <FaFilter />
                    <span>Filter</span>
                </div>
                <input
                    type="text"
                    name="action"
                    placeholder="Filter by Action (e.g. USER_LOGIN, CONTEST_CREATE)..."
                    value={filters.action}
                    onChange={handleFilterChange}
                    className="sa-input"
                    style={{ flex: 1 }}
                />
            </div>

            {/* Logs Table */}
            {loading ? (
                <div className="sa-empty-text" style={{ padding: '2.5rem 0' }}>Loading logs...</div>
            ) : (
                <div className="sa-table-container">
                    <table className="sa-table">
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
                                    <td style={{ color: 'var(--sa-text-muted)', fontSize: '0.82rem' }}>
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td>
                                        <span className="sa-badge sa-badge-blue">
                                            {log.action}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--sa-text)', fontSize: '0.85rem' }}>{log.targetType}</td>
                                    <td style={{ color: 'var(--sa-accent)', fontWeight: '600', fontSize: '0.85rem' }}>
                                        {log.actor ? (log.actor.username || log.actor.email) : 'System'}
                                    </td>
                                    <td style={{ color: 'var(--sa-text-muted)', fontSize: '0.78rem', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={JSON.stringify(log.details, null, 2)}>
                                        {JSON.stringify(log.details)}
                                    </td>
                                    <td style={{ color: 'var(--sa-text-muted)', fontFamily: 'monospace', fontSize: '0.78rem' }}>{log.ipAddress}</td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="sa-empty-row">No logs found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            <div className="sa-pagination" style={{ marginTop: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="sa-btn sa-btn-secondary"
                    style={{ opacity: page === 1 ? 0.45 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
                >
                    Previous
                </button>
                <span style={{ color: 'var(--sa-text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Page {page} of {totalPages}</span>
                <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="sa-btn sa-btn-secondary"
                    style={{ opacity: page === totalPages ? 0.45 : 1, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default AuditLogViewer;
