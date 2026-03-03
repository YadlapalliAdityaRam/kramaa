import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import { FaUsers, FaClock, FaCalendarAlt, FaCheckCircle, FaUserPlus, FaLock, FaTrophy, FaArrowRight } from 'react-icons/fa';

const ContestCard = ({ contest, onRegister, nowMs, isMobile }) => {
    const { isAuthenticated } = useSelector(state => state.auth);
    const now = new Date(nowMs || Date.now());
    const startTime = new Date(contest.startTime);
    const endTime = new Date(contest.endTime);
    const regOpenDate = contest.registrationOpenDate ? new Date(contest.registrationOpenDate) : null;

    const isActive = now >= startTime && now <= endTime;
    const isUpcoming = now < startTime;
    const isPast = now > endTime;
    const isRegistered = contest.isRegistered || false;
    const isRegistrationOpen = typeof contest.isRegistrationOpen === 'boolean'
        ? contest.isRegistrationOpen
        : isUpcoming;
    const regNotYetOpen = regOpenDate && now < regOpenDate;

    const [registering, setRegistering] = useState(false);

    const formatDate = (date) => {
        return new Date(date).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const getDuration = () => {
        const diff = endTime - startTime;
        const mins = Math.floor(diff / 60000);
        if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
        return `${mins} min`;
    };

    const getCountdown = () => {
        const diff = startTime - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (days > 0) return `${days}d ${hours}h`;
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins}m`;
    };

    const handleRegister = async () => {
        if (!isAuthenticated) return toast.error('Login required to register');
        setRegistering(true);
        try {
            await api.post(`/contests/${contest._id}/register`);
            toast.success('Registered successfully! 🎉');
            if (onRegister) onRegister();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to register');
        } finally {
            setRegistering(false);
        }
    };

    // Status indicator styles
    const statusConfig = isActive
        ? { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: '#22c55e', label: '🟢 LIVE', glow: '0 0 20px rgba(34,197,94,0.3)' }
        : isUpcoming
            ? { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: '#3b82f6', label: '🔵 Upcoming', glow: 'none' }
            : { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: '#444', label: '⚫ Ended', glow: 'none' };

    return (
        <motion.div
            whileHover={{ scale: 1.01, y: -2 }}
            transition={{ type: 'spring', stiffness: 300 }}
            style={{
                background: 'rgba(17,24,39,0.7)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                borderLeft: `4px solid ${statusConfig.border}`,
                border: `1px solid rgba(255,255,255,0.06)`,
                borderLeftWidth: '4px',
                borderLeftColor: statusConfig.border,
                padding: isMobile ? '16px' : '24px',
                marginBottom: '16px',
                boxShadow: statusConfig.glow
            }}
        >
            {/* Top row: Title + Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: isMobile ? '1.05rem' : '1.3rem', color: 'var(--text-primary, #f3f4f6)', fontWeight: '700' }}>{contest.title}</h3>
                    {contest.description && (
                        <p style={{ color: 'var(--text-secondary, #9ca3af)', margin: 0, fontSize: '0.85rem', lineHeight: '1.4', maxWidth: '500px' }}>
                            {contest.description.substring(0, 120)}{contest.description.length > 120 ? '...' : ''}
                        </p>
                    )}
                </div>
                <span style={{
                    padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700',
                    background: statusConfig.bg, color: statusConfig.color, whiteSpace: 'nowrap',
                    border: `1px solid ${statusConfig.color}30`
                }}>
                    {statusConfig.label}
                </span>
            </div>

            {/* Info row */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary, #9ca3af)', fontSize: '0.85rem' }}>
                    <FaCalendarAlt style={{ color: '#fb923c' }} />
                    {formatDate(contest.startTime)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary, #9ca3af)', fontSize: '0.85rem' }}>
                    <FaClock style={{ color: '#3b82f6' }} />
                    {getDuration()}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary, #9ca3af)', fontSize: '0.85rem' }}>
                    <FaUsers style={{ color: '#a855f7' }} />
                    {(contest.participantCount ?? contest.participantsCount) || 0} registered
                </div>
                {isUpcoming && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#14b8a6', fontSize: '0.85rem', fontWeight: '600' }}>
                        ⏱ Starts in {getCountdown()}
                    </div>
                )}
            </div>

            {/* Action row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                {/* Register button logic */}
                {isRegistered ? (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 18px', borderRadius: '10px',
                        background: 'rgba(34,197,94,0.15)', color: '#22c55e',
                        fontSize: '0.85rem', fontWeight: '600',
                        border: '1px solid rgba(34,197,94,0.3)'
                    }}>
                        <FaCheckCircle /> Registered ✓
                    </div>
                ) : regNotYetOpen ? (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 18px', borderRadius: '10px',
                        background: 'rgba(107,114,128,0.15)', color: 'var(--text-secondary, #9ca3af)',
                        fontSize: '0.85rem', fontWeight: '500',
                        border: '1px solid rgba(107,114,128,0.2)'
                    }}>
                        <FaLock style={{ fontSize: '0.75rem' }} />
                        Registration opens {formatDate(contest.registrationOpenDate)}
                    </div>
                ) : isUpcoming && isRegistrationOpen && !regNotYetOpen ? (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleRegister}
                        disabled={registering}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 20px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                            color: 'var(--text-primary, white)', border: 'none', cursor: 'pointer',
                            fontSize: '0.85rem', fontWeight: '700',
                            opacity: registering ? 0.7 : 1,
                            boxShadow: '0 4px 15px rgba(59,130,246,0.3)'
                        }}
                    >
                        <FaUserPlus /> {registering ? 'Registering...' : 'Register Now'}
                    </motion.button>
                ) : isPast ? (
                    <Link to={`/contest/${contest._id}`} style={{ textDecoration: 'none' }}>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 20px', borderRadius: '10px',
                                background: 'rgba(107,114,128,0.2)',
                                color: 'var(--text-secondary, #9ca3af)', border: '1px solid rgba(107,114,128,0.3)', cursor: 'pointer',
                                fontSize: '0.85rem', fontWeight: '600',
                            }}
                        >
                            View Contest <FaArrowRight />
                        </motion.button>
                    </Link>
                ) : null}

                {/* Enter contest button — only for registered users when active */}
                {isActive && isRegistered && (
                    <Link to={`/contest/${contest._id}`} style={{ textDecoration: 'none' }}>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 20px', borderRadius: '10px',
                                background: 'linear-gradient(135deg, #22c55e, #14b8a6)',
                                color: 'var(--text-primary, white)', border: 'none', cursor: 'pointer',
                                fontSize: '0.85rem', fontWeight: '700',
                                boxShadow: '0 4px 15px rgba(34,197,94,0.3)'
                            }}
                        >
                            Enter Contest <FaArrowRight />
                        </motion.button>
                    </Link>
                )}

                {/* Active but not registered */}
                {isActive && !isRegistered && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 18px', borderRadius: '10px',
                        background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                        fontSize: '0.85rem', fontWeight: '500',
                        border: '1px solid rgba(239,68,68,0.2)'
                    }}>
                        <FaLock style={{ fontSize: '0.75rem' }} /> Registration required to participate
                    </div>
                )}
            </div>
        </motion.div>
    );
};

const Contests = () => {
    const [contests, setContests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [nowMs, setNowMs] = useState(() => Date.now());
    const [viewportWidth, setViewportWidth] = useState(() => (
        typeof window !== 'undefined' ? window.innerWidth : 1400
    ));

    const normalizeContest = (contest = {}) => ({
        ...contest,
        _id: contest._id || contest.id,
        participantCount: contest.participantCount ?? contest.participantsCount ?? 0
    });

    const normalizeContestsPayload = (payload) => {
        if (Array.isArray(payload)) {
            return payload.map(normalizeContest);
        }

        if (payload && typeof payload === 'object') {
            const grouped = ['running', 'upcoming', 'completed']
                .reduce((allContests, key) => {
                    const contestsByKey = Array.isArray(payload[key]) ? payload[key] : [];
                    return allContests.concat(contestsByKey);
                }, []);
            return grouped.map(normalizeContest);
        }

        return [];
    };

    const fetchContests = async ({ silent = false } = {}) => {
        try {
            const res = await api.get('/contests');
            setContests(normalizeContestsPayload(res.data.contests));
        } catch (error) {
            if (!silent) {
                toast.error('Failed to load contests');
            }
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContests({ silent: false });
    }, []);

    useEffect(() => {
        const onResize = () => setViewportWidth(window.innerWidth);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    useEffect(() => {
        const tick = setInterval(() => {
            setNowMs(Date.now());
        }, 1000);

        return () => clearInterval(tick);
    }, []);

    useEffect(() => {
        const poll = setInterval(() => {
            fetchContests({ silent: true });
        }, 15000);

        return () => clearInterval(poll);
    }, []);

    const now = new Date(nowMs);
    const isMobile = viewportWidth <= 768;
    const activeContests = contests.filter(c => {
        const start = new Date(c.startTime);
        const end = new Date(c.endTime);
        return now >= start && now <= end;
    });

    const upcomingContests = contests.filter(c => {
        const start = new Date(c.startTime);
        return now < start;
    });

    const pastContests = contests.filter(c => {
        const end = new Date(c.endTime);
        return now > end;
    });

    if (loading) {
        return (
            <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'pulse 1.5s infinite' }}>⚡</div>
                    <p style={{ color: 'var(--text-secondary, #9ca3af)' }}>Loading contests...</p>
                </div>
            </div>
        );
    }

    const Section = ({ title, icon, color, contests: sectionContests }) => (
        sectionContests.length > 0 && (
            <section style={{ marginBottom: '32px' }}>
                <h2 style={{
                    marginBottom: '16px',
                    paddingBottom: '10px',
                    borderBottom: `2px solid ${color}`,
                    color: color,
                    fontWeight: '700',
                    fontSize: '1.2rem',
                    display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                    {icon} {title}
                    <span style={{
                        fontSize: '0.75rem', padding: '2px 8px',
                        background: `${color}20`, borderRadius: '10px', color
                    }}>
                        {sectionContests.length}
                    </span>
                </h2>
                {sectionContests.map(contest => (
                    <ContestCard key={contest._id} contest={contest} onRegister={fetchContests} nowMs={nowMs} isMobile={isMobile} />
                ))}
            </section>
        )
    );

    return (
        <div className="main-content">
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: isMobile ? '20px 12px' : '40px 20px' }}>
                <div style={{ textAlign: 'center', marginBottom: isMobile ? '24px' : '40px' }}>
                    <h1 style={{
                        fontSize: isMobile ? '2rem' : '3rem', marginBottom: '16px', fontWeight: '800',
                        background: 'linear-gradient(135deg, #14b8a6, #3b82f6, #a855f7)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                    }}>
                        Contest Arena <FaTrophy style={{ WebkitTextFillColor: '#facc15', fontSize: '2.5rem' }} />
                    </h1>
                    <p style={{ color: 'var(--text-secondary, #9ca3af)', fontSize: isMobile ? '0.95rem' : '1.1rem' }}>Compete with the best. Climb the global leaderboard.</p>
                </div>

                <div style={{ display: 'grid', gap: '8px' }}>
                    <Section title="Live Contests" icon="🟢" color="#22c55e" contests={activeContests} />
                    <Section title="Upcoming Contests" icon="🔵" color="#3b82f6" contests={upcomingContests} />
                    <Section title="Past Contests" icon="⚫" color="#6b7280" contests={pastContests} />

                    {contests.length === 0 && (
                        <div style={{
                            textAlign: 'center', padding: '60px 20px',
                            border: '2px dashed #374151', borderRadius: '16px',
                            background: 'rgba(0,0,0,0.2)'
                        }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏆</div>
                            <h3 style={{ color: 'var(--text-secondary, #9ca3af)', marginBottom: '0.5rem' }}>No Contests Available</h3>
                            <p style={{ color: '#6b7280' }}>Check back soon for upcoming contests!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Contests;
