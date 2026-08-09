import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
import { FaArrowRight, FaChartLine, FaTrophy, FaUsers } from 'react-icons/fa';
import api, { getCurrentSocketBaseUrl, getSocketClientOptions } from '../utils/api';
import FollowButton from '../components/social/FollowButton';

const formatNumber = (value) => new Intl.NumberFormat('en').format(Number(value || 0));

const Leaderboard = () => {
    const { isAuthenticated, user: authUser } = useSelector((state) => state.auth);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [followingSet, setFollowingSet] = useState(new Set());

    const fetchLeaderboard = useCallback(async () => {
        try {
            const response = await api.get('/users/leaderboard');
            setUsers(Array.isArray(response.data.users) ? response.data.users : []);
        } catch {
            toast.error('Unable to refresh the leaderboard');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLeaderboard();

        const socket = io(getCurrentSocketBaseUrl(), getSocketClientOptions());
        socket.on('leaderboardUpdate', fetchLeaderboard);
        const polling = window.setInterval(fetchLeaderboard, 60000);

        return () => {
            socket.disconnect();
            window.clearInterval(polling);
        };
    }, [fetchLeaderboard]);

    useEffect(() => {
        if (!isAuthenticated || !authUser?._id) {
            setFollowingSet(new Set());
            return undefined;
        }

        let cancelled = false;

        const loadFollowing = async () => {
            try {
                const ids = new Set();
                let page = 1;
                let hasMore = true;

                while (hasMore && page <= 5) {
                    const response = await api.get(`/following/${authUser._id}`, { params: { page, limit: 100 } });
                    const rows = Array.isArray(response.data?.users) ? response.data.users : [];
                    rows.forEach((row) => {
                        if (row?._id) ids.add(String(row._id));
                    });
                    hasMore = page < Number(response.data?.pagination?.pages || 1);
                    page += 1;
                }

                if (!cancelled) setFollowingSet(ids);
            } catch {
                if (!cancelled) setFollowingSet(new Set());
            }
        };

        loadFollowing();

        return () => {
            cancelled = true;
        };
    }, [authUser?._id, isAuthenticated]);

    const followingLookup = useMemo(() => followingSet, [followingSet]);

    const handleFollowStateChange = (targetUserId, nextState) => {
        const normalizedId = String(targetUserId || '');
        if (!normalizedId) return;

        setFollowingSet((previous) => {
            const next = new Set(previous);
            if (nextState) next.add(normalizedId);
            else next.delete(normalizedId);
            return next;
        });

        toast.success(nextState ? 'Following user' : 'Unfollowed user');
    };

    if (loading) {
        return (
            <main className="content-page leaderboard-page page-loading" aria-live="polite">
                <span aria-hidden="true" />
                <p>Loading standings</p>
            </main>
        );
    }

    return (
        <main className="content-page leaderboard-page">
            <header className="leaderboard-intro">
                <div className="content-page-intro">
                    <p className="content-kicker">Community progress</p>
                    <h1>Standings, earned steadily.</h1>
                    <p className="content-lede">
                        A live view of the people building momentum through thoughtful practice and completed challenges.
                    </p>
                </div>
                <div className="leaderboard-summary" aria-label="Leaderboard overview">
                    <FaUsers aria-hidden="true" />
                    <strong>{formatNumber(users.length)}</strong>
                    <span>ranked learners</span>
                    <Link to="/contests" className="content-button content-button-secondary">
                        Browse contests <FaArrowRight aria-hidden="true" />
                    </Link>
                </div>
            </header>

            {users.length ? (
                <section className="leaderboard-table-wrap" aria-label="Global leaderboard">
                    <table className="leaderboard-table">
                        <thead>
                            <tr>
                                <th scope="col">Rank</th>
                                <th scope="col">Learner</th>
                                <th scope="col">Score</th>
                                <th scope="col">Solved</th>
                                <th scope="col">Acceptance</th>
                                <th scope="col"><span className="visually-hidden">Follow learner</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, index) => {
                                const rank = Number(user.globalRank || index + 1);
                                const solved = (user.totalSolvedEasy || 0) + (user.totalSolvedMedium || 0) + (user.totalSolvedHard || 0);
                                const isSelf = String(authUser?._id || '') === String(user._id || '');
                                const isFollowing = followingLookup.has(String(user._id || ''));
                                const rankClass = rank <= 3 ? `leaderboard-rank--${rank}` : '';

                                return (
                                    <tr key={user._id || user.username}>
                                        <td><span className={`leaderboard-rank ${rankClass}`}>{rank <= 3 ? <FaTrophy aria-hidden="true" /> : `#${rank}`}</span></td>
                                        <td>
                                            <Link className="leaderboard-user" to={`/profile/${user.username}`}>
                                                <span className="leaderboard-avatar" aria-hidden="true">
                                                    {user.avatar ? <img src={user.avatar} alt="" /> : user.username?.slice(0, 1).toUpperCase()}
                                                </span>
                                                <span>
                                                    <strong>{user.username}</strong>
                                                    {isSelf && <em>You</em>}
                                                </span>
                                            </Link>
                                        </td>
                                        <td className="leaderboard-score">{Number(user.finalScore || 0).toFixed(2)}</td>
                                        <td>{formatNumber(solved)}</td>
                                        <td>{Number(user.problemAcceptanceRate || 0).toFixed(2)}%</td>
                                        <td className="leaderboard-action">
                                            {isAuthenticated ? (
                                                <FollowButton
                                                    size="sm"
                                                    targetUserId={user._id}
                                                    isSelf={isSelf}
                                                    initialFollowing={isFollowing}
                                                    onStateChange={(nextState) => handleFollowStateChange(user._id, nextState)}
                                                />
                                            ) : (
                                                <Link className="leaderboard-login" to="/login">Sign in</Link>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </section>
            ) : (
                <section className="catalog-empty">
                    <FaChartLine aria-hidden="true" />
                    <h2>The standings are quiet for now.</h2>
                    <p>Complete a problem or contest to help set the first benchmark.</p>
                </section>
            )}
        </main>
    );
};

export default Leaderboard;
