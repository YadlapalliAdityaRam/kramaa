import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FaArrowLeft, FaClock, FaSync, FaTrophy, FaUsers } from 'react-icons/fa';
import api from '../../utils/api';

const podiumLabels = ['First place', 'Second place', 'Third place'];

const formatDateTime = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';

    return new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    }).format(date);
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

    const fetchLeaderboard = useCallback(async (manual = false) => {
        if (manual) setRefreshing(true);

        try {
            const [contestResponse, leaderboardResponse] = await Promise.all([
                api.get(`/contests/${id}`),
                api.get(`/contests/${id}/leaderboard`)
            ]);

            setContest(contestResponse.data.contest || null);
            setLeaderboard(leaderboardResponse.data.leaderboard || []);
            setWinners(leaderboardResponse.data.winners || []);
            setContestMeta(leaderboardResponse.data.contestMeta || null);
            setLastUpdated(new Date());
        } catch (error) {
            if (manual) toast.error(error?.response?.data?.message || 'Unable to refresh standings');
        } finally {
            setLoading(false);
            if (manual) setRefreshing(false);
        }
    }, [id]);

    useEffect(() => {
        fetchLeaderboard();
        const interval = window.setInterval(() => {
            if (!completedRef.current) fetchLeaderboard();
        }, 30000);

        return () => window.clearInterval(interval);
    }, [fetchLeaderboard]);

    const isCompleted = useMemo(() => {
        if (typeof contestMeta?.isCompleted === 'boolean') return contestMeta.isCompleted;
        const endTime = contest?.endTime ? new Date(contest.endTime) : null;
        return Boolean(endTime && Date.now() > endTime.getTime());
    }, [contest?.endTime, contestMeta?.isCompleted]);

    useEffect(() => {
        completedRef.current = isCompleted;
    }, [isCompleted]);

    if (loading) {
        return (
            <main className="content-page competition-leaderboard-page page-loading" aria-live="polite">
                <span aria-hidden="true" />
                <p>Loading contest standings</p>
            </main>
        );
    }

    return (
        <main className="content-page competition-leaderboard-page">
            <header className="competition-leaderboard-header">
                <Link to={`/contest/${id}`} className="competition-back-link">
                    <FaArrowLeft aria-hidden="true" /> Back to contest
                </Link>
                <div>
                    <p className="content-kicker">Contest results</p>
                    <h1>{contest?.title || contestMeta?.title || 'Contest standings'}</h1>
                </div>
                <div className="competition-refresh">
                    <span><FaClock aria-hidden="true" /> Updated {formatDateTime(lastUpdated)}</span>
                    <button
                        type="button"
                        className="competition-refresh-button"
                        onClick={() => fetchLeaderboard(true)}
                        disabled={refreshing}
                        aria-label="Refresh contest standings"
                    >
                        <FaSync className={refreshing ? 'competition-refresh-icon--spinning' : undefined} aria-hidden="true" />
                    </button>
                </div>
            </header>

            {isCompleted && winners.length > 0 && (
                <section className="competition-winners" aria-labelledby="contest-winners-heading">
                    <header>
                        <p className="content-kicker">Final results</p>
                        <h2 id="contest-winners-heading"><FaTrophy aria-hidden="true" /> Winners</h2>
                    </header>
                    <div>
                        {winners.slice(0, 3).map((winner, index) => (
                            <article key={winner.userId || winner.username} className={`competition-winner competition-winner--${index + 1}`}>
                                <span>{podiumLabels[index]}</span>
                                <h3>{winner.username}</h3>
                                <p>{winner.score} points</p>
                            </article>
                        ))}
                    </div>
                </section>
            )}

            <section className="competition-standings" aria-labelledby="competition-standings-heading">
                <header>
                    <div>
                        <p className="content-kicker">Live board</p>
                        <h2 id="competition-standings-heading">Participant standings</h2>
                    </div>
                    <span><FaUsers aria-hidden="true" /> {contestMeta?.participantCount ?? leaderboard.length} participants</span>
                </header>
                <div className="competition-standings-table-wrap">
                    <table className="competition-standings-table">
                        <thead>
                            <tr>
                                <th scope="col">Rank</th>
                                <th scope="col">Learner</th>
                                <th scope="col">Rating</th>
                                <th scope="col">Score</th>
                                <th scope="col">Solved</th>
                                <th scope="col">Registered</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.map((entry) => (
                                <tr key={entry.userId || entry.username}>
                                    <td>#{entry.rank}</td>
                                    <td><Link to={`/profile/${entry.username}`}>{entry.username}</Link></td>
                                    <td>{entry.rating || 1200}</td>
                                    <td className="competition-score">{entry.score}</td>
                                    <td>{entry.solvedCount || 0}</td>
                                    <td>{formatDateTime(entry.registrationTime)}</td>
                                </tr>
                            ))}
                            {!leaderboard.length && (
                                <tr>
                                    <td colSpan={6} className="competition-standings-empty">No participants yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    );
};

export default ContestLeaderboard;
