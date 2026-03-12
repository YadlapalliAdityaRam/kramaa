import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
import {
    FaArrowLeft,
    FaCheckCircle,
    FaClock,
    FaExclamationTriangle,
    FaList,
    FaPlay,
    FaTrophy,
    FaUsers,
    FaChartBar
} from 'react-icons/fa';
import api, { getCurrentSocketBaseUrl, getSocketClientOptions } from '../utils/api';

const getContestStatus = (contest) => {
    if (!contest) return 'LOADING';
    const now = new Date();
    const start = new Date(contest.startTime);
    const end = new Date(contest.endTime);

    if (now < start) return 'UPCOMING';
    if (now >= start && now <= end) return 'ONGOING';
    return 'ENDED';
};

const formatCountdown = (ms) => {
    if (!Number.isFinite(ms) || ms <= 0) return '00:00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const formatDateTime = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString();
};

const MEDAL_STYLES = [
    { label: '1st', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    { label: '2nd', color: '#9ca3af', bg: 'rgba(156,163,175,0.16)' },
    { label: '3rd', color: '#d97706', bg: 'rgba(217,119,6,0.16)' }
];

const TAB_ITEMS = [
    { id: 'overview', label: 'Overview' },
    { id: 'problems', label: 'Problems' },
    { id: 'submissions', label: 'Submissions' },
    { id: 'participants', label: 'Participants' },
    { id: 'leaderboard', label: 'Leaderboard' }
];

const ContestParticipation = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useSelector((state) => state.auth);

    const [contest, setContest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('LOADING');
    const [timeLeft, setTimeLeft] = useState(0);

    const [activeTab, setActiveTab] = useState('overview');
    const [leaderboard, setLeaderboard] = useState([]);
    const [winners, setWinners] = useState([]);
    const [leaderboardLoading, setLeaderboardLoading] = useState(false);
    const [lastLeaderboardSync, setLastLeaderboardSync] = useState(null);
    const [participation, setParticipation] = useState(null);
    const [actionBusy, setActionBusy] = useState(false);

    useEffect(() => {
        let mounted = true;

        const fetchContest = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/contests/${id}`);
                if (!mounted) return;
                const contestData = res.data.contest;
                setContest(contestData);
                setStatus(getContestStatus(contestData));
                setParticipation(res.data?.participation || null);
            } catch (error) {
                if (mounted) {
                    toast.error(error?.response?.data?.message || 'Failed to load contest');
                    setContest(null);
                    setParticipation(null);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchContest();
        return () => { mounted = false; };
    }, [id]);

    useEffect(() => {
        if (!contest) return undefined;

        const timer = setInterval(() => {
            const nextStatus = getContestStatus(contest);
            setStatus(nextStatus);

            const now = new Date();
            const start = new Date(contest.startTime);
            const end = new Date(contest.endTime);

            if (nextStatus === 'UPCOMING') {
                setTimeLeft(start.getTime() - now.getTime());
            } else if (nextStatus === 'ONGOING') {
                setTimeLeft(end.getTime() - now.getTime());
            } else {
                setTimeLeft(0);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [contest]);

    useEffect(() => {
        if (activeTab !== 'leaderboard') return undefined;

        let mounted = true;

        const fetchLeaderboard = async (silent = false) => {
            if (!silent) setLeaderboardLoading(true);
            try {
                const res = await api.get(`/contests/${id}/leaderboard`);
                if (!mounted) return;
                setLeaderboard(res.data.leaderboard || []);
                setWinners(res.data.winners || []);
                setLastLeaderboardSync(new Date());
            } catch (error) {
                if (!silent && mounted) {
                    toast.error(error?.response?.data?.message || 'Failed to load leaderboard');
                }
            } finally {
                if (!silent && mounted) setLeaderboardLoading(false);
            }
        };

        fetchLeaderboard(false);
        const poll = setInterval(() => {
            fetchLeaderboard(true);
        }, 30000);

        return () => {
            mounted = false;
            clearInterval(poll);
        };
    }, [activeTab, id]);

    useEffect(() => {
        if (!id) return undefined;

        const socket = io(getCurrentSocketBaseUrl(), getSocketClientOptions({
            reconnectionAttempts: 20
        }));

        const onConnect = () => {
            socket.emit('contest:join', id);
        };

        const onLeaderboardUpdate = (payload = {}) => {
            if (String(payload?.contestId || '') !== String(id)) return;
            setLeaderboard(Array.isArray(payload?.leaderboard) ? payload.leaderboard : []);
            setLastLeaderboardSync(payload?.updatedAt ? new Date(payload.updatedAt) : new Date());
        };

        socket.on('connect', onConnect);
        socket.on('contest:leaderboard:update', onLeaderboardUpdate);

        return () => {
            socket.emit('contest:leave', id);
            socket.off('connect', onConnect);
            socket.off('contest:leaderboard:update', onLeaderboardUpdate);
            socket.disconnect();
        };
    }, [id]);

    const durationMinutes = useMemo(() => {
        if (!contest) return 0;
        const start = new Date(contest.startTime);
        const end = new Date(contest.endTime);
        return Math.max(0, Math.floor((end - start) / 60000));
    }, [contest]);

    const participantRows = useMemo(() => {
        const rows = Array.isArray(contest?.participants) ? [...contest.participants] : [];
        return rows
            .filter((row) => row && row.userId)
            .sort((a, b) => {
                const aTime = a.registrationTime ? new Date(a.registrationTime).getTime() : Number.MAX_SAFE_INTEGER;
                const bTime = b.registrationTime ? new Date(b.registrationTime).getTime() : Number.MAX_SAFE_INTEGER;
                return aTime - bTime;
            });
    }, [contest?.participants]);

    const isRegistered = useMemo(() => {
        if (!user?._id && !user?.id) return false;
        const currentUserId = String(user?._id || user?.id);
        return participantRows.some((row) => String(row.userId) === currentUserId);
    }, [participantRows, user?._id, user?.id]);

    const canOpenProblems = Array.isArray(contest?.problems) && contest.problems.length > 0;
    const exitSummary = location?.state?.contestExitSummary || null;
    const isContestLockedForUser = ['finished', 'exited'].includes(String(participation?.status || '').toLowerCase());

    const handleEnterContest = () => {
        if (isContestLockedForUser) {
            toast.error(
                String(participation?.status || '').toLowerCase() === 'finished'
                    ? 'You already submitted this contest. Further submissions are locked.'
                    : 'You already exited this contest. Rejoin (if allowed) to continue.'
            );
            return;
        }

        if (status === 'UPCOMING') {
            toast.success('Registration is active. Contest has not started yet.');
            return;
        }

        if (status === 'ENDED') {
            toast.error('Contest already ended.');
            return;
        }

        if (!canOpenProblems) {
            toast.error('No problems available for this contest yet.');
            return;
        }

        const firstProblem = contest.problems[0];
        const problemId = firstProblem?.id || firstProblem?._id || (typeof firstProblem === 'string' ? firstProblem : null);

        if (!problemId) {
            toast.error('Problem data is unavailable.');
            return;
        }

        navigate(`/contest/${id}/problem/${problemId}`);
    };

    const handleSubmitContest = async () => {
        if (!isRegistered) {
            toast.error('You are not registered for this contest.');
            return;
        }

        if (isContestLockedForUser) {
            toast('Contest already submitted or exited.');
            return;
        }

        const confirmed = window.confirm('Submit full contest now? You will not be able to make more contest submissions.');
        if (!confirmed) return;

        setActionBusy(true);
        try {
            const { data } = await api.post(`/contests/${id}/submit`, { reason: 'manual_submit' });
            setParticipation(data?.progress || null);
            toast.success(data?.message || 'Contest submitted successfully.');
            setActiveTab('overview');
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to submit contest.');
        } finally {
            setActionBusy(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center text-gray-300">
                Loading contest...
            </div>
        );
    }

    if (!contest) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-white text-2xl font-semibold mb-3">Contest Not Found</p>
                    <Link to="/contests" className="text-teal-400 hover:text-teal-300">Back to Contests</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white py-8 px-4">
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-6"
                >
                    <button
                        onClick={() => navigate('/contests')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <FaArrowLeft /> Back to Contests
                    </button>
                </motion.div>

                {exitSummary && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 rounded-2xl border border-blue-500/40 bg-blue-500/10 p-5"
                    >
                        <h3 className="text-lg font-bold text-blue-300 mb-2">Contest Progress Saved</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                                <div className="text-gray-400">Problems Solved</div>
                                <div className="text-white font-semibold">{Number(exitSummary?.problemsSolved || 0)}</div>
                            </div>
                            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                                <div className="text-gray-400">Score</div>
                                <div className="text-white font-semibold">{Number(exitSummary?.score || 0)}</div>
                            </div>
                            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                                <div className="text-gray-400">Submissions</div>
                                <div className="text-white font-semibold">{Number(exitSummary?.submissionCount || 0)}</div>
                            </div>
                        </div>
                    </motion.div>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-white/10 mb-6"
                >
                    <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold mb-4 ${
                        status === 'ONGOING'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                            : status === 'UPCOMING'
                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                                : 'bg-red-500/20 text-red-400 border border-red-500/40'
                    }`}>
                        {status}
                    </span>

                    <h1 className="text-4xl font-bold mb-3">{contest.title}</h1>
                    <p className="text-gray-400 mb-8">
                        {contest.description || 'Join the contest and solve problems to climb the leaderboard.'}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                        <div className="bg-black/30 p-5 rounded-xl border border-white/10">
                            <p className="text-xs text-gray-500 uppercase mb-2 flex items-center gap-2"><FaClock /> Duration</p>
                            <p className="text-2xl font-bold">{durationMinutes} min</p>
                        </div>
                        <div className="bg-black/30 p-5 rounded-xl border border-white/10">
                            <p className="text-xs text-gray-500 uppercase mb-2 flex items-center gap-2"><FaList /> Problems</p>
                            <p className="text-2xl font-bold">{contest.problems?.length || 0}</p>
                        </div>
                        <div className="bg-black/30 p-5 rounded-xl border border-white/10">
                            <p className="text-xs text-gray-500 uppercase mb-2 flex items-center gap-2"><FaUsers /> Participants</p>
                            <p className="text-2xl font-bold">{contest.participantCount || participantRows.length || 0}</p>
                        </div>
                        <div className="bg-black/30 p-5 rounded-xl border border-white/10">
                            <p className="text-xs text-gray-500 uppercase mb-2">
                                {status === 'UPCOMING' ? 'Starts In' : status === 'ONGOING' ? 'Ends In' : 'Ended'}
                            </p>
                            <p className="text-2xl font-bold font-mono">{formatCountdown(timeLeft)}</p>
                        </div>
                    </div>
                </motion.div>

                <div className="bg-[#161616] border border-white/10 rounded-2xl p-2 mb-6">
                    <div className="flex flex-wrap gap-2">
                        {TAB_ITEMS.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                                    activeTab === tab.id
                                        ? 'bg-teal-500 text-black'
                                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {activeTab === 'overview' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#171717] rounded-2xl p-6 border border-white/10">
                                <h2 className="text-2xl font-bold mb-5 flex items-center gap-3"><FaList className="text-blue-400" /> Overview</h2>
                                <ul className="space-y-3 text-gray-300">
                                    <li className="p-3 rounded-lg bg-black/20 border border-white/5">Plagiarism is strictly prohibited.</li>
                                    <li className="p-3 rounded-lg bg-black/20 border border-white/5">Leaderboard rank is based on score and tie-breaker rules.</li>
                                    <li className="p-3 rounded-lg bg-black/20 border border-white/5">Use stable internet and save work often during contest.</li>
                                </ul>
                                <div className="mt-5 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-300">
                                    <p className="flex items-center gap-2 font-semibold"><FaExclamationTriangle /> Important</p>
                                    <p className="mt-2 text-sm">Contest submissions are available from problem workspace pages.</p>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'problems' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#171717] rounded-2xl p-6 border border-white/10">
                                <h2 className="text-2xl font-bold mb-5 flex items-center gap-3"><FaList className="text-teal-400" /> Problems</h2>
                                {!canOpenProblems && (
                                    <p className="text-gray-400">Problems are hidden until allowed by contest rules.</p>
                                )}
                                {canOpenProblems && (
                                    <div className="space-y-3">
                                        {contest.problems.map((item, index) => {
                                            const problemId = item?.id || item?._id || (typeof item === 'string' ? item : null);
                                            const title = item?.title || `Problem ${index + 1}`;
                                            const difficulty = item?.difficulty || 'Unknown';

                                            return (
                                                <Link
                                                    key={problemId || `${title}-${index}`}
                                                    to={problemId ? `/contest/${id}/problem/${problemId}` : '#'}
                                                    className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-black/20 hover:border-teal-500/50 transition-colors"
                                                >
                                                    <div>
                                                        <p className="font-semibold text-white">{index + 1}. {title}</p>
                                                        <p className="text-xs text-gray-400 mt-1">{difficulty} · {Number(item.baseScore ?? item.points ?? 0)} points</p>
                                                    </div>
                                                    <FaPlay className="text-teal-400" />
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'submissions' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#171717] rounded-2xl p-6 border border-white/10">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-3"><FaChartBar className="text-purple-400" /> Submissions</h2>
                                <p className="text-gray-300">
                                    Contest submissions are tracked inside each problem workspace. Open a contest problem and submit to view verdict history.
                                </p>
                            </motion.div>
                        )}

                        {activeTab === 'participants' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#171717] rounded-2xl p-6 border border-white/10">
                                <h2 className="text-2xl font-bold mb-5 flex items-center gap-3"><FaUsers className="text-purple-400" /> Participants</h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-gray-400 border-b border-white/10">
                                                <th className="py-2 pr-4">#</th>
                                                <th className="py-2 pr-4">Username</th>
                                                <th className="py-2 pr-4">Rating</th>
                                                <th className="py-2 pr-4">Country</th>
                                                <th className="py-2">Registered At</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {participantRows.map((row, index) => (
                                                <tr key={row.userId || `${row.username}-${index}`} className="border-b border-white/5">
                                                    <td className="py-3 pr-4 text-gray-400">{index + 1}</td>
                                                    <td className="py-3 pr-4">
                                                        <Link to={`/profile/${row.username}`} className="text-white hover:text-teal-400">
                                                            {row.username}
                                                        </Link>
                                                    </td>
                                                    <td className="py-3 pr-4 text-gray-300">{row.rating || 1200}</td>
                                                    <td className="py-3 pr-4 text-gray-300">{row.country || '-'}</td>
                                                    <td className="py-3 text-gray-400">{formatDateTime(row.registrationTime)}</td>
                                                </tr>
                                            ))}
                                            {participantRows.length === 0 && (
                                                <tr>
                                                    <td className="py-6 text-gray-500" colSpan={5}>No participants yet.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'leaderboard' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                <div className="bg-[#171717] rounded-2xl p-6 border border-white/10">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h2 className="text-2xl font-bold flex items-center gap-3"><FaTrophy className="text-yellow-400" /> Leaderboard</h2>
                                        <div className="text-xs text-gray-500">
                                            {lastLeaderboardSync ? `Updated ${formatDateTime(lastLeaderboardSync)}` : 'Not synced yet'}
                                        </div>
                                    </div>

                                    {status === 'ENDED' && winners.length > 0 && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                                            {winners.map((winner, idx) => (
                                                <div
                                                    key={winner.userId || winner.username}
                                                    className="rounded-xl border p-4"
                                                    style={{ borderColor: MEDAL_STYLES[idx].color, background: MEDAL_STYLES[idx].bg }}
                                                >
                                                    <p className="text-xs font-semibold" style={{ color: MEDAL_STYLES[idx].color }}>{MEDAL_STYLES[idx].label}</p>
                                                    <p className="text-lg font-bold text-white mt-1">{winner.username}</p>
                                                    <p className="text-sm text-gray-200 mt-1">Score: {winner.score}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {leaderboardLoading ? (
                                        <p className="text-gray-400">Loading leaderboard...</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="text-left text-gray-400 border-b border-white/10">
                                                        <th className="py-2 pr-4">Rank</th>
                                                        <th className="py-2 pr-4">User</th>
                                                        <th className="py-2 pr-4">Rating</th>
                                                        <th className="py-2 pr-4">Score</th>
                                                        <th className="py-2 pr-4">Solved</th>
                                                        <th className="py-2 pr-4">Time</th>
                                                        <th className="py-2">Wrong</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {leaderboard.map((entry) => (
                                                        <tr key={entry.userId || entry.username} className="border-b border-white/5">
                                                            <td className="py-3 pr-4 font-semibold text-gray-300">{entry.rank}</td>
                                                            <td className="py-3 pr-4">
                                                                <Link to={`/profile/${entry.username}`} className="text-white hover:text-teal-400">
                                                                    {entry.username}
                                                                </Link>
                                                            </td>
                                                            <td className="py-3 pr-4 text-gray-300">{entry.rating || 1200}</td>
                                                            <td className="py-3 pr-4 text-green-400 font-semibold">{entry.score}</td>
                                                            <td className="py-3 pr-4 text-gray-300">{entry.solvedCount || 0}</td>
                                                            <td className="py-3 pr-4 text-gray-300">{Number(entry.totalTime ?? entry.penalty ?? 0).toFixed(2)}m</td>
                                                            <td className="py-3 text-gray-300">{entry.wrongSubmissions || 0}</td>
                                                        </tr>
                                                    ))}
                                                    {leaderboard.length === 0 && (
                                                        <tr>
                                                            <td className="py-6 text-gray-500" colSpan={7}>No leaderboard data yet.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </div>

                    <div className="lg:col-span-1">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-white/10 sticky top-8"
                        >
                            <h3 className="text-2xl font-bold mb-6 text-center">Contest Action</h3>

                            <div className="mb-4">
                                {status === 'UPCOMING' && (
                                    <button
                                        type="button"
                                        disabled
                                        className="w-full py-3 px-4 rounded-xl border border-yellow-500/40 bg-yellow-500/10 text-yellow-300 font-semibold"
                                    >
                                        <FaClock className="inline mr-2" /> Starts Soon
                                    </button>
                                )}

                                {status === 'ONGOING' && (
                                    <button
                                        type="button"
                                        onClick={handleEnterContest}
                                        disabled={isContestLockedForUser}
                                        className={`w-full py-3 px-4 rounded-xl font-semibold ${
                                            isContestLockedForUser
                                                ? 'border border-gray-600 bg-gray-700/40 text-gray-400 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700'
                                        }`}
                                    >
                                        <FaPlay className="inline mr-2" /> Enter Contest
                                    </button>
                                )}

                                {status === 'ENDED' && (
                                    <button
                                        type="button"
                                        disabled
                                        className="w-full py-3 px-4 rounded-xl border border-gray-600 bg-gray-700/40 text-gray-400 font-semibold"
                                    >
                                        Contest Ended
                                    </button>
                                )}
                            </div>

                            {status === 'ONGOING' && isRegistered && (
                                <div className="mb-5">
                                    <button
                                        type="button"
                                        onClick={handleSubmitContest}
                                        disabled={actionBusy || isContestLockedForUser}
                                        className={`w-full py-3 px-4 rounded-xl font-semibold ${
                                            actionBusy || isContestLockedForUser
                                                ? 'border border-gray-600 bg-gray-700/40 text-gray-400 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                                        }`}
                                    >
                                        <FaCheckCircle className="inline mr-2" />
                                        {isContestLockedForUser ? 'Contest Submitted' : (actionBusy ? 'Submitting...' : 'Submit Full Contest')}
                                    </button>
                                </div>
                            )}

                            <div className="space-y-2 mb-5">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('participants')}
                                    className="w-full py-2.5 rounded-lg bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/30 text-purple-300"
                                >
                                    <FaUsers className="inline mr-2" /> Participants
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('leaderboard')}
                                    className="w-full py-2.5 rounded-lg bg-yellow-500/15 border border-yellow-500/30 hover:bg-yellow-500/25 text-yellow-300"
                                >
                                    <FaTrophy className="inline mr-2" /> Leaderboard
                                </button>
                                <Link
                                    to={`/contest/${id}/leaderboard`}
                                    className="block text-center w-full py-2.5 rounded-lg bg-blue-600/15 border border-blue-500/30 hover:bg-blue-600/25 text-blue-300"
                                >
                                    Open Full Leaderboard
                                </Link>
                            </div>

                            <div className="pt-4 border-t border-white/10 text-sm text-gray-400">
                                {isRegistered
                                    ? 'You are registered for this contest.'
                                    : 'Register from contests page to participate.'}
                                {isRegistered && participation?.status && (
                                    <div className="mt-2 text-xs">
                                        Current status: <span className="font-semibold text-gray-200">{String(participation.status).toUpperCase()}</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContestParticipation;
