import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FaArrowLeft, FaClock, FaSync, FaTrophy, FaUsers } from 'react-icons/fa';
import api from '../../utils/api';

const PODIUM_STYLES = [
    { label: '1st', border: '#f59e0b', bg: 'rgba(245,158,11,0.14)' },
    { label: '2nd', border: '#9ca3af', bg: 'rgba(156,163,175,0.14)' },
    { label: '3rd', border: '#d97706', bg: 'rgba(217,119,6,0.14)' }
];

const formatDateTime = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString();
};

const ContestLeaderboard = () => {
    const { id } = useParams();
    const [contest, setContest] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [winners, setWinners] = useState([]);
    const [contestMeta, setContestMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const completedRef = useRef(false);

    const fetchLeaderboard = async (manual = false) => {
        if (manual) setRefreshing(true);

        try {
            if (!contest) {
                const contestRes = await api.get(`/contests/${id}`);
                setContest(contestRes.data.contest || null);
            }

            const res = await api.get(`/contests/${id}/leaderboard`);
            setLeaderboard(res.data.leaderboard || []);
            setWinners(res.data.winners || []);
            setContestMeta(res.data.contestMeta || null);
            setLastUpdated(new Date());
        } catch (error) {
            if (manual) {
                toast.error(error?.response?.data?.message || 'Failed to refresh leaderboard');
            }
        } finally {
            setLoading(false);
            if (manual) setRefreshing(false);
        }
    };

    // Smart polling: only refresh while contest is live, stop once completed
    useEffect(() => {
        fetchLeaderboard(false);
        const interval = setInterval(() => {
            if (!completedRef.current) {
                fetchLeaderboard(false);
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [id]);

    const isCompleted = useMemo(() => {
        if (typeof contestMeta?.isCompleted === 'boolean') return contestMeta.isCompleted;
        const endTime = contest?.endTime ? new Date(contest.endTime) : null;
        if (!endTime) return false;
        return Date.now() > endTime.getTime();
    }, [contest?.endTime, contestMeta?.isCompleted]);

    // Keep ref in sync for the interval callback
    useEffect(() => {
        completedRef.current = isCompleted;
    }, [isCompleted]);

    if (loading) {
        return <div className="text-white text-center p-20">Loading leaderboard...</div>;
    }

    return (
        <div className="min-h-screen bg-[#0f0f0f] text-white p-6 md:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 bg-[#1b1b1b] p-5 rounded-xl border border-[#333]">
                    <div className="flex items-center gap-3">
                        <Link to={`/contest/${id}`} className="p-2 rounded bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors">
                            <FaArrowLeft />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <FaTrophy className="text-yellow-500" /> Contest Leaderboard
                            </h1>
                            <p className="text-gray-400 text-sm mt-1">{contest?.title || contestMeta?.title}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><FaClock /> {formatDateTime(lastUpdated)}</span>
                        <button
                            type="button"
                            onClick={() => fetchLeaderboard(true)}
                            className={`p-2 rounded bg-blue-600 hover:bg-blue-700 transition-colors ${refreshing ? 'animate-spin' : ''}`}
                            title="Refresh"
                        >
                            <FaSync size={13} />
                        </button>
                    </div>
                </div>

                {isCompleted && winners.length > 0 && (
                    <div className="bg-[#1b1b1b] border border-[#333] rounded-xl p-5 mb-6">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><FaTrophy className="text-yellow-400" /> Winners</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {winners.map((winner, idx) => (
                                <div
                                    key={winner.userId || winner.username}
                                    className="rounded-xl border p-4"
                                    style={{ borderColor: PODIUM_STYLES[idx]?.border, background: PODIUM_STYLES[idx]?.bg }}
                                >
                                    <p className="text-xs font-semibold" style={{ color: PODIUM_STYLES[idx]?.border }}>
                                        {PODIUM_STYLES[idx]?.label}
                                    </p>
                                    <p className="text-lg font-bold mt-1">{winner.username}</p>
                                    <p className="text-sm text-gray-300 mt-1">Score: {winner.score}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-[#1b1b1b] border border-[#333] rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-[#333] text-sm text-gray-400 flex items-center gap-2">
                        <FaUsers /> Participants: {contestMeta?.participantCount ?? leaderboard.length}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#242424] text-gray-400 text-xs uppercase">
                                <tr>
                                    <th className="px-5 py-4 text-left">Rank</th>
                                    <th className="px-5 py-4 text-left">User</th>
                                    <th className="px-5 py-4 text-center">Rating</th>
                                    <th className="px-5 py-4 text-center">Score</th>
                                    <th className="px-5 py-4 text-center">Solved</th>
                                    <th className="px-5 py-4 text-center">Registered</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#333]">
                                {leaderboard.map((entry) => (
                                    <tr key={entry.userId || entry.username} className="hover:bg-[#252525] transition-colors">
                                        <td className="px-5 py-4 font-semibold">#{entry.rank}</td>
                                        <td className="px-5 py-4">
                                            <Link to={`/profile/${entry.username}`} className="hover:text-teal-400 transition-colors">
                                                {entry.username}
                                            </Link>
                                        </td>
                                        <td className="px-5 py-4 text-center">{entry.rating || 1200}</td>
                                        <td className="px-5 py-4 text-center text-green-400 font-semibold">{entry.score}</td>
                                        <td className="px-5 py-4 text-center">{entry.solvedCount || 0}</td>
                                        <td className="px-5 py-4 text-center text-gray-400 text-xs">{formatDateTime(entry.registrationTime)}</td>
                                    </tr>
                                ))}
                                {leaderboard.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-10 text-gray-500">No participants yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContestLeaderboard;