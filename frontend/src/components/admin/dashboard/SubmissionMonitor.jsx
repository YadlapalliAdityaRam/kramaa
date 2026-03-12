import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { FaEye, FaFilter, FaUserShield, FaCheck, FaTimes, FaClock } from 'react-icons/fa';

const SubmissionMonitor = () => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(() => (
        typeof window !== 'undefined' ? window.innerWidth <= 768 : false
    ));
    const [filters, setFilters] = useState({
        scope: 'all', // 'all' or 'my_problems'
        status: 'all' // 'all', 'accepted', 'failed'
    });

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            let query = '/submissions/all?limit=20';
            if (filters.scope === 'my_problems') query += '&scope=my_problems';

            // Map frontend status filter to backend values
            if (filters.status === 'accepted') query += '&status=accepted';
            if (filters.status === 'failed') query += '&status=wrong_answer'; // logical mapping, though simplistic

            const res = await api.get(query);
            setSubmissions(res.data.submissions);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
        const interval = setInterval(fetchSubmissions, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [filters]); // Re-fetch when filters change

    return (
        <div className="glass-panel">
            <div className="flex justify-between items-center mb-6" style={{ flexWrap: isMobile ? 'wrap' : 'nowrap', gap: isMobile ? '10px' : undefined }}>
                <h2 className="text-2xl font-bold text-white">Submission Monitor</h2>

                <div className="flex gap-3" style={{ width: isMobile ? '100%' : 'auto', flexDirection: isMobile ? 'column' : 'row' }}>
                    {/* Scope Filter */}
                    <button
                        onClick={() => setFilters(prev => ({ ...prev, scope: prev.scope === 'all' ? 'my_problems' : 'all' }))}
                        className={`control-btn flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-all ${filters.scope === 'my_problems'
                            ? 'bg-purple-900/50 border-purple-500 text-purple-300'
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                            }`}
                        style={{ justifyContent: 'center' }}
                    >
                        <FaUserShield /> {filters.scope === 'my_problems' ? 'My Problems Only' : 'All Problems'}
                    </button>

                    {/* Status Filter */}
                    <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700" style={{ width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-start' }}>
                        <button
                            onClick={() => setFilters(prev => ({ ...prev, status: 'all' }))}
                            className={`px-3 py-1 text-xs font-medium rounded ${filters.status === 'all' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
                            style={{ flex: isMobile ? 1 : undefined }}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilters(prev => ({ ...prev, status: 'accepted' }))}
                            className={`px-3 py-1 text-xs font-medium rounded flex items-center gap-1 ${filters.status === 'accepted' ? 'bg-green-900/50 text-green-400' : 'text-gray-400 hover:text-white'}`}
                            style={{ flex: isMobile ? 1 : undefined, justifyContent: 'center' }}
                        >
                            <FaCheck size={10} /> Success
                        </button>
                        <button
                            onClick={() => setFilters(prev => ({ ...prev, status: 'failed' }))}
                            className={`px-3 py-1 text-xs font-medium rounded flex items-center gap-1 ${filters.status === 'failed' ? 'bg-red-900/50 text-red-400' : 'text-gray-400 hover:text-white'}`}
                            style={{ flex: isMobile ? 1 : undefined, justifyContent: 'center' }}
                        >
                            <FaTimes size={10} /> Failed
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-gray-400 text-center py-8">Loading submissions...</div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Problem</th>
                                <th>Language</th>
                                <th>Status</th>
                                <th>Time / Mem</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {submissions.map(sub => (
                                <tr key={sub._id}>
                                    <td className="text-purple-300 font-semibold">
                                        {sub.user?.username || 'Unknown'}
                                    </td>
                                    <td className="font-semibold text-white">
                                        {sub.problem?.title || 'Unknown Problem'}
                                    </td>
                                    <td className="font-mono text-xs text-gray-400 uppercase">{sub.language}</td>
                                    <td>
                                        <span className={`status-badge ${sub.status === 'accepted' ? 'badge-green' :
                                            sub.status === 'pending' ? 'badge-yellow' :
                                                'badge-red'
                                            }`}>
                                            {sub.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="text-gray-400 text-xs font-mono">
                                        {sub.runtime ? `${sub.runtime.toFixed(0)}ms` : '-'} / {sub.memory ? `${sub.memory.toFixed(1)}MB` : '-'}
                                    </td>
                                    <td className="text-gray-500 text-xs">
                                        {new Date(sub.createdAt).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                            {submissions.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="text-center py-8 text-gray-500">
                                        No submissions found matching filters.
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

export default SubmissionMonitor;
