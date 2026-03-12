import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';
import api, { getCurrentSocketBaseUrl, getSocketClientOptions } from '../utils/api';
import FollowButton from '../components/social/FollowButton';

const Leaderboard = () => {
    const { isAuthenticated, user: authUser } = useSelector((state) => state.auth);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [followingSet, setFollowingSet] = useState(new Set());
    const [viewportWidth, setViewportWidth] = useState(() => (
        typeof window !== 'undefined' ? window.innerWidth : 1400
    ));

    useEffect(() => {
        const onResize = () => setViewportWidth(window.innerWidth);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    useEffect(() => {
        fetchLeaderboard();

        const socket = io(getCurrentSocketBaseUrl(), getSocketClientOptions());
        socket.on('leaderboardUpdate', () => {
            fetchLeaderboard();
        });

        // Fallback polling every 60s in case Socket.IO drops
        const fallbackInterval = setInterval(fetchLeaderboard, 60000);

        return () => {
            socket.disconnect();
            clearInterval(fallbackInterval);
        };
    }, []);

    useEffect(() => {
        if (!isAuthenticated || !authUser?._id) {
            setFollowingSet(new Set());
            return;
        }

        let cancelled = false;

        const loadFollowing = async () => {
            try {
                const ids = new Set();
                let page = 1;
                let hasMore = true;
                const maxPages = 5;

                while (hasMore && page <= maxPages) {
                    const res = await api.get(`/following/${authUser._id}`, { params: { page, limit: 100 } });
                    const rows = Array.isArray(res.data?.users) ? res.data.users : [];
                    rows.forEach((row) => {
                        if (row?._id) ids.add(String(row._id));
                    });

                    const totalPages = Number(res.data?.pagination?.pages || 1);
                    hasMore = page < totalPages;
                    page += 1;
                }

                if (!cancelled) setFollowingSet(ids);
            } catch (error) {
                if (!cancelled) {
                    setFollowingSet(new Set());
                }
            }
        };

        loadFollowing();

        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, authUser?._id]);

    const fetchLeaderboard = async () => {
        try {
            const res = await api.get('/users/leaderboard');
            setUsers(Array.isArray(res.data.users) ? res.data.users : []);
        } catch (err) {
            console.error('Failed to fetch leaderboard', err);
        } finally {
            setLoading(false);
        }
    };

    const followingLookup = useMemo(() => followingSet, [followingSet]);

    const handleFollowStateChange = (targetUserId, nextState) => {
        const normalizedId = String(targetUserId || '');
        if (!normalizedId) return;

        setFollowingSet((prev) => {
            const next = new Set(prev);
            if (nextState) next.add(normalizedId);
            else next.delete(normalizedId);
            return next;
        });

        toast.success(nextState ? 'Now following user' : 'Unfollowed user');
    };

    const isMobile = viewportWidth <= 768;

    return (
        <div className="main-content">
            <div style={{ maxWidth: '980px', margin: '0 auto', padding: isMobile ? '20px 12px' : '40px 20px' }}>
                <h1 style={{ textAlign: 'center', fontSize: isMobile ? '2rem' : '3rem', marginBottom: isMobile ? '24px' : '40px', background: 'linear-gradient(to right, #4fd1c5, #63b3ed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Global Rank
                </h1>

                {loading ? (
                    <div style={{ textAlign: 'center' }}>Loading...</div>
                ) : (
                    <div className="glass-panel" style={{ padding: isMobile ? '12px' : '20px', borderRadius: '16px', overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? '620px' : 'auto' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                                    <th style={{ padding: isMobile ? '10px' : '16px', color: 'var(--text-secondary)' }}>Rank</th>
                                    <th style={{ padding: isMobile ? '10px' : '16px', color: 'var(--text-secondary)' }}>User</th>
                                    <th style={{ padding: isMobile ? '10px' : '16px', color: 'var(--text-secondary)' }}>Score</th>
                                    <th style={{ padding: isMobile ? '10px' : '16px', color: 'var(--text-secondary)' }}>Solved</th>
                                    <th style={{ padding: isMobile ? '10px' : '16px', color: 'var(--text-secondary)' }}>Acceptance</th>
                                    <th style={{ padding: isMobile ? '10px' : '16px', color: 'var(--text-secondary)' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user, index) => {
                                    const solved = (user.totalSolvedEasy || 0) + (user.totalSolvedMedium || 0) + (user.totalSolvedHard || 0);
                                    const isSelf = String(authUser?._id || '') === String(user._id || '');
                                    const isFollowing = followingLookup.has(String(user._id || ''));
                                    return (
                                        <motion.tr
                                            key={user._id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.04 }}
                                            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                        >
                                            <td style={{ padding: isMobile ? '10px' : '16px', fontWeight: 700 }}>#{user.globalRank || (index + 1)}</td>
                                            <td style={{ padding: isMobile ? '10px' : '16px', fontWeight: 'bold' }}>
                                                <Link to={`/profile/${user.username}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                                    {user.username}
                                                </Link>
                                            </td>
                                            <td style={{ padding: isMobile ? '10px' : '16px', color: 'var(--primary-teal)' }}>{Number(user.finalScore || 0).toFixed(2)}</td>
                                            <td style={{ padding: isMobile ? '10px' : '16px' }}>{solved}</td>
                                            <td style={{ padding: isMobile ? '10px' : '16px' }}>{Number(user.problemAcceptanceRate || 0).toFixed(2)}%</td>
                                            <td style={{ padding: isMobile ? '10px' : '16px' }}>
                                                {isAuthenticated ? (
                                                    <FollowButton
                                                        size="sm"
                                                        targetUserId={user._id}
                                                        isSelf={isSelf}
                                                        initialFollowing={isFollowing}
                                                        onStateChange={(nextState) => handleFollowStateChange(user._id, nextState)}
                                                    />
                                                ) : (
                                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Login to follow</span>
                                                )}
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Leaderboard;
