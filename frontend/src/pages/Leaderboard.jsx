import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';
import api, { getCurrentSocketBaseUrl, getSocketClientOptions } from '../utils/api';

const Leaderboard = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
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
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user, index) => {
                                    const solved = (user.totalSolvedEasy || 0) + (user.totalSolvedMedium || 0) + (user.totalSolvedHard || 0);
                                    return (
                                        <motion.tr
                                            key={user._id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.04 }}
                                            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                        >
                                            <td style={{ padding: isMobile ? '10px' : '16px', fontWeight: 700 }}>#{user.globalRank || (index + 1)}</td>
                                            <td style={{ padding: isMobile ? '10px' : '16px', fontWeight: 'bold' }}>{user.username}</td>
                                            <td style={{ padding: isMobile ? '10px' : '16px', color: 'var(--primary-teal)' }}>{Number(user.finalScore || 0).toFixed(2)}</td>
                                            <td style={{ padding: isMobile ? '10px' : '16px' }}>{solved}</td>
                                            <td style={{ padding: isMobile ? '10px' : '16px' }}>{Number(user.problemAcceptanceRate || 0).toFixed(2)}%</td>
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
