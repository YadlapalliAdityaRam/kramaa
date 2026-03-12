import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    FaEye, FaCode, FaRobot, FaTrophy, FaRoute, FaMedal,
    FaStar, FaArrowRight, FaChevronRight,
    FaCheckCircle, FaUsers, FaLightbulb, FaFire,
    FaBolt, FaCrown, FaGem, FaShieldAlt, FaAward, FaRocket,
    FaTerminal, FaLayerGroup, FaNetworkWired, FaBrain
} from 'react-icons/fa';
import { algorithmList } from '../data/algorithmsData';
import AnimatedBackground from '../components/common/AnimatedBackground';
import api from '../utils/api';
import FollowButton from '../components/social/FollowButton';
import './Home.css';

const useReveal = () => {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) el.classList.add('visible'); },
            { threshold: 0.12 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    return ref;
};

const Reveal = ({ children, className = '', delay = 0 }) => {
    const ref = useReveal();
    return (
        <div ref={ref} className={`reveal ${delay ? `reveal-delay-${delay}` : ''} ${className}`}>
            {children}
        </div>
    );
};

/* ——————————————————————————————————————————————————————————————————————————
   Animated Counter
   —————————————————————————————————————————————————————————————————————————— */
const AnimatedCounter = ({ target, suffix = '' }) => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const started = useRef(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !started.current) {
                started.current = true;
                const num = parseInt(target.replace(/[^0-9]/g, ''));
                const duration = 2200;
                const steps = 70;
                const increment = num / steps;
                let current = 0;
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= num) { setCount(num); clearInterval(timer); }
                    else setCount(Math.floor(current));
                }, duration / steps);
            }
        }, { threshold: 0.5 });
        observer.observe(el);
        return () => observer.disconnect();
    }, [target]);

    return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

/* ——————————————————————————————————————————————————————————————————————————
   Feature code previews
   —————————————————————————————————————————————————————————————————————————— */
const CODE_PREVIEWS = {
    'Interactive Algorithm Visualizer': 'bubbleSort(arr) → compare → swap',
    'Built-in Online IDE': 'const solve = (n) => { ... }',
    'AI Code Reviewer': 'AI: "Consider edge case n=0"',
    'Contest Arena': 'timeLeft: 01:45:32 | Rank: #4',
    'Personalized Learning Path': 'progress: █████████░░ 80%'
};
const relativeTime = (value) => {
    const time = new Date(value).getTime();
    if (!Number.isFinite(time)) return '';
    const diffMs = Date.now() - time;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay}d ago`;
};

const describeActivity = (item) => {
    const username = item?.user?.username || 'Someone';
    switch (item?.activityType) {
        case 'problem_solved':
            return `${username} solved ${item?.problem?.title ? `"${item.problem.title}"` : 'a problem'}`;
        case 'daily_challenge_completed':
            return `${username} completed today's daily challenge`;
        case 'solution_posted':
            return `${username} posted a solution`;
        case 'discussion_created':
            return `${username} started a discussion`;
        case 'contest_joined':
            return `${username} joined a contest`;
        case 'contest_ranked':
            return `${username} received a contest rank update`;
        case 'contest_finished':
            return `${username} finished a contest`;
        case 'contest_exited':
            return `${username} exited a contest`;
        default:
            return `${username} has a new activity`;
    }
};

/* ——————————————————————————————————————————————————————————————————————————
   Home Page
   —————————————————————————————————————————————————————————————————————————— */
const Home = () => {
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const [liveStats, setLiveStats] = useState({
        algorithmsCount: null,
        usersCount: null,
        updatedAt: null
    });
    const [socialWidgets, setSocialWidgets] = useState({
        activity: [],
        suggested: [],
        friendsLeaderboard: [],
        dailyChallenge: null,
        dailyChallengeUsers: []
    });
    const [socialLoading, setSocialLoading] = useState(false);
    const [suggestedFollowState, setSuggestedFollowState] = useState({});

    useEffect(() => {
        let cancelled = false;

        const loadHomeStats = async () => {
            try {
                const { data } = await api.get('/home/stats');
                if (cancelled) return;

                const algorithmsCount = Number(data?.data?.algorithmsCount);
                const usersCount = Number(data?.data?.usersCount);

                setLiveStats({
                    algorithmsCount: Number.isFinite(algorithmsCount) ? algorithmsCount : null,
                    usersCount: Number.isFinite(usersCount) ? usersCount : null,
                    updatedAt: data?.data?.updatedAt || null
                });
            } catch (error) {
                if (!cancelled) {
                    console.error('Failed to load home stats:', error?.response?.data?.message || error?.message);
                }
            }
        };

        loadHomeStats();
        const intervalId = setInterval(loadHomeStats, 30000);

        return () => {
            cancelled = true;
            clearInterval(intervalId);
        };
    }, []);

    useEffect(() => {
        if (!isAuthenticated || !user?._id) {
            setSocialWidgets({
                activity: [],
                suggested: [],
                friendsLeaderboard: [],
                dailyChallenge: null,
                dailyChallengeUsers: []
            });
            setSuggestedFollowState({});
            return;
        }

        let cancelled = false;
        setSocialLoading(true);

        const loadSocialWidgets = async () => {
            try {
                const [activityRes, suggestedRes, friendsRes, dailyRes] = await Promise.all([
                    api.get('/activity/feed', { params: { limit: 10 } }),
                    api.get('/suggested-users', { params: { limit: 6 } }),
                    api.get('/social/friends-leaderboard', { params: { limit: 8 } }),
                    api.get('/social/daily-challenge-activity', { params: { limit: 8 } })
                ]);

                if (cancelled) return;

                const suggestedUsers = Array.isArray(suggestedRes.data?.users) ? suggestedRes.data.users : [];
                setSocialWidgets({
                    activity: Array.isArray(activityRes.data?.items) ? activityRes.data.items : [],
                    suggested: suggestedUsers,
                    friendsLeaderboard: Array.isArray(friendsRes.data?.users) ? friendsRes.data.users : [],
                    dailyChallenge: dailyRes.data?.challenge || null,
                    dailyChallengeUsers: Array.isArray(dailyRes.data?.users) ? dailyRes.data.users : []
                });
                setSuggestedFollowState((prev) => {
                    const next = { ...(prev || {}) };
                    suggestedUsers.forEach((entry) => {
                        const uid = String(entry?._id || '');
                        if (uid && !Object.prototype.hasOwnProperty.call(next, uid)) {
                            next[uid] = Boolean(entry?.isFollowing);
                        }
                    });
                    return next;
                });
            } catch (error) {
                if (!cancelled) {
                    setSocialWidgets({
                        activity: [],
                        suggested: [],
                        friendsLeaderboard: [],
                        dailyChallenge: null,
                        dailyChallengeUsers: []
                    });
                    setSuggestedFollowState({});
                }
            } finally {
                if (!cancelled) setSocialLoading(false);
            }
        };

        loadSocialWidgets();

        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, user?._id]);

    const statsCards = [
        {
            label: 'Algorithms',
            value: liveStats.algorithmsCount,
            icon: <FaEye />,
            color: '#6366f1'
        },
        {
            label: 'Users',
            value: liveStats.usersCount,
            icon: <FaUsers />,
            color: '#10b981'
        }
    ];

    const safeActivity = Array.isArray(socialWidgets.activity) ? socialWidgets.activity : [];
    const safeSuggested = Array.isArray(socialWidgets.suggested) ? socialWidgets.suggested : [];
    const safeFriends = Array.isArray(socialWidgets.friendsLeaderboard) ? socialWidgets.friendsLeaderboard : [];
    const safeDailyUsers = Array.isArray(socialWidgets.dailyChallengeUsers) ? socialWidgets.dailyChallengeUsers : [];

    const handleSuggestedFollowStateChange = (targetUserId, nextState) => {
        const normalizedId = String(targetUserId || '');
        if (!normalizedId) return;
        setSuggestedFollowState((prev) => ({ ...prev, [normalizedId]: Boolean(nextState) }));
    };

    return (
        <div className="algoverse-home">
            <AnimatedBackground />

            {/* ———————————————— HERO ———————————————— */}
            <section className="hero-section">
                <div className="hero-bg-orb orb-1" />
                <div className="hero-bg-orb orb-2" />
                <div className="hero-bg-orb orb-3" />

                <div className="floating-elements">
                    <span className="float-el">&lt;/&gt;</span>
                    <span className="float-el">{'{ }'}</span>
                    <span className="float-el">O(n)</span>
                    <span className="float-el">→</span>
                    <span className="float-el">if()</span>
                    <span className="float-el">[ ]</span>
                    <div className="glow-node" />
                    <div className="glow-node" />
                    <div className="glow-node" />
                    <div className="glow-node" />
                </div>

                <motion.div
                    className="hero-content"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div className="hero-badge">🚀 Revolutionizing Computer Science Education</div>

                    <h1 className="hero-title">
                        Master Algorithms<br />
                        <span className="gradient-highlight" data-text="The Visual Way">The Visual Way</span>
                    </h1>

                    <p className="hero-subtitle">
                        AlgoVerse is the ultimate platform where code meets clarity. Visualize complex algorithms,
                        practice in a real IDE, compete in contests, and prepare for your dream company.
                        <br /><span style={{ color: 'var(--primary-teal)', fontWeight: '600', fontSize: '0.9rem', marginTop: '10px', display: 'block' }}>Created by Aditya Ram</span>
                    </p>


                    <div className="hero-buttons">
                        <Link to="/algorithms" className="btn-primary">
                            Start Visualizing <FaArrowRight size={14} />
                        </Link>
                        <Link to="/contests" className="btn-gold">
                            Join Contest <FaTrophy size={14} />
                        </Link>
                        <Link to="/coding-platform" className="btn-glass">
                            Practice IDE <FaCode size={14} />
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* ———————————————— FEATURED ALGORITHMS ———————————————— */}
            <section className="home-section">
                <Reveal>
                    <div className="section-header">
                        <div className="section-label">📚 Interactive Library</div>
                        <h2 className="section-title">Featured Algorithms</h2>
                        <p className="section-subtitle">Deep dive into the core concepts with our premium visualizers.</p>
                    </div>
                </Reveal>

                <div className="features-grid">
                    {algorithmList.slice(0, 4).map((algo, i) => (
                        <Reveal key={algo.id} delay={i + 1}>
                            <Link to={algo.path} className="feature-card" style={{ textDecoration: 'none' }}>
                                <div className="feature-icon" style={{ 
                                    background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(16,185,129,0.1))',
                                    color: '#3b82f6'
                                }}>
                                    {i % 4 === 0 ? <FaTerminal /> : i % 4 === 1 ? <FaLayerGroup /> : i % 4 === 2 ? <FaNetworkWired /> : <FaBrain />}
                                </div>
                                <h3 className="feature-title">{algo.name}</h3>
                                <p className="feature-desc">{algo.description}</p>
                                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{algo.difficulty}</span>
                                    <span className="learn-more">Learn More <FaChevronRight size={10} /></span>
                                </div>
                            </Link>
                        </Reveal>
                    ))}
                </div>
                
                <Reveal delay={5}>
                    <div style={{ textAlign: 'center', marginTop: '40px' }}>
                        <Link to="/algorithms" className="btn-glass">
                            Explore All Algorithms <FaArrowRight size={14} />
                        </Link>
                    </div>
                </Reveal>
            </section>
            <section className="stats-section">
                <div className="stats-grid">
                    {statsCards.map((s, i) => (
                        <Reveal key={i} delay={i + 1}>
                            <div className="stat-item">
                                <div className="stat-icon" style={{ color: s.color }}>
                                    {s.icon}
                                </div>
                                <div className="stat-number">
                                    {Number.isFinite(s.value) ? s.value.toLocaleString() : '—'}
                                </div>
                                <div className="stat-label">{s.label}</div>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </section>

            {isAuthenticated && (
                <section className="home-section">
                    <Reveal>
                        <div className="section-header">
                            <div className="section-label">👥 Social Coding</div>
                            <h2 className="section-title">Following Activity & Friend Insights</h2>
                            <p className="section-subtitle">Track coders you follow and discover people to learn from.</p>
                        </div>
                    </Reveal>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                        <div className="feature-card" style={{ padding: '18px' }}>
                            <h3 className="feature-title" style={{ marginBottom: '12px' }}>Following Activity</h3>
                            {socialLoading && safeActivity.length === 0 ? (
                                <p className="feature-desc">Loading activity...</p>
                            ) : safeActivity.length === 0 ? (
                                <p className="feature-desc">No recent activity from followed users.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {safeActivity.slice(0, 5).map((item) => (
                                        <Link
                                            key={item?._id || `${item?.activityType}-${item?.createdAt}`}
                                            to={item?.problem?.slug ? `/coding-platform/${item.problem.slug}` : (item?.metadata?.threadLink || '/community')}
                                            style={{ textDecoration: 'none', color: 'inherit' }}
                                        >
                                            <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                <div style={{ fontSize: '0.84rem', color: 'var(--text-primary, #f8fafc)', fontWeight: 600 }}>
                                                    {describeActivity(item)}
                                                </div>
                                                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary, #94a3b8)', marginTop: '4px' }}>
                                                    {relativeTime(item?.createdAt)}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="feature-card" style={{ padding: '18px' }}>
                            <h3 className="feature-title" style={{ marginBottom: '12px' }}>Suggested Coders</h3>
                            {socialLoading && safeSuggested.length === 0 ? (
                                <p className="feature-desc">Loading suggestions...</p>
                            ) : safeSuggested.length === 0 ? (
                                <p className="feature-desc">No suggestions right now.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {safeSuggested.slice(0, 5).map((entry) => {
                                        const userId = String(entry?._id || '');
                                        const isSelf = userId === String(user?._id || user?.id || '');
                                        return (
                                            <div key={entry?._id || entry?.username} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                                <Link to={`/profile/${entry?.username || ''}`} style={{ textDecoration: 'none', color: 'inherit', minWidth: 0 }}>
                                                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary, #f8fafc)' }}>
                                                        {entry?.username || 'Unknown'}
                                                    </div>
                                                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary, #94a3b8)' }}>
                                                        {Number(entry?.problemsSolved || 0)} solved
                                                    </div>
                                                </Link>
                                                <FollowButton
                                                    targetUserId={userId}
                                                    isSelf={isSelf}
                                                    size="sm"
                                                    initialFollowing={Boolean(suggestedFollowState[userId])}
                                                    onStateChange={(nextState) => handleSuggestedFollowStateChange(userId, nextState)}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="feature-card" style={{ padding: '18px' }}>
                            <h3 className="feature-title" style={{ marginBottom: '12px' }}>Friends Leaderboard</h3>
                            {socialLoading && safeFriends.length === 0 ? (
                                <p className="feature-desc">Loading leaderboard...</p>
                            ) : safeFriends.length === 0 ? (
                                <p className="feature-desc">Follow users to build your friends leaderboard.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {safeFriends.slice(0, 5).map((entry) => (
                                        <div key={entry?._id || entry?.rank} style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: '8px', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 700 }}>#{entry?.rank || '-'}</span>
                                            <Link to={`/profile/${entry?.username || ''}`} style={{ textDecoration: 'none', color: 'var(--text-primary, #f8fafc)', fontSize: '0.84rem', fontWeight: 600 }}>
                                                {entry?.username || 'Unknown'} {entry?.isCurrentUser ? '(You)' : ''}
                                            </Link>
                                            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #94a3b8)' }}>
                                                {Number(entry?.problemsSolved || 0)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="feature-card" style={{ padding: '18px' }}>
                            <h3 className="feature-title" style={{ marginBottom: '12px' }}>Daily Challenge Activity</h3>
                            {socialWidgets.dailyChallenge ? (
                                <div style={{ marginBottom: '10px' }}>
                                    <Link to={socialWidgets.dailyChallenge.slug ? `/coding-platform/${socialWidgets.dailyChallenge.slug}` : '/coding-platform'} style={{ color: '#93c5fd', fontSize: '0.84rem', textDecoration: 'none', fontWeight: 600 }}>
                                        {socialWidgets.dailyChallenge.title}
                                    </Link>
                                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary, #94a3b8)' }}>
                                        {socialWidgets.dailyChallenge.difficulty || 'Unknown'} difficulty
                                    </div>
                                </div>
                            ) : (
                                <p className="feature-desc" style={{ marginBottom: '8px' }}>No challenge scheduled for today.</p>
                            )}

                            {safeDailyUsers.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {safeDailyUsers.slice(0, 6).map((entry) => (
                                        <div key={entry?._id || entry?.username} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                            <Link to={`/profile/${entry?.username || ''}`} style={{ textDecoration: 'none', color: 'var(--text-primary, #f8fafc)', fontSize: '0.84rem', fontWeight: 600 }}>
                                                {entry?.username || 'Unknown'}
                                            </Link>
                                            <span style={{ fontSize: '0.74rem', color: entry?.solved ? '#22c55e' : '#f59e0b', fontWeight: 600 }}>
                                                {entry?.solved ? 'Solved ✓' : 'Pending ⏳'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* ———————————————— FINAL CTA ———————————————— */}
            <section className="final-cta">
                <div className="final-cta-bg" />
                <Reveal>
                    <div className="final-cta-content">
                        <h2 className="final-cta-title">
                            Ready to Crack Your<br />
                            <span className="gradient-highlight" data-text="Dream Company?">Dream Company?</span>
                        </h2>
                        <p className="final-cta-subtitle">
                            Join thousands of developers who are building their future with AlgoVerse.
                            Start visualizing, practicing, and competing today.
                        </p>
                        <Link to="/register" className="btn-start-now">
                            <span>Start Now — It's Free <FaArrowRight size={16} /></span>
                        </Link>
                    </div>
                </Reveal>
            </section>

            {/* Mobile Sticky CTA */}
            <div className="mobile-sticky-cta">
                <Link to="/register" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
                    Start Now — Free <FaArrowRight size={14} />
                </Link>
            </div>
        </div>
    );
};

export default Home;
