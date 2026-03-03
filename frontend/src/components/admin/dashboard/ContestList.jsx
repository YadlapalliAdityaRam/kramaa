import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaCalendarAlt, FaClock, FaCheck, FaTimes, FaUsers, FaUser, FaListOl } from 'react-icons/fa';

const ContestList = () => {
    const [contests, setContests] = useState([]);
    const [pendingContests, setPendingContests] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useSelector(state => state.auth);
    const normalizedRole = String(user?.role || '').toUpperCase();
    const isSuperAdmin = normalizedRole === 'SUPER_ADMIN';
    const isAdmin = normalizedRole === 'ADMIN';

    const fetchContests = async () => {
        try {
            const res = await api.get('/contests');
            setContests(res.data.contests || []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch contests");
        } finally {
            setLoading(false);
        }
    };

    const fetchPending = async () => {
        if (!isSuperAdmin) return;
        try {
            const res = await api.get('/contests/pending');
            setPendingContests(res.data.contests || []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchContests();
        fetchPending();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this contest?")) return;
        try {
            await api.delete(`/contests/${id}`);
            toast.success("Contest deleted");
            fetchContests();
            fetchPending();
        } catch (err) {
            toast.error("Failed to delete contest");
        }
    };

    const handleApprove = async (id) => {
        try {
            await api.put(`/contests/${id}/approve`, { action: 'approve' });
            toast.success("Contest approved! 🎉");
            fetchContests();
            fetchPending();
        } catch (err) {
            toast.error("Failed to approve contest");
        }
    };

    const handleReject = async (id) => {
        const note = prompt("Rejection reason (optional):");
        try {
            await api.put(`/contests/${id}/approve`, { action: 'reject', note: note || '' });
            toast.success("Contest rejected");
            fetchContests();
            fetchPending();
        } catch (err) {
            toast.error("Failed to reject contest");
        }
    };

    const getApprovalBadge = (status) => {
        const styles = {
            PENDING: { bg: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)', label: '⏳ Pending' },
            APPROVED: { bg: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', label: '✅ Approved' },
            REJECTED: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', label: '❌ Rejected' }
        };
        const s = styles[status] || styles.PENDING;
        return (
            <span style={{
                padding: '3px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '600',
                background: s.bg, color: s.color, border: s.border, whiteSpace: 'nowrap'
            }}>
                {s.label}
            </span>
        );
    };

    const getDuration = (contest) => {
        const start = new Date(contest.startTime);
        const end = new Date(contest.endTime);
        const mins = Math.round((end - start) / 60000);
        if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
        return `${mins} min`;
    };

    // Render a contest table
    const ContestTable = ({ title, contestList, showApproval = false }) => (
        contestList.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
                {title && (
                    <h3 style={{ color: '#e5e7eb', fontSize: '1rem', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {title}
                        <span style={{ fontSize: '0.75rem', background: 'rgba(59,130,246,0.15)', color: '#3b82f6', padding: '2px 8px', borderRadius: '8px' }}>
                            {contestList.length}
                        </span>
                    </h3>
                )}
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Start Time</th>
                                <th>Duration</th>
                                {(isSuperAdmin || showApproval) && <th>Creator</th>}
                                {(isSuperAdmin || showApproval) && <th>Questions</th>}
                                <th className="text-center">Participants</th>
                                <th className="text-center">Status</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contestList.map(contest => (
                                <tr key={contest._id}>
                                    <td className="font-semibold">{contest.title}</td>
                                    <td className="text-gray-400 text-sm">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <FaCalendarAlt style={{ color: '#3b82f6', fontSize: '0.75rem' }} />
                                            {new Date(contest.startTime).toLocaleString('en-US', {
                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </div>
                                    </td>
                                    <td className="text-gray-400 text-sm">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <FaClock style={{ color: '#14b8a6', fontSize: '0.75rem' }} />
                                            {getDuration(contest)}
                                        </div>
                                    </td>
                                    {(isSuperAdmin || showApproval) && (
                                        <td className="text-gray-400 text-sm">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <FaUser style={{ color: '#a855f7', fontSize: '0.7rem' }} />
                                                {contest.creatorName || contest.createdBy?.username || '?'}
                                            </div>
                                        </td>
                                    )}
                                    {(isSuperAdmin || showApproval) && (
                                        <td className="text-gray-400 text-sm">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <FaListOl style={{ color: '#fb923c', fontSize: '0.7rem' }} />
                                                {contest.problems?.length || '?'}
                                            </div>
                                        </td>
                                    )}
                                    <td className="text-gray-400 text-sm font-mono" style={{ textAlign: 'center' }}>
                                        {contest.participantCount !== undefined ? contest.participantCount : (contest.participants?.length || 0)}
                                    </td>
                                    <td className="text-center">
                                        {getApprovalBadge(contest.approvalStatus)}
                                    </td>
                                    <td className="text-right">
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', alignItems: 'center' }}>
                                            {/* Approve/Reject for super admin on pending */}
                                            {isSuperAdmin && contest.approvalStatus === 'PENDING' && (
                                                <>
                                                    <button
                                                        onClick={() => handleApprove(contest._id)}
                                                        style={{
                                                            background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
                                                            color: '#22c55e', borderRadius: '6px', padding: '4px 10px',
                                                            cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600',
                                                            display: 'flex', alignItems: 'center', gap: '4px'
                                                        }}
                                                        title="Approve"
                                                    >
                                                        <FaCheck /> Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(contest._id)}
                                                        style={{
                                                            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                                                            color: '#ef4444', borderRadius: '6px', padding: '4px 10px',
                                                            cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600',
                                                            display: 'flex', alignItems: 'center', gap: '4px'
                                                        }}
                                                        title="Reject"
                                                    >
                                                        <FaTimes /> Reject
                                                    </button>
                                                </>
                                            )}
                                            {isAdmin && (
                                                <Link
                                                    to={`/admin/edit-contest/${contest._id}`}
                                                    className="action-btn btn-icon text-blue-400 hover:bg-blue-500/10"
                                                    title="Edit Contest"
                                                >
                                                    <FaEdit />
                                                </Link>
                                            )}
                                            {isSuperAdmin && (
                                                <button
                                                    onClick={() => handleDelete(contest._id)}
                                                    className="action-btn btn-icon btn-delete hover:bg-red-500/10"
                                                    title="Delete Contest"
                                                >
                                                    <FaTrash />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    );

    return (
        <div className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>Contest Management</h2>
                {isAdmin && (
                    <Link to="/admin/create-contest" style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 16px', borderRadius: '8px',
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        color: 'white', textDecoration: 'none', fontWeight: '600', fontSize: '0.85rem'
                    }}>
                        <FaPlus /> Create Contest
                    </Link>
                )}
            </div>

            {loading ? (
                <div style={{ color: '#9ca3af', textAlign: 'center', padding: '32px' }}>Loading contests...</div>
            ) : (
                <>
                    {/* Pending contests section for super admin */}
                    {isSuperAdmin && pendingContests.length > 0 && (
                        <ContestTable
                            title="⏳ Pending Approval"
                            contestList={pendingContests}
                            showApproval={true}
                        />
                    )}

                    {/* All contests */}
                    <ContestTable
                        title={isSuperAdmin && pendingContests.length > 0 ? "All Contests" : null}
                        contestList={contests}
                        showApproval={isSuperAdmin}
                    />

                    {contests.length === 0 && pendingContests.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                            {isAdmin ? 'No contests found. Create one to engage users!' : 'No contests found.'}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ContestList;
