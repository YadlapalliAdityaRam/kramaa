import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    FaEye, FaCode, FaRobot, FaTrophy, FaRoute, FaMedal,
    FaStar, FaArrowRight, FaChevronRight,
    FaCheckCircle, FaUsers, FaLightbulb, FaFire,
    FaBolt, FaCrown, FaGem, FaShieldAlt, FaAward, FaRocket
} from 'react-icons/fa';
import AnimatedBackground from '../components/common/AnimatedBackground';
import './Home.css';

/* ═══════════════════════════════════════════════════════
   Scroll Reveal Hook
   ═══════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════
   Animated Counter
   ═══════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════
   Feature code previews
   ═══════════════════════════════════════════════════════ */
const CODE_PREVIEWS = {
    'Interactive Algorithm Visualizer': 'bubbleSort(arr) → compare → swap',
    'Built-in Online IDE': 'const solve = (n) => { ... }',
    'AI Code Reviewer': 'AI: "Consider edge case n=0"',
    'Contest Arena': 'timeLeft: 01:45:32 | Rank: #4',
    'Personalized Learning Path': 'progress: ████████░░ 80%',
    'Leaderboard & Ranking': 'rating: 1847 → 1892 (+45)'
};

/* ═══════════════════════════════════════════════════════
   Home Page
   ═══════════════════════════════════════════════════════ */
const Home = () => {
    return (
        <div className="krama-home">
            <AnimatedBackground />

            {/* ────────────── HERO ────────────── */}
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
                        Krama is the ultimate platform where code meets clarity. Visualize complex algorithms,
                        practice in a real IDE, compete in contests, and prepare for your dream company.
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

            {/* ────────────── LIVE STATS ────────────── */}
            <section className="stats-section">
                <div className="stats-grid">
                    {[
                        { target: '10000', suffix: '+', label: 'Problems Solved', icon: <FaCheckCircle /> },
                        { target: '5000', suffix: '+', label: 'Active Users', icon: <FaUsers /> },
                        { target: '200', suffix: '+', label: 'Algorithms Visualized', icon: <FaEye /> },
                        { target: '50', suffix: '+', label: 'Contests Hosted', icon: <FaTrophy /> }
                    ].map((s, i) => (
                        <Reveal key={i} delay={i + 1}>
                            <div className="stat-item">
                                <div className="stat-icon" style={{ color: ['#6366f1', '#10b981', '#f97316', '#ec4899'][i] }}>
                                    {s.icon}
                                </div>
                                <div className="stat-number">
                                    <AnimatedCounter target={s.target} suffix={s.suffix} />
                                </div>
                                <div className="stat-label">{s.label}</div>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* ────────────── FEATURES ────────────── */}
            <section className="home-section">
                <Reveal>
                    <div className="section-header">
                        <div className="section-label">🔥 Features</div>
                        <h2 className="section-title">Everything You Need to Excel</h2>
                        <p className="section-subtitle">From visualization to execution, we cover the entire learning lifecycle.</p>
                    </div>
                </Reveal>

                <div className="features-grid">
                    {[
                        { icon: <FaEye size={24} />, title: 'Interactive Algorithm Visualizer', desc: 'Watch algorithms come alive with step-by-step animations, code tracking, and detailed explanations for 200+ algorithms.', color: '#6366f1' },
                        { icon: <FaCode size={24} />, title: 'Built-in Online IDE', desc: 'Write, run, and debug code in 5+ languages directly in the browser with our powerful coding environment.', color: '#10b981' },
                        { icon: <FaRobot size={24} />, title: 'AI Code Reviewer', desc: 'Get instant feedback on your solutions with our Gemini-powered AI that reviews code quality, complexity, and edge cases.', color: '#8b5cf6' },
                        { icon: <FaTrophy size={24} />, title: 'Contest Arena', desc: 'Compete in timed coding challenges, climb the leaderboard, and earn badges to showcase your skills.', color: '#f59e0b' },
                        { icon: <FaRoute size={24} />, title: 'Personalized Learning Path', desc: 'Track your progress with smart analytics and get personalized recommendations based on your strengths.', color: '#ec4899' },
                        { icon: <FaMedal size={24} />, title: 'Leaderboard & Ranking', desc: 'Compete globally, earn rating points, unlock badges, and rise through the ranks to prove your expertise.', color: '#3b82f6' }
                    ].map((f, i) => (
                        <Reveal key={i} delay={Math.min(i + 1, 5)}>
                            <motion.div
                                className="feature-card"
                                style={{ '--card-accent': f.color, '--card-accent-glow': `${f.color}30` }}
                                whileHover={{ y: -8 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                            >
                                <div className="feature-icon" style={{ background: `${f.color}15`, color: f.color }}>
                                    {f.icon}
                                </div>
                                <h3 className="feature-title">{f.title}</h3>
                                <p className="feature-desc">{f.desc}</p>
                                <div className="feature-code-preview">
                                    {CODE_PREVIEWS[f.title] || ''}
                                </div>
                            </motion.div>
                        </Reveal>
                    ))}
                </div>
            </section>

            <div className="home-divider" />

            {/* ────────────── HOW IT WORKS ────────────── */}
            <section className="home-section">
                <Reveal>
                    <div className="section-header">
                        <div className="section-label">🧠 How It Works</div>
                        <h2 className="section-title">Three Steps to Mastery</h2>
                        <p className="section-subtitle">Our proven methodology turns complex algorithms into visual, intuitive concepts.</p>
                    </div>
                </Reveal>

                <div className="steps-container">
                    {[
                        { num: '1', title: 'Learn Visually', desc: 'Watch algorithms animate step-by-step with synchronized code highlighting and detailed explanations.', color: '#6366f1', icon: <FaLightbulb /> },
                        { num: '2', title: 'Practice Instantly', desc: 'Jump straight into our built-in IDE. Solve curated problems and get AI-powered feedback on your code.', color: '#f97316', icon: <FaFire /> },
                        { num: '3', title: 'Compete & Climb', desc: 'Join live contests, earn ranking points, and climb the global leaderboard. Prove your skills under pressure.', color: '#10b981', icon: <FaBolt /> }
                    ].map((step, i) => (
                        <Reveal key={i} delay={i + 1}>
                            <div className="step-card">
                                <div className="step-number" style={{ background: `${step.color}15`, color: step.color, borderColor: `${step.color}40` }}>
                                    {step.num}
                                </div>
                                <h3 className="step-title">{step.title}</h3>
                                <p className="step-desc">{step.desc}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </section>

            <div className="home-divider" />

            {/* ────────────── ACHIEVEMENT BADGES ────────────── */}
            <section className="home-section">
                <Reveal>
                    <div className="section-header">
                        <div className="section-label">🏆 Achievements</div>
                        <h2 className="section-title">Unlock Badges & Rewards</h2>
                        <p className="section-subtitle">Earn recognition for your progress. Every milestone counts.</p>
                    </div>
                </Reveal>

                <Reveal>
                    <div className="badges-grid">
                        {[
                            { icon: '🔥', label: 'Streak', tip: '7-day coding streak', color: '#f59e0b' },
                            { icon: '⚡', label: 'Speed', tip: 'Solve under 5 min', color: '#6366f1' },
                            { icon: '🎯', label: 'Accuracy', tip: '10 problems in a row', color: '#10b981' },
                            { icon: '👑', label: 'Champion', tip: 'Win a contest', color: '#ec4899' },
                            { icon: '💎', label: 'Elite', tip: 'Reach 2000 rating', color: '#8b5cf6' },
                            { icon: '🛡️', label: 'Guardian', tip: 'Help 50 users', color: '#3b82f6' },
                            { icon: '🏅', label: 'Master', tip: 'Solve 500 problems', color: '#f97316' },
                            { icon: '🌟', label: 'All-Star', tip: 'Complete all categories', color: '#fbbf24' }
                        ].map((b, i) => (
                            <motion.div
                                key={i}
                                className="badge-item"
                                whileHover={{ scale: 1.08 }}
                                transition={{ type: 'spring', stiffness: 400 }}
                            >
                                <div className="badge-tooltip">{b.tip}</div>
                                <span className="badge-icon">{b.icon}</span>
                                <span className="badge-label">{b.label}</span>
                            </motion.div>
                        ))}
                    </div>
                </Reveal>
            </section>

            <div className="home-divider" />

            {/* ────────────── TESTIMONIALS ────────────── */}
            <section className="home-section">
                <Reveal>
                    <div className="section-header">
                        <div className="section-label">💬 Testimonials</div>
                        <h2 className="section-title">Loved by Developers</h2>
                        <p className="section-subtitle">Hear from students and developers who transformed their coding journey with Krama.</p>
                    </div>
                </Reveal>

                <div className="testimonials-grid">
                    {[
                        { name: 'Arjun Patel', role: 'SDE @ Google', avatar: 'A', color: '#6366f1', quote: 'Krama\'s visualizations made complex algorithms click instantly. I cracked my Google interview in just 3 months of prep.' },
                        { name: 'Sneha Reddy', role: 'CS Student, IIT Delhi', avatar: 'S', color: '#ec4899', quote: 'The step-by-step animations are incredible. I finally understand how Dijkstra\'s and DP algorithms actually work!' },
                        { name: 'Rahul Kumar', role: 'Backend Dev @ Amazon', avatar: 'R', color: '#f59e0b', quote: 'The contest arena and leaderboard kept me motivated. The AI code reviewer caught bugs I would have never found on my own.' }
                    ].map((t, i) => (
                        <Reveal key={i} delay={i + 1}>
                            <div className="testimonial-card">
                                <div className="testimonial-header">
                                    <div className="testimonial-avatar" style={{ background: `${t.color}25`, color: t.color }}>
                                        {t.avatar}
                                    </div>
                                    <div className="testimonial-info">
                                        <h4>{t.name}</h4>
                                        <p>{t.role}</p>
                                    </div>
                                </div>
                                <div className="testimonial-stars">
                                    {[...Array(5)].map((_, j) => <FaStar key={j} />)}
                                </div>
                                <p className="testimonial-quote">"{t.quote}"</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </section>

            <div className="home-divider" />

            {/* ────────────── LEADERBOARD PREVIEW ────────────── */}
            <section className="home-section">
                <Reveal>
                    <div className="section-header">
                        <div className="section-label">📈 Leaderboard</div>
                        <h2 className="section-title">Top Performers</h2>
                        <p className="section-subtitle">See who's leading the pack. Will you be next?</p>
                    </div>
                </Reveal>

                <Reveal>
                    <div className="leaderboard-preview">
                        {[
                            { rank: 1, name: 'CodeNinja42', score: 9850, badge: 'Grandmaster', badgeColor: '#fbbf24', avatarBg: '#f59e0b', cls: 'lb-gold' },
                            { rank: 2, name: 'AlgoQueen', score: 9420, badge: 'Master', badgeColor: '#94a3b8', avatarBg: '#6366f1', cls: 'lb-silver' },
                            { rank: 3, name: 'ByteStorm', score: 8990, badge: 'Expert', badgeColor: '#cd7f32', avatarBg: '#ec4899', cls: 'lb-bronze' },
                            { rank: 4, name: 'DataWizard', score: 8650, badge: 'Expert', badgeColor: '#64748b', avatarBg: '#10b981', cls: '' },
                            { rank: 5, name: 'StackOverflow_', score: 8210, badge: 'Specialist', badgeColor: '#64748b', avatarBg: '#3b82f6', cls: '' }
                        ].map((u, i) => (
                            <div key={i} className={`lb-row ${u.cls}`}>
                                <div className="lb-rank" style={{
                                    background: i < 3 ? `${u.badgeColor}20` : 'rgba(255,255,255,0.05)',
                                    color: i < 3 ? u.badgeColor : 'rgba(255,255,255,0.5)'
                                }}>
                                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${u.rank}`}
                                </div>
                                <div className="lb-user">
                                    <div className="lb-avatar" style={{ background: `${u.avatarBg}30`, color: u.avatarBg }}>
                                        {u.name.charAt(0)}
                                    </div>
                                    <span className="lb-name">{u.name}</span>
                                </div>
                                <span className="lb-badge" style={{ background: `${u.badgeColor}15`, color: u.badgeColor }}>
                                    {u.badge}
                                </span>
                                <span className="lb-score">{u.score.toLocaleString()}</span>
                            </div>
                        ))}

                        <div style={{ textAlign: 'center', marginTop: '24px' }}>
                            <Link to="/leaderboard" className="btn-glass" style={{ padding: '12px 28px', fontSize: '0.9rem' }}>
                                View Full Leaderboard <FaChevronRight size={12} />
                            </Link>
                        </div>
                    </div>
                </Reveal>
            </section>

            {/* ────────────── FINAL CTA ────────────── */}
            <section className="final-cta">
                <div className="final-cta-bg" />
                <Reveal>
                    <div className="final-cta-content">
                        <h2 className="final-cta-title">
                            Ready to Crack Your<br />
                            <span className="gradient-highlight" data-text="Dream Company?">Dream Company?</span>
                        </h2>
                        <p className="final-cta-subtitle">
                            Join thousands of developers who are building their future with Krama.
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
