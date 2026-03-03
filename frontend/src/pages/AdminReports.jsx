import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBan, FaCheckCircle, FaEye, FaFilter, FaFlag, FaSearch, FaSpinner, FaTimes, FaTrashAlt, FaUserShield } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import api from '../utils/api';

const normalizeStatus = (status) => {
    const value = String(status || '').trim().toLowerCase();
    if (!value) return 'pending';
    if (value === 'action_taken') return 'resolved';
    return value;
};

const formatStatus = (status) => normalizeStatus(status).replace('_', ' ');

const AdminReports = () => {
    const { user } = useSelector((state) => state.auth);
    const role = String(user?.role || '').toUpperCase();
    const isSuperAdmin = role === 'SUPER_ADMIN';

    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [typeFilter, setTypeFilter] = useState('All');
    const [selectedReport, setSelectedReport] = useState(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [viewportWidth, setViewportWidth] = useState(() => (
        typeof window !== 'undefined' ? window.innerWidth : 1400
    ));

    useEffect(() => {
        fetchReports();
    }, [page, statusFilter, typeFilter]);

    useEffect(() => {
        const onResize = () => setViewportWidth(window.innerWidth);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/reports/admin?page=${page}&limit=12&status=${statusFilter}&type=${typeFilter}`);
            setReports(response.data.reports || []);
            setTotalPages(response.data.pagination?.pages || 1);
        } catch (error) {
            toast.error('Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (actionType, nextStatus, confirmMessage = '') => {
        if (!selectedReport) return;
        if (confirmMessage && !window.confirm(confirmMessage)) return;

        setActionLoading(true);
        try {
            await api.put(`/reports/admin/${selectedReport._id}`, {
                status: nextStatus,
                action: actionType,
                adminNotes
            });
            toast.success('Report updated successfully');
            setSelectedReport(null);
            setAdminNotes('');
            fetchReports();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update report');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (normalizeStatus(status)) {
            case 'pending': return '#f59e0b';
            case 'reviewed': return '#3b82f6';
            case 'resolved': return '#10b981';
            case 'rejected': return '#6b7280';
            default: return '#9ca3af';
        }
    };

    const selectedStatus = useMemo(() => normalizeStatus(selectedReport?.status), [selectedReport?.status]);
    const isMobile = viewportWidth <= 768;
    const isTablet = viewportWidth > 768 && viewportWidth <= 1100;
    const reportGridColumns = isMobile
        ? '1fr'
        : (isTablet ? 'repeat(2, minmax(0, 1fr))' : 'repeat(auto-fill, minmax(350px, 1fr))');
    const canMarkReviewed = isSuperAdmin
        ? ['pending', 'resolved', 'rejected'].includes(selectedStatus)
        : selectedStatus === 'pending';
    const canResolveOrReject = isSuperAdmin
        ? ['pending', 'reviewed', 'resolved', 'rejected'].includes(selectedStatus)
        : selectedStatus === 'reviewed';
    const isClosedReport = !isSuperAdmin && (selectedStatus === 'resolved' || selectedStatus === 'rejected');
    const selectOptionStyle = {
        color: 'var(--admin-reports-select-option-text)',
        backgroundColor: 'var(--admin-reports-select-option-bg)'
    };

    return (
        <div className="p-4" style={{ backgroundColor: 'var(--admin-reports-page-bg)', minHeight: '80vh', borderRadius: '16px', padding: isMobile ? '12px' : undefined }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '16px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--admin-reports-title)', margin: 0 }}>Moderation Reports</h2>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--admin-reports-filter-bg)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--admin-reports-filter-border)', width: isMobile ? '100%' : 'auto' }}>
                        <FaFilter style={{ color: 'var(--admin-reports-muted)', marginRight: '8px' }} />
                        <select
                            value={statusFilter}
                            onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}
                            style={{ background: 'var(--admin-reports-select-bg)', border: 'none', color: 'var(--admin-reports-select-text)', outline: 'none', fontSize: '0.9rem', cursor: 'pointer', width: isMobile ? '100%' : 'auto' }}
                        >
                            <option style={selectOptionStyle} value="All">All Statuses</option>
                            <option style={selectOptionStyle} value="pending">Pending</option>
                            <option style={selectOptionStyle} value="reviewed">Reviewed</option>
                            <option style={selectOptionStyle} value="resolved">Resolved</option>
                            <option style={selectOptionStyle} value="rejected">Rejected</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--admin-reports-filter-bg)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--admin-reports-filter-border)', width: isMobile ? '100%' : 'auto' }}>
                        <select
                            value={typeFilter}
                            onChange={(event) => { setTypeFilter(event.target.value); setPage(1); }}
                            style={{ background: 'var(--admin-reports-select-bg)', border: 'none', color: 'var(--admin-reports-select-text)', outline: 'none', fontSize: '0.9rem', cursor: 'pointer', width: isMobile ? '100%' : 'auto' }}
                        >
                            <option style={selectOptionStyle} value="All">All Entities</option>
                            <option style={selectOptionStyle} value="Doubt">Doubt/Comment</option>
                            <option style={selectOptionStyle} value="Profile">User Profile</option>
                            <option style={selectOptionStyle} value="Solution">Solution</option>
                            <option style={selectOptionStyle} value="Submission">Submission</option>
                        </select>
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '18px', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--admin-reports-border)', background: 'var(--admin-reports-note-bg)', color: 'var(--admin-reports-muted)', fontSize: '0.83rem', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--admin-reports-text)' }}>Admin moderation permissions:</strong> review reports, mark safe, reject, remove content, warn user, temporarily suspend user.
                {isSuperAdmin && (
                    <span style={{ display: 'block', marginTop: '4px', color: '#93c5fd' }}>
                        Super Admin override is enabled: you can directly resolve/reject from any report state.
                    </span>
                )}
                {!isSuperAdmin && (
                    <span style={{ display: 'block', marginTop: '4px', color: '#fca5a5' }}>
                        Permanent ban and delete-user actions are disabled for Admin role.
                    </span>
                )}
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                    <FaSpinner className="spin" style={{ fontSize: '40px', color: '#8b5cf6' }} />
                </div>
            ) : reports.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--admin-reports-muted)', background: 'var(--admin-reports-filter-bg)', borderRadius: '12px', border: '1px solid var(--admin-reports-border)' }}>
                    <FaCheckCircle style={{ fontSize: '48px', color: '#10b981', marginBottom: '16px', opacity: 0.8 }} />
                    <p style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--admin-reports-text)' }}>All Caught Up!</p>
                    <p style={{ marginTop: '8px' }}>No reports found matching these filters.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: reportGridColumns, gap: '20px' }}>
                    {reports.map((report) => (
                        <motion.div
                            key={report._id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                            style={{
                                background: 'var(--admin-reports-filter-bg)',
                                border: '1px solid var(--admin-reports-border)',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            <div style={{ padding: '16px', borderBottom: '1px solid var(--admin-reports-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--admin-reports-header-bg)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem', fontWeight: 600, color: 'var(--admin-reports-text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    <FaFlag style={{ color: '#ec4899', marginRight: '6px' }} />
                                    {report.contentType}
                                </div>
                                <span style={{
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    background: `${getStatusColor(report.status)}20`,
                                    color: getStatusColor(report.status),
                                    textTransform: 'uppercase'
                                }}>
                                    {formatStatus(report.status)}
                                </span>
                            </div>

                            <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--admin-reports-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Reason</span>
                                    <h3 style={{ margin: '4px 0 0 0', color: '#ef4444', fontSize: '1.1rem', fontWeight: 700 }}>{report.reason}</h3>
                                </div>

                                {report.description && (
                                    <div style={{ background: 'var(--admin-reports-subtle-bg)', padding: '10px', borderRadius: '8px', border: '1px solid var(--admin-reports-border)' }}>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--admin-reports-text)', fontStyle: 'italic', lineHeight: 1.5 }}>
                                            "{report.description.length > 100 ? `${report.description.substring(0, 100)}...` : report.description}"
                                        </p>
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--admin-reports-muted)', marginTop: 'auto', paddingTop: '12px', borderTop: '1px dashed var(--admin-reports-divider)' }}>
                                    <span>By: {report.reporterId?.username || 'Unknown'}</span>
                                    <span>Date: {new Date(report.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedReport(report)}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    background: 'var(--admin-reports-review-bg)',
                                    color: 'var(--admin-reports-review-text)',
                                    border: 'none',
                                    borderTop: '1px solid var(--admin-reports-review-border)',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                Review Report <FaSearch />
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}

            {!loading && totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '30px', gap: '12px' }}>
                    <button
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        disabled={page === 1}
                        style={{ padding: '8px 16px', background: 'var(--admin-reports-pagination-bg)', color: 'var(--admin-reports-pagination-text)', border: 'none', borderRadius: '8px', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
                    >
                        Prev
                    </button>
                    <span style={{ color: 'var(--admin-reports-muted)' }}>Page {page} of {totalPages}</span>
                    <button
                        onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={page === totalPages}
                        style={{ padding: '8px 16px', background: 'var(--admin-reports-pagination-bg)', color: 'var(--admin-reports-pagination-text)', border: 'none', borderRadius: '8px', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}
                    >
                        Next
                    </button>
                </div>
            )}

            <AnimatePresence>
                {selectedReport && (
                    <div
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--admin-reports-overlay-bg)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
                        onClick={() => !actionLoading && setSelectedReport(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(event) => event.stopPropagation()}
                            style={{ background: 'var(--admin-reports-filter-bg)', borderRadius: '20px', width: isMobile ? '96%' : '90%', maxWidth: '720px', maxHeight: isMobile ? '90vh' : 'none', border: '1px solid var(--admin-reports-border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                        >
                            <div style={{ padding: '24px', borderBottom: '1px solid var(--admin-reports-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--admin-reports-title)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    Reviewing Report
                                </h3>
                                <button onClick={() => !actionLoading && setSelectedReport(null)} style={{ background: 'none', border: 'none', color: 'var(--admin-reports-muted)', cursor: 'pointer', padding: '4px' }}>
                                    <FaTimes size={20} />
                                </button>
                            </div>

                            <div style={{ padding: isMobile ? '16px' : '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : (isTablet ? 'repeat(2, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))'), gap: '16px' }}>
                                    <div style={{ background: 'var(--admin-reports-subtle-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--admin-reports-border)' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--admin-reports-muted)', display: 'block', marginBottom: '4px' }}>Reporter</span>
                                        <div style={{ fontWeight: 600, color: 'var(--admin-reports-text)' }}>{selectedReport.reporterId?.username || 'Unknown'}</div>
                                    </div>
                                    <div style={{ background: 'var(--admin-reports-subtle-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--admin-reports-border)' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--admin-reports-muted)', display: 'block', marginBottom: '4px' }}>Reported User</span>
                                        <div style={{ fontWeight: 600, color: '#fca5a5' }}>{selectedReport.reportedUserId?.username || 'N/A'}</div>
                                    </div>
                                    <div style={{ background: 'var(--admin-reports-subtle-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--admin-reports-border)' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--admin-reports-muted)', display: 'block', marginBottom: '4px' }}>Status</span>
                                        <div style={{ fontWeight: 700, color: getStatusColor(selectedReport.status), textTransform: 'capitalize' }}>{formatStatus(selectedReport.status)}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
                                    <div style={{ background: 'var(--admin-reports-subtle-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--admin-reports-border)' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--admin-reports-muted)', display: 'block', marginBottom: '4px' }}>Content Type</span>
                                        <div style={{ fontWeight: 600, color: 'var(--admin-reports-text)' }}>{selectedReport.contentType}</div>
                                    </div>
                                    <div style={{ background: 'var(--admin-reports-subtle-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--admin-reports-border)' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--admin-reports-muted)', display: 'block', marginBottom: '4px' }}>Reason</span>
                                        <div style={{ fontWeight: 600, color: '#ef4444' }}>{selectedReport.reason}</div>
                                    </div>
                                </div>

                                {selectedReport.description && (
                                    <div>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--admin-reports-muted)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>User Description</span>
                                        <div style={{ background: 'var(--admin-reports-subtle-bg)', padding: '16px', borderRadius: '12px', color: 'var(--admin-reports-text)', lineHeight: 1.6, border: '1px solid var(--admin-reports-border)' }}>
                                            {selectedReport.description}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--admin-reports-muted)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Admin Notes (Optional)</span>
                                    <textarea
                                        value={adminNotes}
                                        onChange={(event) => setAdminNotes(event.target.value)}
                                        placeholder="Internal notes about this decision..."
                                        style={{ width: '100%', background: 'var(--admin-reports-subtle-bg)', border: '1px solid var(--admin-reports-filter-border)', padding: '12px', borderRadius: '8px', color: 'var(--admin-reports-title)', minHeight: '80px', outline: 'none', resize: 'vertical' }}
                                    />
                                </div>
                            </div>

                            <div style={{ padding: isMobile ? '16px' : '24px', background: 'var(--admin-reports-footer-bg)', borderTop: '1px solid var(--admin-reports-border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {isClosedReport && (
                                    <div style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.25)', background: 'rgba(16,185,129,0.08)', color: '#86efac', fontSize: '0.82rem' }}>
                                        This report is already closed. No additional action is allowed.
                                    </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                                    <button
                                        onClick={() => handleAction('review', 'reviewed')}
                                        disabled={actionLoading || !canMarkReviewed}
                                        style={{ padding: '14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: (actionLoading || !canMarkReviewed) ? 'not-allowed' : 'pointer', opacity: (!canMarkReviewed || actionLoading) ? 0.6 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                                    >
                                        <FaEye /> Mark Reviewed
                                    </button>
                                    <button
                                        onClick={() => handleAction('dismiss', 'rejected')}
                                        disabled={actionLoading || !canResolveOrReject}
                                        style={{ padding: '14px', background: 'var(--admin-reports-secondary-btn-bg)', color: 'var(--admin-reports-secondary-btn-text)', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: (actionLoading || !canResolveOrReject) ? 'not-allowed' : 'pointer', opacity: (!canResolveOrReject || actionLoading) ? 0.6 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                                    >
                                        <FaCheckCircle /> Reject
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                                    <button
                                        onClick={() => handleAction('mark_safe', 'resolved')}
                                        disabled={actionLoading || !canResolveOrReject}
                                        style={{ padding: '14px', background: '#10b981', color: '#052e16', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: (actionLoading || !canResolveOrReject) ? 'not-allowed' : 'pointer', opacity: (!canResolveOrReject || actionLoading) ? 0.6 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                                    >
                                        <FaCheckCircle /> Mark Safe
                                    </button>
                                    <button
                                        onClick={() => handleAction('warn', 'resolved')}
                                        disabled={actionLoading || !canResolveOrReject || !selectedReport.reportedUserId}
                                        style={{ padding: '14px', background: '#f59e0b', color: '#422006', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: (actionLoading || !canResolveOrReject || !selectedReport.reportedUserId) ? 'not-allowed' : 'pointer', opacity: (!canResolveOrReject || !selectedReport.reportedUserId || actionLoading) ? 0.6 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                                    >
                                        <FaFlag /> Warn User
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                                    <button
                                        onClick={() => handleAction('remove_content', 'resolved')}
                                        disabled={actionLoading || !canResolveOrReject}
                                        style={{ padding: '14px', background: '#eab308', color: '#422006', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: (actionLoading || !canResolveOrReject) ? 'not-allowed' : 'pointer', opacity: (!canResolveOrReject || actionLoading) ? 0.6 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                                    >
                                        <FaTrashAlt /> {isSuperAdmin ? 'Delete Content (Global)' : 'Remove Content'}
                                    </button>
                                    <button
                                        onClick={() => handleAction('temp_suspend', 'resolved')}
                                        disabled={actionLoading || !canResolveOrReject || !selectedReport.reportedUserId}
                                        style={{ padding: '14px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: (actionLoading || !canResolveOrReject || !selectedReport.reportedUserId) ? 'not-allowed' : 'pointer', opacity: (!canResolveOrReject || !selectedReport.reportedUserId || actionLoading) ? 0.6 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                                    >
                                        <FaUserShield /> Temporarily Suspend
                                    </button>
                                </div>

                                {isSuperAdmin && (
                                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: '12px', borderTop: '1px solid var(--admin-reports-border)', paddingTop: '12px' }}>
                                        <button
                                            onClick={() => handleAction('permanent_ban', 'resolved', 'Permanently ban this user?')}
                                            disabled={actionLoading || !canResolveOrReject || !selectedReport.reportedUserId}
                                            style={{ padding: '14px', background: '#7f1d1d', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: (actionLoading || !canResolveOrReject || !selectedReport.reportedUserId) ? 'not-allowed' : 'pointer', opacity: (!canResolveOrReject || !selectedReport.reportedUserId || actionLoading) ? 0.6 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                                        >
                                            <FaBan /> Permanent Ban
                                        </button>
                                        <button
                                            onClick={() => handleAction('delete_user', 'resolved', 'Permanently delete this user account? This cannot be undone.')}
                                            disabled={actionLoading || !canResolveOrReject || !selectedReport.reportedUserId}
                                            style={{ padding: '14px', background: '#991b1b', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: (actionLoading || !canResolveOrReject || !selectedReport.reportedUserId) ? 'not-allowed' : 'pointer', opacity: (!canResolveOrReject || !selectedReport.reportedUserId || actionLoading) ? 0.6 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                                        >
                                            <FaTrashAlt /> Delete User
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminReports;
