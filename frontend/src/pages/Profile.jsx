import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import { logout } from '../redux/slices/authSlice';
import {
    FaGithub, FaLinkedin, FaTwitter, FaGlobe, FaMapMarkerAlt, FaUniversity, FaEdit,
    FaCode, FaFire, FaTrophy, FaCalendarAlt, FaEnvelope, FaChartBar, FaBookmark,
    FaStar, FaMedal, FaClock, FaMemory, FaBolt, FaChevronDown, FaShareAlt, FaComment
} from 'react-icons/fa';
import EditProfileModal from '../components/profile/EditProfileModal';
import ReportModal from '../components/common/ReportModal';
import { FaFlag } from 'react-icons/fa';

// ==========================================
// SUB-COMPONENTS
// ==========================================

const StatCard = ({ label, value, color, icon, subtitle, onClick, active = false }) => {
    const isClickable = typeof onClick === 'function';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={isClickable ? { y: -3 } : {}}
            onClick={onClick}
            className="glass-panel"
            style={{
                padding: '20px',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                cursor: isClickable ? 'pointer' : 'default',
                border: active ? `1px solid ${color}66` : '1px solid rgba(255,255,255,0.08)'
            }}
        >
            <div style={{ fontSize: '1.5rem', color }}>{icon}</div>
            <h3 style={{ margin: 0, fontSize: '2rem', color: 'var(--text-primary, white)', fontWeight: '700' }}>{value}</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.85rem' }}>{label}</p>
            {subtitle && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #666)' }}>{subtitle}</span>}
        </motion.div>
    );
};

// --- Activity Heatmap ---
const ActivityHeatmap = ({ heatmap, selectedYear, onYearChange }) => {
    const CELL = 12;
    const GAP = 3;
    const MONTH_GAP = 8;
    const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const DAY_LABEL_WIDTH = 34;

    const toDateKey = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const addDays = (date, amount) => {
        const next = new Date(date);
        next.setDate(next.getDate() + amount);
        return next;
    };

    const getMondayIndex = (day) => (day + 6) % 7; // Mon=0 ... Sun=6

    const today = new Date();
    const year = selectedYear || today.getFullYear();
    const isCurrentYear = year === today.getFullYear();
    const rawHeatmap = heatmap instanceof Map ? Object.fromEntries(heatmap) : (heatmap || {});

    const startDay = new Date(year, 0, 1);
    const endDay = isCurrentYear ? today : new Date(year, 11, 31);

    const gridStart = addDays(startDay, -getMondayIndex(startDay.getDay()));
    const gridEnd = addDays(endDay, 6 - getMondayIndex(endDay.getDay()));

    const weeks = [];
    let weekIndex = 0;

    for (let cursor = new Date(gridStart); cursor <= gridEnd; cursor = addDays(cursor, 7), weekIndex++) {
        const week = [];

        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const currentDate = addDays(cursor, dayOffset);
            const inRange = currentDate >= startDay && currentDate <= endDay;
            const isFuture = currentDate > today;
            const key = toDateKey(currentDate);
            const count = (inRange && !isFuture) ? Number(rawHeatmap[key] || 0) : 0;

            week.push({ key, count, inRange, isFuture });

        }

        weeks.push(week);
    }

    const monthBands = [];
    for (let month = 0; month < 12; month++) {
        let firstWeek = -1;
        let lastWeek = -1;

        for (let w = 0; w < weeks.length; w++) {
            const hasMonthDay = weeks[w].some((day) => {
                if (!day.inRange) return false;
                const date = new Date(day.key);
                return date.getMonth() === month;
            });

            if (hasMonthDay) {
                if (firstWeek === -1) firstWeek = w;
                lastWeek = w;
            }
        }

        if (firstWeek !== -1 && lastWeek !== -1) {
            monthBands.push({
                label: MONTH_NAMES[month],
                startWeek: firstWeek,
                endWeek: lastWeek
            });
        }
    }

    const monthStartWeeks = monthBands
        .slice(1)
        .map((band) => band.startWeek)
        .sort((a, b) => a - b);
    const monthStartWeekSet = new Set(monthStartWeeks);

    const countMonthStartsBeforeWeek = (targetWeek) => {
        let count = 0;
        for (const startWeek of monthStartWeeks) {
            if (startWeek < targetWeek) count++;
            else break;
        }
        return count;
    };

    const getWeekLeft = (week) => {
        return week * (CELL + GAP) + countMonthStartsBeforeWeek(week) * MONTH_GAP;
    };

    const gridWidth = Math.max(weeks.length * (CELL + GAP) - GAP + monthStartWeeks.length * MONTH_GAP, 0);
    const totalInYear = weeks
        .flat()
        .reduce((sum, day) => (day.inRange && !day.isFuture ? sum + day.count : sum), 0);

    const getColor = (count) => {
        if (count === 0) return 'rgba(255,255,255,0.06)';
        if (count <= 2) return '#0e4429';
        if (count <= 5) return '#006d32';
        if (count <= 10) return '#26a641';
        return '#39d353';
    };

    const yearOptions = [];
    for (let y = today.getFullYear(); y >= today.getFullYear() - 3; y--) {
        yearOptions.push(y);
    }

    return (
        <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #9ca3af)' }}>
                    {totalInYear} submissions in {year}
                </span>
                <select
                    value={year}
                    onChange={(e) => onYearChange(parseInt(e.target.value))}
                    style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '6px',
                        color: 'var(--text-primary, white)',
                        padding: '4px 8px',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                    }}
                >
                    {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            <div style={{ minWidth: `${DAY_LABEL_WIDTH + gridWidth}px` }}>
                <div style={{ marginLeft: `${DAY_LABEL_WIDTH}px`, marginBottom: '4px', position: 'relative', height: '14px' }}>
                    {monthBands.map((band) => {
                        const bandStart = getWeekLeft(band.startWeek);
                        const bandEnd = getWeekLeft(band.endWeek) + CELL;
                        const center = (bandStart + bandEnd) / 2;

                        return (
                            <span
                                key={`${band.label}-${band.startWeek}`}
                                style={{
                                    position: 'absolute',
                                    left: `${center}px`,
                                    transform: 'translateX(-50%)',
                                    fontSize: '0.68rem',
                                    color: 'var(--text-muted, #888)',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {band.label}
                            </span>
                        );
                    })}
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                    <div style={{ width: `${DAY_LABEL_WIDTH}px`, display: 'flex', flexDirection: 'column', gap: `${GAP}px` }}>
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label, idx) => (
                            <div
                                key={idx}
                                style={{
                                    height: `${CELL}px`,
                                    fontSize: '0.62rem',
                                    color: 'var(--text-muted, #666)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    paddingRight: '3px'
                                }}
                            >
                                {label}
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: `${GAP}px` }}>
                        {weeks.map((week, weekIdx) => (
                            <div
                                key={weekIdx}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: `${GAP}px`,
                                    marginLeft: monthStartWeekSet.has(weekIdx) ? `${MONTH_GAP}px` : 0
                                }}
                            >
                                {week.map((day) => (
                                    <div
                                        key={day.key}
                                        title={day.inRange && !day.isFuture ? `${day.key}: ${day.count} submissions` : ''}
                                        style={{
                                            width: `${CELL}px`,
                                            height: `${CELL}px`,
                                            borderRadius: '2px',
                                            backgroundColor: day.inRange && !day.isFuture ? getColor(day.count) : 'transparent',
                                            border: day.inRange ? '1px solid rgba(255,255,255,0.03)' : '1px solid transparent'
                                        }}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted, #666)', marginRight: '4px' }}>Less</span>
                {[0, 1, 3, 6, 11].map((value, idx) => (
                    <div
                        key={idx}
                        style={{ width: `${CELL}px`, height: `${CELL}px`, borderRadius: '2px', backgroundColor: getColor(value) }}
                    />
                ))}
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted, #666)', marginLeft: '4px' }}>More</span>
            </div>
        </div>
    );
};

// --- Language Stats (donut-style) ---
const LanguageStats = ({ stats }) => {
    if (!stats || Object.keys(stats).length === 0) return <p style={{ color: 'var(--text-muted, #888)' }}>No language data yet.</p>;

    const entries = Object.entries(stats).sort(([, a], [, b]) => b.solved - a.solved);
    const totalSolved = entries.reduce((acc, [, curr]) => acc + curr.solved, 0);
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#22c55e', '#eab308'];

    return (
        <div>
            {/* Mini donut representation */}
            <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '16px' }}>
                {entries.map(([lang, data], i) => (
                    <div key={lang} style={{
                        width: `${(data.solved / (totalSolved || 1)) * 100}%`,
                        background: colors[i % colors.length],
                        minWidth: data.solved > 0 ? '4px' : 0
                    }} />
                ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {entries.map(([lang, data], i) => (
                    <div key={lang} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: colors[i % colors.length] }} />
                            <span style={{ textTransform: 'capitalize' }}>{lang}</span>
                        </div>
                        <span style={{ color: 'var(--text-muted, #888)' }}>
                            {data.solved} ({totalSolved > 0 ? Math.round((data.solved / totalSolved) * 100) : 0}%)
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Difficulty Breakdown ---
const DifficultyBreakdown = ({ stats }) => {
    const easy = stats.easySolved || 0;
    const medium = stats.mediumSolved || 0;
    const hard = stats.hardSolved || 0;
    const totalSolved = easy + medium + hard;
    const total = totalSolved || 1;
    const [activeKey, setActiveKey] = useState(null);

    const breakdown = [
        { key: 'easy', label: 'Easy', val: easy, color: '#22c55e' },
        { key: 'medium', label: 'Medium', val: medium, color: '#eab308' },
        { key: 'hard', label: 'Hard', val: hard, color: '#ef4444' }
    ].map((item) => ({
        ...item,
        percentile: totalSolved > 0 ? Math.round((item.val / totalSolved) * 1000) / 10 : 0
    }));

    const activeItem = breakdown.find((item) => item.key === activeKey) || null;

    return (
        <div>
            <div
                style={{ display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', marginBottom: '10px' }}
                onMouseLeave={() => setActiveKey(null)}
            >
                {breakdown.map((item) => (
                    item.val > 0 ? (
                        <button
                            key={item.key}
                            type="button"
                            title={`${item.label}: ${item.percentile}% percentile`}
                            onMouseEnter={() => setActiveKey(item.key)}
                            onFocus={() => setActiveKey(item.key)}
                            onTouchStart={() => setActiveKey(item.key)}
                            onClick={() => setActiveKey((prev) => (prev === item.key ? null : item.key))}
                            style={{
                                width: `${(item.val / total) * 100}%`,
                                background: item.color,
                                border: 'none',
                                padding: 0,
                                margin: 0,
                                cursor: 'pointer'
                            }}
                        />
                    ) : null
                ))}
            </div>

            <div style={{ minHeight: '20px', marginBottom: '8px', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-secondary, #9ca3af)' }}>
                {activeItem
                    ? `${activeItem.label}: ${activeItem.val} solved (${activeItem.percentile}% percentile)`
                    : 'Tap or hover a difficulty segment to see percentile'
                }
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                {breakdown.map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        onMouseEnter={() => setActiveKey(item.key)}
                        onFocus={() => setActiveKey(item.key)}
                        onTouchStart={() => setActiveKey(item.key)}
                        onClick={() => setActiveKey((prev) => (prev === item.key ? null : item.key))}
                        style={{
                            textAlign: 'center',
                            border: 'none',
                            background: 'transparent',
                            color: 'inherit',
                            cursor: 'pointer'
                        }}
                    >
                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: item.color }}>{item.val}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #888)' }}>{item.label}</div>
                        <div style={{ fontSize: '0.66rem', color: '#6b7280', marginTop: '2px' }}>{item.percentile}%</div>
                    </button>
                ))}
            </div>
        </div>
    );
};

// --- Badges Grid ---
const BadgesSection = ({ badges, loading }) => {
    if (loading || !badges) return <p style={{ color: 'var(--text-muted, #888)' }}>Loading badges...</p>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>Badges</h3>
                <span style={{ color: 'var(--text-muted, #888)', fontSize: '0.85rem' }}>
                    {badges.earned}/{badges.total} earned
                </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px' }}>
                {badges.badges?.map(badge => (
                    <motion.div
                        key={badge.id}
                        whileHover={badge.earned ? { scale: 1.08 } : {}}
                        style={{
                            padding: '12px 8px', borderRadius: '12px', textAlign: 'center',
                            background: badge.earned ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${badge.earned ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)'}`,
                            opacity: badge.earned ? 1 : 0.4,
                            cursor: 'default'
                        }}
                        title={badge.description}
                    >
                        <div style={{ fontSize: '1.8rem', marginBottom: '4px', filter: badge.earned ? 'none' : 'grayscale(1)' }}>
                            {badge.icon}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: badge.earned ? 'white' : '#666', fontWeight: '500' }}>
                            {badge.name}
                        </div>
                        {badge.earned && (
                            <div style={{
                                fontSize: '0.55rem', marginTop: '4px',
                                color: badge.tier === 'platinum' ? '#e5e7eb' : badge.tier === 'gold' ? '#eab308' : badge.tier === 'silver' ? '#9ca3af' : '#cd7f32',
                                textTransform: 'uppercase', fontWeight: 'bold'
                            }}>
                                {badge.tier}
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

// --- Recent Submissions ---
const RecentSubmissions = ({ submissions }) => {
    if (!submissions || submissions.length === 0) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {submissions.map(sub => (
                <Link
                    key={sub._id}
                    to={sub.problem?.slug ? `/coding-platform/${sub.problem.slug}` : '#'}
                    style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)',
                        textDecoration: 'none', color: 'inherit', transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                            color: sub.status === 'accepted' ? '#22c55e' : '#ef4444',
                            fontWeight: 'bold', fontSize: '0.8rem'
                        }}>
                            {sub.status === 'accepted' ? '✓' : '✗'}
                        </span>
                        <span style={{ fontSize: '0.9rem' }}>{sub.problem?.title || 'Unknown'}</span>
                        <span style={{
                            padding: '1px 6px', borderRadius: '4px', fontSize: '0.65rem',
                            background: sub.problem?.difficulty === 'Easy' ? 'rgba(34,197,94,0.15)' : sub.problem?.difficulty === 'Medium' ? 'rgba(234,179,8,0.15)' : 'rgba(239,68,68,0.15)',
                            color: sub.problem?.difficulty === 'Easy' ? '#22c55e' : sub.problem?.difficulty === 'Medium' ? '#eab308' : '#ef4444'
                        }}>
                            {sub.problem?.difficulty}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: 'var(--text-muted, #888)' }}>
                        <span style={{ fontFamily: 'monospace' }}>{sub.language}</span>
                        {sub.runtime != null && <span>{sub.runtime}ms</span>}
                        <span>{new Date(sub.createdAt).toLocaleDateString()}</span>
                    </div>
                </Link>
            ))}
        </div>
    );
};

const SolvedProblemsList = ({ solvedProblems }) => {
    if (!solvedProblems || solvedProblems.length === 0) {
        return <p style={{ color: 'var(--text-muted, #888)' }}>No solved problems yet.</p>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {solvedProblems.map(problem => (
                <Link
                    key={problem._id}
                    to={problem.slug ? `/coding-platform/${problem.slug}` : '#'}
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.03)',
                        textDecoration: 'none',
                        color: 'inherit',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '0.9rem' }}>✓</span>
                        <span style={{ fontSize: '0.9rem' }}>{problem.title}</span>
                        <span style={{
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontSize: '0.65rem',
                            background: problem.difficulty === 'Easy' ? 'rgba(34,197,94,0.15)' : problem.difficulty === 'Medium' ? 'rgba(234,179,8,0.15)' : 'rgba(239,68,68,0.15)',
                            color: problem.difficulty === 'Easy' ? '#22c55e' : problem.difficulty === 'Medium' ? '#eab308' : '#ef4444'
                        }}>
                            {problem.difficulty}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#34d399' }}>
                            {problem.submissionAcceptanceRate ?? 0}% acceptance
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', color: 'var(--text-muted, #888)' }}>
                        <span>{problem.acceptedCount || 1} accepted</span>
                        <span>{problem.lastSolvedAt ? new Date(problem.lastSolvedAt).toLocaleDateString() : '-'}</span>
                    </div>
                </Link>
            ))}
        </div>
    );
};

const StarredProblemsList = ({ problems }) => {
    if (!problems || problems.length === 0) {
        return <p style={{ color: 'var(--text-muted, #888)' }}>No saved problems yet.</p>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {problems.map((problem) => (
                <Link
                    key={problem._id}
                    to={problem.slug ? `/coding-platform/${problem.slug}` : `/coding-platform/${problem._id}`}
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.03)',
                        textDecoration: 'none',
                        color: 'inherit',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ color: '#facc15', fontWeight: 'bold', fontSize: '0.9rem' }}>★</span>
                        <span style={{ fontSize: '0.9rem' }}>{problem.title || 'Untitled problem'}</span>
                        <span style={{
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontSize: '0.65rem',
                            background: problem.difficulty === 'Easy' ? 'rgba(34,197,94,0.15)' : problem.difficulty === 'Medium' ? 'rgba(234,179,8,0.15)' : 'rgba(239,68,68,0.15)',
                            color: problem.difficulty === 'Easy' ? '#22c55e' : problem.difficulty === 'Medium' ? '#eab308' : '#ef4444'
                        }}>
                            {problem.difficulty || 'Unknown'}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', color: 'var(--text-muted, #888)' }}>
                        <span>{Array.isArray(problem.topics) ? problem.topics.slice(0, 2).join(', ') : '-'}</span>
                    </div>
                </Link>
            ))}
        </div>
    );
};

const formatSubmissionStatus = (status) => {
    if (!status) return 'Pending';
    return status
        .toString()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getSubmissionStatusColor = (status) => {
    const normalized = status?.toString().toLowerCase();
    if (normalized === 'accepted') return '#22c55e';
    if (normalized === 'pending' || normalized === 'running') return '#f59e0b';
    return '#ef4444';
};

const formatShortDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const formatDateTime = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getDifficultyStyle = (difficulty) => {
    if (difficulty === 'Easy') return { background: 'rgba(34,197,94,0.15)', color: '#22c55e' };
    if (difficulty === 'Medium') return { background: 'rgba(234,179,8,0.15)', color: '#eab308' };
    if (difficulty === 'Hard') return { background: 'rgba(239,68,68,0.15)', color: '#ef4444' };
    return { background: 'rgba(156,163,175,0.15)', color: 'var(--text-secondary, #9ca3af)' };
};

const getTopicBubbleStyle = (masteryScore) => {
    if (masteryScore >= 75) {
        return {
            background: 'rgba(34,197,94,0.16)',
            border: '1px solid rgba(74,222,128,0.4)',
            color: '#4ade80'
        };
    }
    if (masteryScore >= 45) {
        return {
            background: 'rgba(234,179,8,0.16)',
            border: '1px solid rgba(250,204,21,0.35)',
            color: '#facc15'
        };
    }
    return {
        background: 'rgba(148,163,184,0.16)',
        border: '1px solid rgba(148,163,184,0.3)',
        color: '#cbd5e1'
    };
};

const TopicBubbleCloud = ({ topics = [], maxItems = 18, compact = false }) => {
    const sorted = [...topics]
        .sort((a, b) => {
            if ((b.solvedProblems || 0) !== (a.solvedProblems || 0)) {
                return (b.solvedProblems || 0) - (a.solvedProblems || 0);
            }
            if ((b.totalSubmissions || 0) !== (a.totalSubmissions || 0)) {
                return (b.totalSubmissions || 0) - (a.totalSubmissions || 0);
            }
            return (a.topic || '').localeCompare(b.topic || '');
        })
        .slice(0, maxItems);

    if (sorted.length === 0) {
        return <p style={{ margin: 0, color: 'var(--text-secondary, #9ca3af)', fontSize: '0.85rem' }}>No topic activity yet.</p>;
    }

    const weights = sorted.map((topic) => Math.max(topic.solvedProblems || 0, Math.ceil((topic.totalSubmissions || 0) / 2), 1));
    const maxWeight = Math.max(...weights, 1);

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: compact ? '8px' : '10px' }}>
            {sorted.map((topic) => {
                const style = getTopicBubbleStyle(topic.masteryScore || 0);
                const weight = Math.max(topic.solvedProblems || 0, Math.ceil((topic.totalSubmissions || 0) / 2), 1);
                const minSize = compact ? 58 : 72;
                const sizeBoost = compact ? 30 : 46;
                const size = Math.round(minSize + ((weight / maxWeight) * sizeBoost));
                const label = (topic.topic || '').length > (compact ? 16 : 20)
                    ? `${(topic.topic || '').slice(0, compact ? 16 : 20)}...`
                    : topic.topic;
                const subtitle = `${topic.solvedProblems || 0}/${topic.totalProblems || 0}`;

                return (
                    <div
                        key={topic.topic}
                        title={`${topic.topic}: ${topic.solvedProblems || 0}/${topic.totalProblems || 0} solved, ${topic.acceptanceRate || 0}% acceptance`}
                        style={{
                            width: `${size}px`,
                            height: `${size}px`,
                            borderRadius: '999px',
                            padding: compact ? '6px' : '8px',
                            ...style,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            textAlign: 'center',
                            lineHeight: 1.15
                        }}
                    >
                        <span style={{
                            fontSize: compact ? '0.68rem' : '0.76rem',
                            fontWeight: 600,
                            maxWidth: '100%',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                        }}>
                            {label}
                        </span>
                        <span style={{ fontSize: compact ? '0.64rem' : '0.68rem', opacity: 0.9 }}>
                            {subtitle}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

const ProgressDetailsPanel = ({
    rows,
    loading,
    hasMore,
    loadingMore,
    onLoadMore,
    onClose,
    stats,
    totalSubmissions,
    acceptanceRate,
    topicProgress = []
}) => {
    const [showAllTopics, setShowAllTopics] = useState(false);
    const [expandedSubmissionRows, setExpandedSubmissionRows] = useState({});
    const [viewportWidth, setViewportWidth] = useState(() => (
        typeof window !== 'undefined' ? window.innerWidth : 1400
    ));
    const easy = stats?.easySolved || 0;
    const medium = stats?.mediumSolved || 0;
    const hard = stats?.hardSolved || 0;
    const solvedTotal = stats?.totalSolved || (easy + medium + hard);
    const isMobile = viewportWidth <= 768;

    useEffect(() => {
        const onResize = () => setViewportWidth(window.innerWidth);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    return (
        <div className="glass-panel" style={{ padding: isMobile ? '14px' : '20px', borderRadius: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.9fr) minmax(280px, 1fr)', gap: '18px' }}>
                <div className="glass-panel" style={{ padding: '16px', borderRadius: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '8px', flexWrap: 'wrap' }}>
                        <h3 style={{ margin: 0, fontSize: '1.55rem' }}>Practice History</h3>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                border: '1px solid rgba(255,255,255,0.15)',
                                borderRadius: '8px',
                                background: 'transparent',
                                color: 'var(--text-secondary, #9ca3af)',
                                fontSize: '0.8rem',
                                padding: '6px 12px',
                                cursor: 'pointer'
                            }}
                        >
                            Close
                        </button>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', minWidth: isMobile ? '560px' : '620px', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary, #9ca3af)', fontSize: '0.82rem', textAlign: 'left' }}>
                                    <th style={{ padding: '10px 8px' }}>Last Submitted</th>
                                    <th style={{ padding: '10px 8px' }}>Problem</th>
                                    <th style={{ padding: '10px 8px' }}>Last Result</th>
                                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>Submissions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '16px 8px', color: 'var(--text-muted, #888)' }}>Loading submissions...</td>
                                    </tr>
                                ) : rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '16px 8px', color: 'var(--text-muted, #888)' }}>No submission history yet.</td>
                                    </tr>
                                ) : (
                                    rows.map((row) => {
                                        const difficultyStyle = getDifficultyStyle(row.problem?.difficulty);
                                        const statusColor = getSubmissionStatusColor(row.lastResult);
                                        const problemLink = row.problem?.slug ? `/coding-platform/${row.problem.slug}` : '#';
                                        const rowSubmissions = Array.isArray(row.submissions) ? row.submissions : [];
                                        const canExpand = rowSubmissions.length > 0;
                                        const isExpanded = Boolean(expandedSubmissionRows[row.id]);
                                        const solvedByHistory = Boolean(
                                            row?.isSolved ||
                                            Number(row?.acceptedCount || 0) > 0 ||
                                            Number(row?.statusBreakdown?.accepted || 0) > 0 ||
                                            row?.lastResult?.toString().toLowerCase() === 'accepted'
                                        );

                                        return (
                                            <React.Fragment key={row.id}>
                                                <tr style={{ borderBottom: isExpanded ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                                                    <td style={{ padding: '11px 8px', color: 'var(--text-primary, #d1d5db)', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                                                        {formatShortDate(row.lastSubmittedAt)}
                                                    </td>
                                                    <td style={{ padding: '11px 8px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                            {solvedByHistory && (
                                                                <span
                                                                    title="Solved"
                                                                    style={{ color: '#22c55e', fontSize: '0.95rem', fontWeight: '700', lineHeight: 1 }}
                                                                >
                                                                    ✓
                                                                </span>
                                                            )}
                                                            <Link
                                                                to={problemLink}
                                                                style={{
                                                                    color: 'var(--text-primary, #f3f4f6)',
                                                                    fontWeight: '600',
                                                                    textDecoration: 'none',
                                                                    fontSize: '0.93rem'
                                                                }}
                                                            >
                                                                {row.problem?.title || 'Unknown Problem'}
                                                            </Link>
                                                            <span
                                                                style={{
                                                                    padding: '2px 8px',
                                                                    borderRadius: '999px',
                                                                    fontSize: '0.68rem',
                                                                    ...difficultyStyle
                                                                }}
                                                            >
                                                                {row.problem?.difficulty || 'Unknown'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '11px 8px', fontSize: '0.9rem', color: statusColor }}>
                                                        {formatSubmissionStatus(row.lastResult)}
                                                    </td>
                                                    <td style={{ padding: '11px 8px', textAlign: 'center', color: 'var(--text-primary, #d1d5db)', fontSize: '0.92rem' }}>
                                                        {canExpand ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => setExpandedSubmissionRows((prev) => ({ ...prev, [row.id]: !prev[row.id] }))}
                                                                style={{
                                                                    border: '1px solid rgba(255,255,255,0.12)',
                                                                    borderRadius: '8px',
                                                                    background: 'rgba(255,255,255,0.04)',
                                                                    color: 'var(--text-primary, #d1d5db)',
                                                                    padding: '4px 8px',
                                                                    fontSize: '0.82rem',
                                                                    cursor: 'pointer',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '5px'
                                                                }}
                                                            >
                                                                <span>{row.submissionsCount}</span>
                                                                <FaChevronDown
                                                                    style={{
                                                                        fontSize: '0.68rem',
                                                                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                                                        transition: 'transform 0.2s'
                                                                    }}
                                                                />
                                                            </button>
                                                        ) : (
                                                            row.submissionsCount
                                                        )}
                                                    </td>
                                                </tr>

                                                {isExpanded && (
                                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <td colSpan={4} style={{ padding: '0 8px 12px' }}>
                                                            <div style={{
                                                                margin: '2px 0 0',
                                                                border: '1px solid rgba(255,255,255,0.08)',
                                                                borderRadius: '10px',
                                                                background: 'rgba(255,255,255,0.02)',
                                                                overflowX: 'auto'
                                                            }}>
                                                                <table style={{ width: '100%', minWidth: isMobile ? '640px' : '760px', borderCollapse: 'collapse' }}>
                                                                    <thead>
                                                                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontSize: '0.76rem', textAlign: 'left' }}>
                                                                            <th style={{ padding: '8px 10px' }}>Problem</th>
                                                                            <th style={{ padding: '8px 10px' }}>Language</th>
                                                                            <th style={{ padding: '8px 10px' }}>Time</th>
                                                                            <th style={{ padding: '8px 10px' }}>Memory</th>
                                                                            <th style={{ padding: '8px 10px' }}>Date</th>
                                                                            <th style={{ padding: '8px 10px' }}>Status</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {rowSubmissions.map((sub) => {
                                                                            const subProblemLink = sub.problem?.slug ? `/coding-platform/${sub.problem.slug}` : problemLink;
                                                                            const subAccepted = sub.status?.toString().toLowerCase() === 'accepted';
                                                                            return (
                                                                                <tr key={sub._id || `${row.id}-${sub.createdAt}-${sub.language}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                                                    <td style={{ padding: '8px 10px', fontSize: '0.84rem' }}>
                                                                                        <Link to={subProblemLink} style={{ color: '#93c5fd', textDecoration: 'none', fontWeight: 600 }}>
                                                                                            {sub.problem?.title || row.problem?.title || 'Problem'}
                                                                                        </Link>
                                                                                    </td>
                                                                                    <td style={{ padding: '8px 10px', fontSize: '0.84rem', color: 'var(--text-primary, #d1d5db)', textTransform: 'capitalize' }}>
                                                                                        {sub.language || '-'}
                                                                                    </td>
                                                                                    <td style={{ padding: '8px 10px', fontSize: '0.84rem', color: 'var(--text-primary, #d1d5db)' }}>
                                                                                        {sub.runtime != null ? `${sub.runtime} ms` : '-'}
                                                                                    </td>
                                                                                    <td style={{ padding: '8px 10px', fontSize: '0.84rem', color: 'var(--text-primary, #d1d5db)' }}>
                                                                                        {sub.memory != null ? `${sub.memory} MB` : '-'}
                                                                                    </td>
                                                                                    <td style={{ padding: '8px 10px', fontSize: '0.84rem', color: 'var(--text-secondary, #9ca3af)', whiteSpace: 'nowrap' }}>
                                                                                        {formatDateTime(sub.createdAt)}
                                                                                    </td>
                                                                                    <td style={{ padding: '8px 10px', fontSize: '0.84rem', color: subAccepted ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                                                                                        {subAccepted ? 'Accepted' : formatSubmissionStatus(sub.status)}
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {hasMore && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
                            <button
                                type="button"
                                onClick={onLoadMore}
                                disabled={loadingMore}
                                style={{
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px 16px',
                                    cursor: loadingMore ? 'not-allowed' : 'pointer',
                                    background: 'rgba(59,130,246,0.2)',
                                    color: '#60a5fa',
                                    fontSize: '0.82rem',
                                    fontWeight: '600',
                                    opacity: loadingMore ? 0.6 : 1
                                }}
                            >
                                {loadingMore ? 'Loading...' : 'Load More'}
                            </button>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="glass-panel" style={{ padding: '16px', borderRadius: '14px' }}>
                        <h3 style={{ margin: '0 0 10px', fontSize: '2rem' }}>Summary</h3>
                        <div style={{ borderRadius: '12px', padding: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <p style={{ margin: 0, color: 'var(--text-secondary, #9ca3af)', fontSize: '0.9rem' }}>Total Solved</p>
                            <div style={{ marginTop: '4px', fontSize: '2rem', color: '#60a5fa', fontWeight: '700' }}>
                                {solvedTotal}
                            </div>
                            <div style={{ marginTop: '4px', color: 'var(--text-primary, #d1d5db)', fontSize: '0.88rem' }}>
                                {solvedTotal === 1 ? 'Problem' : 'Problems'}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: '8px', marginTop: '12px' }}>
                                <div style={{ borderRadius: '10px', background: 'rgba(34,197,94,0.1)', padding: '8px', textAlign: 'center' }}>
                                    <div style={{ color: '#22c55e', fontWeight: '700' }}>{easy}</div>
                                    <div style={{ color: '#86efac', fontSize: '0.72rem' }}>Easy</div>
                                </div>
                                <div style={{ borderRadius: '10px', background: 'rgba(234,179,8,0.1)', padding: '8px', textAlign: 'center' }}>
                                    <div style={{ color: '#eab308', fontWeight: '700' }}>{medium}</div>
                                    <div style={{ color: '#fde68a', fontSize: '0.72rem' }}>Med.</div>
                                </div>
                                <div style={{ borderRadius: '10px', background: 'rgba(239,68,68,0.1)', padding: '8px', textAlign: 'center' }}>
                                    <div style={{ color: '#ef4444', fontWeight: '700' }}>{hard}</div>
                                    <div style={{ color: '#fca5a5', fontSize: '0.72rem' }}>Hard</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                        <div className="glass-panel" style={{ padding: '14px', borderRadius: '14px' }}>
                            <p style={{ margin: 0, color: 'var(--text-secondary, #9ca3af)', fontSize: '0.84rem' }}>Submissions</p>
                            <div style={{ marginTop: '6px', color: '#a855f7', fontSize: '1.9rem', fontWeight: '700' }}>{totalSubmissions}</div>
                        </div>
                        <div className="glass-panel" style={{ padding: '14px', borderRadius: '14px' }}>
                            <p style={{ margin: 0, color: 'var(--text-secondary, #9ca3af)', fontSize: '0.84rem' }}>Acceptance</p>
                            <div style={{ marginTop: '6px', color: '#22c55e', fontSize: '1.9rem', fontWeight: '700' }}>{acceptanceRate}%</div>
                        </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '14px', borderRadius: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '8px' }}>
                            <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Topic Snapshot</h4>
                            <button
                                type="button"
                                onClick={() => setShowAllTopics(true)}
                                style={{
                                    border: '1px solid rgba(34,197,94,0.3)',
                                    borderRadius: '999px',
                                    background: 'rgba(34,197,94,0.1)',
                                    color: '#4ade80',
                                    fontSize: '0.73rem',
                                    padding: '4px 10px',
                                    cursor: 'pointer'
                                }}
                            >
                                Open Map
                            </button>
                        </div>
                        <TopicBubbleCloud topics={topicProgress} maxItems={12} compact />
                    </div>
                </div>
            </div>

            <div className="glass-panel" style={{ marginTop: '16px', borderRadius: '14px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Topics Bubble Map</h3>
                    <button
                        type="button"
                        onClick={() => setShowAllTopics(true)}
                        style={{
                            border: '1px solid rgba(34,197,94,0.3)',
                            borderRadius: '999px',
                            background: 'rgba(34,197,94,0.1)',
                            color: '#4ade80',
                            fontSize: '0.73rem',
                            padding: '5px 12px',
                            cursor: 'pointer'
                        }}
                    >
                        View All Topics
                    </button>
                </div>
                <TopicBubbleCloud topics={topicProgress} maxItems={28} />
            </div>

            <AnimatePresence>
                {showAllTopics && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowAllTopics(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(2,6,23,0.55)',
                            zIndex: 3000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '14px'
                        }}
                    >
                        <motion.div
                            initial={{ y: 16, opacity: 0, scale: 0.98 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 12, opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            onClick={(event) => event.stopPropagation()}
                            style={{
                                width: 'min(980px, 100%)',
                                maxHeight: 'min(760px, 100vh - 24px)',
                                overflowY: 'auto',
                                background: '#f5f5f5',
                                color: '#111827',
                                borderRadius: '16px',
                                padding: '14px'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '14px', gap: '12px' }}>
                                <span style={{ color: '#737373', fontSize: '1.65rem', fontWeight: 600 }}>All Topics</span>
                                <button
                                    type="button"
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        color: '#525252',
                                        fontSize: '1.75rem',
                                        lineHeight: 1,
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setShowAllTopics(false)}
                                    aria-label="Close topics"
                                >
                                    ×
                                </button>
                            </div>
                            <div style={{ padding: '6px 2px 10px' }}>
                                <TopicBubbleCloud topics={topicProgress} maxItems={400} />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Skill Distribution ---
const SkillDistribution = ({ tagStats }) => {
    if (!tagStats || Object.keys(tagStats).length === 0) return <p style={{ color: 'var(--text-muted, #888)' }}>Solve problems to see skill analysis.</p>;

    const entries = Object.entries(tagStats)
        .sort(([, a], [, b]) => b.solved - a.solved)
        .slice(0, 8);

    const maxSolved = Math.max(...entries.map(([, d]) => d.solved), 1);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {entries.map(([tag, data]) => (
                <div key={tag}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '0.85rem' }}>
                        <span>{tag}</span>
                        <span style={{ color: 'var(--text-muted, #888)' }}>{data.solved}</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(data.solved / maxSolved) * 100}%` }}
                            transition={{ duration: 0.8 }}
                            style={{
                                height: '100%', borderRadius: '3px',
                                background: (data.efficiency || 0) > 0.7 ? '#22c55e' : (data.efficiency || 0) > 0.4 ? '#eab308' : '#ef4444'
                            }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

const SkillRadarGraph = ({ topicProgress = [], maxAxes = 8 }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const chartItems = (Array.isArray(topicProgress) ? topicProgress : [])
        .map((topic) => {
            const solvedProblems = Number(
                topic?.solvedProblems ??
                topic?.acceptedSubmissions ??
                topic?.solved ??
                0
            );
            const attemptedProblems = Number(
                topic?.attemptedProblems ??
                topic?.totalSubmissions ??
                topic?.attempted ??
                0
            );
            const acceptanceRate = Number(topic?.acceptanceRate ?? topic?.coverageRate ?? 0);
            const masteryScore = Number(topic?.masteryScore ?? 0);
            const label = String(topic?.topic || topic?.name || '').trim();

            return {
                label,
                solvedProblems,
                attemptedProblems,
                acceptanceRate,
                masteryScore
            };
        })
        .filter((topic) => Boolean(topic.label))
        .sort((a, b) => {
            if (b.solvedProblems !== a.solvedProblems) return b.solvedProblems - a.solvedProblems;
            if (b.attemptedProblems !== a.attemptedProblems) return b.attemptedProblems - a.attemptedProblems;
            return a.label.localeCompare(b.label);
        })
        .slice(0, maxAxes);

    if (!chartItems.length) {
        return <p style={{ color: 'var(--text-muted, #888)', margin: 0 }}>Solve topic-wise problems to unlock your skill graph.</p>;
    }

    const maxSolved = Math.max(...chartItems.map((topic) => topic.solvedProblems), 1);
    const totalSolvedAcrossChart = chartItems.reduce((sum, topic) => sum + topic.solvedProblems, 0);
    const radius = 118;
    const center = 160;
    const levels = [20, 40, 60, 80, 100];
    const count = chartItems.length;

    const scoredItems = chartItems.map((topic) => {
        const solvedScore = (topic.solvedProblems / maxSolved) * 70;
        const acceptanceScore = Math.min(30, Math.max(topic.acceptanceRate, 0) * 0.3);
        const derivedScore = Math.min(100, solvedScore + acceptanceScore);
        const blendedScore = topic.masteryScore > 0
            ? Math.min(100, (topic.masteryScore * 0.65) + (derivedScore * 0.35))
            : derivedScore;

        const percentile = totalSolvedAcrossChart > 0
            ? Math.round((topic.solvedProblems / totalSolvedAcrossChart) * 1000) / 10
            : 0;

        return {
            ...topic,
            score: Math.round(blendedScore * 10) / 10,
            percentile
        };
    });

    const getPointAt = (index, score = 100) => {
        const angle = (-Math.PI / 2) + ((Math.PI * 2 * index) / count);
        const distance = (Math.max(0, Math.min(100, score)) / 100) * radius;
        return {
            x: center + Math.cos(angle) * distance,
            y: center + Math.sin(angle) * distance
        };
    };

    const gridPolygons = levels.map((level) => scoredItems
        .map((_, index) => {
            const point = getPointAt(index, level);
            return `${point.x},${point.y}`;
        })
        .join(' ')
    );

    const axisLines = scoredItems.map((_, index) => {
        const point = getPointAt(index, 100);
        return { x1: center, y1: center, x2: point.x, y2: point.y };
    });

    const dataPoints = scoredItems.map((topic, index) => ({
        ...topic,
        ...getPointAt(index, topic.score),
        labelPoint: getPointAt(index, 117),
        shortLabel: topic.label.length > 16 ? `${topic.label.slice(0, 16)}...` : topic.label
    }));

    const polygonPath = dataPoints.map((point) => `${point.x},${point.y}`).join(' ');
    const activeTopic = dataPoints[activeIndex] || dataPoints[0];

    return (
        <div style={{ display: 'grid', gap: '12px' }}>
            <div className="skill-radar-container" style={{
                borderRadius: '16px',
                border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
                padding: '12px'
            }}>
                <svg viewBox="0 0 320 320" width="100%" style={{ maxHeight: '360px' }}>
                    <defs>
                        <linearGradient id="skillRadarStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#22d3ee" />
                            <stop offset="100%" stopColor="#34d399" />
                        </linearGradient>
                    </defs>

                    {gridPolygons.map((points, idx) => (
                        <polygon
                            key={`grid-${levels[idx]}`}
                            points={points}
                            fill="none"
                            stroke="rgba(255,255,255,0.12)"
                            strokeWidth={idx === levels.length - 1 ? 1.1 : 0.8}
                        />
                    ))}

                    {axisLines.map((axis, idx) => (
                        <line
                            key={`axis-${idx}`}
                            x1={axis.x1}
                            y1={axis.y1}
                            x2={axis.x2}
                            y2={axis.y2}
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="0.9"
                        />
                    ))}

                    <polygon
                        points={polygonPath}
                        fill="rgba(45,212,191,0.24)"
                        stroke="url(#skillRadarStroke)"
                        strokeWidth="2.2"
                    />

                    {dataPoints.map((point, idx) => (
                        <g key={point.label}>
                            <circle
                                cx={point.x}
                                cy={point.y}
                                r={activeIndex === idx ? 5.8 : 4.3}
                                fill={activeIndex === idx ? '#34d399' : '#22d3ee'}
                                stroke="#082f49"
                                strokeWidth="1.2"
                                onMouseEnter={() => setActiveIndex(idx)}
                                onFocus={() => setActiveIndex(idx)}
                                onTouchStart={() => setActiveIndex(idx)}
                            />
                            <text
                                x={point.labelPoint.x}
                                y={point.labelPoint.y}
                                fill={activeIndex === idx ? '#f8fafc' : '#cbd5e1'}
                                fontSize="9.8"
                                textAnchor="middle"
                                dominantBaseline="middle"
                            >
                                {point.shortLabel}
                            </text>
                        </g>
                    ))}
                </svg>
            </div>

            <div style={{
                borderRadius: '12px',
                border: '1px solid rgba(52,211,153,0.35)',
                background: 'rgba(15,23,42,0.65)',
                padding: '10px 12px'
            }}>
                <div style={{ fontSize: '0.78rem', color: '#86efac', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Active Topic
                </div>
                <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <strong style={{ color: '#f8fafc', fontSize: '0.95rem' }}>{activeTopic.label}</strong>
                    <span style={{ color: '#22d3ee', fontSize: '0.85rem', fontWeight: 600 }}>
                        Skill Score {activeTopic.score}
                    </span>
                </div>
                <div style={{ marginTop: '4px', fontSize: '0.8rem', color: '#cbd5e1' }}>
                    Solved {activeTopic.solvedProblems} - Acceptance {Math.round(activeTopic.acceptanceRate * 10) / 10}% - Share {activeTopic.percentile}%
                </div>
            </div>
        </div>
    );
};

// --- Rating Tier Badge ---
const getTier = (rating) => {
    if (rating >= 2400) return { name: 'Grandmaster', color: '#ff0000', bg: 'rgba(255,0,0,0.1)' };
    if (rating >= 2100) return { name: 'Master', color: '#ff8c00', bg: 'rgba(255,140,0,0.1)' };
    if (rating >= 1900) return { name: 'Candidate Master', color: '#aa00aa', bg: 'rgba(170,0,170,0.1)' };
    if (rating >= 1600) return { name: 'Expert', color: '#0000ff', bg: 'rgba(0,0,255,0.1)' };
    if (rating >= 1400) return { name: 'Specialist', color: '#03a89e', bg: 'rgba(3,168,158,0.1)' };
    if (rating >= 1200) return { name: 'Pupil', color: '#008000', bg: 'rgba(0,128,0,0.1)' };
    return { name: 'Newbie', color: '#808080', bg: 'rgba(128,128,128,0.1)' };
};

// ==========================================
// MAIN PROFILE COMPONENT
// ==========================================
const Profile = () => {
    const { username: paramUsername } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user: authUser, isAuthenticated } = useSelector(state => state.auth);
    const dispatch = useDispatch();

    const [profile, setProfile] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [recentSubs, setRecentSubs] = useState([]);
    const [performance, setPerformance] = useState(null);
    const [badgesData, setBadgesData] = useState(null);
    const [contestStats, setContestStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isOwnProfile, setIsOwnProfile] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [heatmapYear, setHeatmapYear] = useState(new Date().getFullYear());
    const [historyView, setHistoryView] = useState(null); // 'solved' | 'submissions' | 'starred'
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyLoadingMore, setHistoryLoadingMore] = useState(false);
    const [solvedHistory, setSolvedHistory] = useState([]);
    const [solvedPagination, setSolvedPagination] = useState({ page: 1, pages: 1, hasMore: false, total: 0 });
    const [submissionsHistory, setSubmissionsHistory] = useState([]);
    const [submissionsPagination, setSubmissionsPagination] = useState({ page: 1, pages: 1, hasMore: false, total: 0 });
    const [starredHistory, setStarredHistory] = useState([]);
    const [starredLoaded, setStarredLoaded] = useState(false);
    const [progressData, setProgressData] = useState(null);
    const [progressLoading, setProgressLoading] = useState(false);
    const [progressErrorLocked, setProgressErrorLocked] = useState(false);
    const progressUnauthorizedNotifiedRef = useRef(false);
    const progressViewParam = searchParams.get('view');
    const [communityPostsHistory, setCommunityPostsHistory] = useState([]);
    const [communityPostsLoading, setCommunityPostsLoading] = useState(false);
    const [communityPostsLoadingMore, setCommunityPostsLoadingMore] = useState(false);
    const [communityPostsPagination, setCommunityPostsPagination] = useState({ page: 1, pages: 1, hasMore: false, total: 0 });
    const [viewportWidth, setViewportWidth] = useState(() => (
        typeof window !== 'undefined' ? window.innerWidth : 1400
    ));
    const isMobile = viewportWidth <= 768;
    const isTablet = viewportWidth > 768 && viewportWidth <= 1100;

    // Messaging states
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [messageContent, setMessageContent] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, [paramUsername, isAuthenticated]);

    useEffect(() => {
        setHistoryView(null);
        setSolvedHistory([]);
        setSubmissionsHistory([]);
        setStarredHistory([]);
        setStarredLoaded(false);
        setSolvedPagination({ page: 1, pages: 1, hasMore: false, total: 0 });
        setSubmissionsPagination({ page: 1, pages: 1, hasMore: false, total: 0 });
        setProgressData(null);
        setProgressErrorLocked(false);
        progressUnauthorizedNotifiedRef.current = false;
        setCommunityPostsHistory([]);
        setCommunityPostsPagination({ page: 1, pages: 1, hasMore: false, total: 0 });
        setCommunityPostsLoading(false);
        setCommunityPostsLoadingMore(false);
    }, [paramUsername, isAuthenticated]);

    useEffect(() => {
        const onResize = () => setViewportWidth(window.innerWidth);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            let res;
            if (paramUsername) {
                // Public profile
                res = await api.get(`/profiles/user/${paramUsername}`);
                setIsOwnProfile(isAuthenticated && authUser && authUser.username === paramUsername);
            } else {
                if (!isAuthenticated) { setLoading(false); return; }

                // Fetch all profile data in parallel but tolerate optional endpoint failures.
                const [
                    meResult,
                    analyticsResult,
                    subsResult,
                    perfResult,
                    badgesResult,
                    contestResult
                ] = await Promise.allSettled([
                    api.get('/profiles/me', { timeout: 30000 }),
                    api.get('/profiles/analytics', { timeout: 30000 }),
                    api.get('/profiles/submissions?limit=10', { timeout: 30000 }),
                    api.get('/profiles/performance', { timeout: 30000 }),
                    api.get('/profiles/badges', { timeout: 30000 }),
                    api.get('/profiles/contest-stats', { timeout: 30000 })
                ]);

                if (meResult.status !== 'fulfilled') {
                    throw meResult.reason || new Error('Failed to load profile');
                }

                const meData = meResult.value?.data || null;
                const analyticsData = analyticsResult.status === 'fulfilled' ? analyticsResult.value?.data || null : null;
                const subsData = subsResult.status === 'fulfilled' ? subsResult.value?.data || null : null;
                const perfData = perfResult.status === 'fulfilled' ? perfResult.value?.data || null : null;
                const badgesData = badgesResult.status === 'fulfilled' ? badgesResult.value?.data || null : null;
                const contestData = contestResult.status === 'fulfilled' ? contestResult.value?.data || null : null;

                res = { data: { profile: meData, analytics: analyticsData } };
                setRecentSubs(subsData?.submissions || []);
                setPerformance(perfData);
                setBadgesData(badgesData);
                setContestStats(contestData);
                setIsOwnProfile(true);
            }

            setProfile(res.data.profile);
            setAnalytics(res.data.analytics);
        } catch (err) {
            console.error("Profile Fetch Error:", err);
            toast.error("Could not load profile.");
            setProfile(null);
        } finally {
            setLoading(false);
        }
    };

    const fetchSolvedHistory = async (page = 1, append = false) => {
        const setLoadingState = append ? setHistoryLoadingMore : setHistoryLoading;
        setLoadingState(true);
        try {
            const res = await api.get(`/profiles/solved-problems?page=${page}&limit=20`);
            const problems = res.data?.solvedProblems || [];
            const pagination = res.data?.pagination || { page, pages: 1, hasMore: false, total: problems.length };

            setSolvedHistory(prev => append ? [...prev, ...problems] : problems);
            setSolvedPagination(pagination);
        } catch (err) {
            toast.error('Failed to load solved problems.');
        } finally {
            setLoadingState(false);
        }
    };

    const fetchSubmissionsHistory = async (page = 1, append = false) => {
        const setLoadingState = append ? setHistoryLoadingMore : setHistoryLoading;
        setLoadingState(true);
        try {
            const res = await api.get(`/profiles/submissions?page=${page}&limit=20`);
            const submissions = res.data?.submissions || [];
            const pagination = {
                page: res.data?.pagination?.page || page,
                pages: res.data?.pagination?.pages || 1,
                hasMore: (res.data?.pagination?.page || page) < (res.data?.pagination?.pages || 1),
                total: res.data?.pagination?.total || submissions.length
            };

            setSubmissionsHistory(prev => append ? [...prev, ...submissions] : submissions);
            setSubmissionsPagination(pagination);
        } catch (err) {
            toast.error('Failed to load submissions.');
        } finally {
            setLoadingState(false);
        }
    };

    const fetchStarredHistory = async () => {
        setHistoryLoading(true);
        try {
            const res = await api.get('/profiles/bookmarks');
            const items = Array.isArray(res.data) ? res.data : [];
            setStarredHistory(items);
            setStarredLoaded(true);
        } catch (err) {
            toast.error('Failed to load starred problems.');
        } finally {
            setHistoryLoading(false);
        }
    };

    const fetchProgressDetails = async (historyPage = 1, append = false) => {
        if (!isOwnProfile || progressErrorLocked) return;

        if (append) {
            setHistoryLoadingMore(true);
        } else {
            setProgressLoading(true);
        }

        try {
            const res = await api.get(`/profiles/progress?historyPage=${historyPage}&historyLimit=20`);
            const data = res.data || null;

            setProgressData((prev) => {
                if (!append || !prev || !data) return data;
                return {
                    ...data,
                    practiceHistory: [
                        ...(prev.practiceHistory || []),
                        ...(data.practiceHistory || [])
                    ]
                };
            });
            setProgressErrorLocked(false);
        } catch (err) {
            if (err?.response?.status === 401) {
                if (!progressUnauthorizedNotifiedRef.current) {
                    toast.error('Session expired. Please log in again.');
                    progressUnauthorizedNotifiedRef.current = true;
                }
                setProgressErrorLocked(true);
                const nextParams = new URLSearchParams(searchParams);
                nextParams.delete('view');
                setSearchParams(nextParams, { replace: true });
                setHistoryView(null);
            } else {
                toast.error('Failed to load progress details.');
            }
        } finally {
            if (append) {
                setHistoryLoadingMore(false);
            } else {
                setProgressLoading(false);
            }
        }
    };

    const handleHistoryOpen = async (view) => {
        if (!isOwnProfile || historyLoading || historyLoadingMore) return;

        if (progressViewParam === 'progress') {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete('view');
            setSearchParams(nextParams, { replace: true });
        }

        setHistoryView(view);
        if (view === 'solved') {
            await fetchSolvedHistory(1, false);
            return;
        }
        if (view === 'submissions') {
            await fetchSubmissionsHistory(1, false);
            return;
        }
        if (view === 'starred') {
            await fetchStarredHistory();
        }
    };

    const fetchCommunityPostsHistory = async (page = 1, append = false) => {
        const setLoadingState = append ? setCommunityPostsLoadingMore : setCommunityPostsLoading;
        setLoadingState(true);
        try {
            const res = await api.get(`/doubts/my-posts?page=${page}&limit=8&sort=latest`);
            const posts = Array.isArray(res.data?.threads) ? res.data.threads : [];
            const pagination = res.data?.pagination || { page, pages: 1, hasMore: false, total: posts.length };

            setCommunityPostsHistory((prev) => append ? [...prev, ...posts] : posts);
            setCommunityPostsPagination(pagination);
        } catch (err) {
            toast.error('Failed to load community posts.');
        } finally {
            setLoadingState(false);
        }
    };

    const handleHistoryLoadMore = async () => {
        if (historyLoading || historyLoadingMore) return;

        if (historyView === 'solved' && solvedPagination.hasMore) {
            await fetchSolvedHistory((solvedPagination.page || 1) + 1, true);
            return;
        }
        if (historyView === 'submissions' && submissionsPagination.hasMore) {
            await fetchSubmissionsHistory((submissionsPagination.page || 1) + 1, true);
        }
    };

    const handleProgressLoadMore = async () => {
        if (historyLoadingMore || progressLoading || progressErrorLocked) return;
        if (!progressData?.practiceHistoryPagination?.hasMore) return;

        const nextPage = (progressData.practiceHistoryPagination.page || 1) + 1;
        await fetchProgressDetails(nextPage, true);
    };

    useEffect(() => {
        if (loading || !isOwnProfile || progressViewParam !== 'progress' || progressErrorLocked) return;
        if (!progressData && !progressLoading) {
            fetchProgressDetails(1, false);
        }
    }, [loading, isOwnProfile, progressViewParam, progressData, progressLoading, progressErrorLocked]);

    useEffect(() => {
        if (loading || !isOwnProfile || communityPostsLoading || communityPostsHistory.length > 0) return;
        fetchCommunityPostsHistory(1, false);
    }, [loading, isOwnProfile]);

    const handleShare = () => {
        const url = `${window.location.origin}/profile/${profile?.user?.username}`;
        navigator.clipboard.writeText(url);
        toast.success('Profile link copied!');
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageContent.trim()) return toast.error("Message cannot be empty");
        setSendingMessage(true);
        try {
            await api.post(`/users/message/${userObj._id}`, { message: messageContent });
            toast.success("Message sent successfully!");
            setIsMessageModalOpen(false);
            setMessageContent('');
        } catch {
            toast.error("Failed to send message");
        } finally {
            setSendingMessage(false);
        }
    };

    // --- Guard renders ---
    if (!isAuthenticated && !paramUsername) {
        return (
            <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <h2>Please Login</h2>
                    <p>You need to be logged in to view your profile.</p>
                    <Link to="/login" className="control-btn" style={{ background: 'var(--primary-teal)', color: 'black', marginTop: '20px', display: 'inline-block' }}>Login</Link>
                </div>
            </div>
        );
    }
    if (loading) return <div className="main-content" style={{ padding: '40px', color: 'var(--text-primary, white)' }}>Loading...</div>;
    if (!profile) return <div className="main-content" style={{ padding: '40px', color: 'var(--text-primary, white)' }}>Profile not found.</div>;

    const userObj = profile.user || {};
    const stats = userObj.stats || {};
    const rating = userObj.rating || { current: 1200, highest: 1200, history: [] };
    const perf = performance || {};
    const cStats = contestStats || {};
    const tier = getTier(rating.current);
    const hasEducation = profile.educationDetails?.college || (profile.education && profile.education.length > 0);
    const acceptanceRate = typeof perf.acceptanceRate === 'number'
        ? perf.acceptanceRate
        : stats.totalSubmissions > 0
            ? Math.round((stats.acceptedSubmissions / stats.totalSubmissions) * 10000) / 100
            : 0;
    const totalSubmissions = Number.isFinite(perf.totalSubmissions) ? perf.totalSubmissions : (stats.totalSubmissions || 0);
    const avgRuntime = Number.isFinite(perf.avgRuntime) ? perf.avgRuntime : (userObj.performanceStats?.avgRuntime || 0);
    const avgMemory = Number.isFinite(perf.avgMemory) ? perf.avgMemory : (userObj.performanceStats?.avgMemory || 0);
    const fastestRuntime = Number.isFinite(perf.fastestRuntime) ? perf.fastestRuntime : userObj.performanceStats?.fastestRuntime;
    const finalScore = Number.isFinite(perf.finalScore) ? perf.finalScore : Number(userObj.finalScore || 0);
    const starredCount = starredLoaded
        ? starredHistory.length
        : (Array.isArray(userObj.bookmarkedProblems) ? userObj.bookmarkedProblems.length : 0);
    const isProgressView = isOwnProfile && progressViewParam === 'progress';

    const clearProgressView = () => {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('view');
        setSearchParams(nextParams, { replace: true });
        setHistoryView(null);
    };

    const progressHistoryRows = Array.isArray(progressData?.practiceHistory) ? progressData.practiceHistory : [];
    const analyticsTagStatsRaw = analytics?.tagStats instanceof Map
        ? Object.fromEntries(analytics.tagStats)
        : (analytics?.tagStats || {});
    const fallbackTopicRows = Object.entries(analyticsTagStatsRaw).map(([topic, data]) => {
        const attemptedProblems = Number(data?.attempted || 0);
        const solvedProblems = Number(data?.solved || 0);
        const efficiency = Number(data?.efficiency || 0);
        const acceptance = Math.round(efficiency * 10000) / 100;
        const masteryScore = Math.round(Math.min(100, (acceptance * 0.7) + Math.min(30, attemptedProblems * 3)));

        return {
            topic,
            totalProblems: attemptedProblems,
            attemptedProblems,
            solvedProblems,
            totalSubmissions: attemptedProblems,
            acceptedSubmissions: solvedProblems,
            acceptanceRate: acceptance,
            coverageRate: acceptance,
            masteryScore
        };
    });
    const progressTopicRows = Array.isArray(progressData?.topicProgress) && progressData.topicProgress.length > 0
        ? progressData.topicProgress
        : fallbackTopicRows;
    const progressStats = progressData?.stats || stats;
    const progressTotalSubmissions = Number.isFinite(progressData?.stats?.totalSubmissions)
        ? progressData.stats.totalSubmissions
        : totalSubmissions;
    const progressAcceptanceRate = typeof progressData?.acceptanceRate === 'number'
        ? progressData.acceptanceRate
        : acceptanceRate;

    return (
        <div className="main-content">
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '20px 12px' : '40px 20px' }}>

                {/* =============== TOP: HEADER + QUICK STATS =============== */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : (isTablet ? 'minmax(0, 1fr)' : 'minmax(320px, 1fr) 2fr'), gap: '24px', marginBottom: '32px' }}>

                    {/* User Info Card */}
                    <div className="glass-panel" style={{ padding: 0, borderRadius: '20px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ height: '100px', background: 'linear-gradient(135deg, #111827, #374151)' }} />

                        <div style={{ padding: '0 28px 28px', marginTop: '-50px', position: 'relative', textAlign: 'center' }}>
                            <div style={{
                                width: '100px', height: '100px', borderRadius: '50%', margin: '0 auto 12px',
                                background: 'linear-gradient(135deg, var(--primary-teal), var(--primary-blue))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '2.5rem', fontWeight: 'bold', border: '4px solid #1f2937'
                            }}>
                                {userObj.avatar && userObj.avatar !== 'default-avatar.png'
                                    ? <img src={userObj.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                                    : userObj.username?.charAt(0).toUpperCase()
                                }
                            </div>

                            {/* Action buttons */}
                            <div style={{ position: 'absolute', top: '60px', right: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: isMobile ? '120px' : 'none' }}>
                                {isOwnProfile ? (
                                    <button onClick={() => setIsEditModalOpen(true)}
                                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--text-primary, white)', padding: '6px', borderRadius: '50%', cursor: 'pointer' }}
                                        title="Edit Profile"><FaEdit /></button>
                                ) : (
                                    isAuthenticated && (
                                        <>
                                            <button onClick={() => setIsMessageModalOpen(true)}
                                                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--text-primary, white)', padding: '6px', borderRadius: '50%', cursor: 'pointer' }}
                                                title="Message"><FaEnvelope /></button>
                                            <button onClick={() => setIsReportModalOpen(true)}
                                                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#f87171', padding: '6px', borderRadius: '50%', cursor: 'pointer' }}
                                                title="Report User"><FaFlag /></button>
                                        </>
                                    )
                                )}
                                <button onClick={handleShare}
                                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--text-primary, white)', padding: '6px', borderRadius: '50%', cursor: 'pointer' }}
                                    title="Share Profile"><FaShareAlt /></button>
                            </div>

                            <h1 style={{ margin: '0 0 2px', fontSize: '1.5rem' }}>{userObj.fullName || userObj.username}</h1>
                            {userObj.fullName && <p style={{ color: 'var(--text-muted, #888)', margin: '0 0 6px', fontSize: '0.85rem' }}>@{userObj.username}</p>}

                            {/* Rating tier badge */}
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                padding: '3px 12px', borderRadius: '12px', marginBottom: '12px',
                                background: tier.bg, border: `1px solid ${tier.color}40`
                            }}>
                                <span style={{ color: tier.color, fontSize: '0.8rem', fontWeight: 'bold' }}>
                                    {tier.name}
                                </span>
                                <span style={{ color: tier.color, fontSize: '0.85rem', fontWeight: '700' }}>
                                    {rating.current}
                                </span>
                            </div>

                            <p style={{ color: 'var(--primary-teal)', margin: '0 0 12px', fontWeight: '600', fontSize: '0.9rem' }}>
                                {profile.title || 'Coding Enthusiast'}
                            </p>

                            {profile.bio && <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5', fontSize: '0.9rem' }}>{profile.bio}</p>}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-secondary, #9ca3af)' }}>
                                {profile.location?.country && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <FaMapMarkerAlt /> {profile.location.state ? `${profile.location.state}, ` : ''}{profile.location.country}
                                    </span>
                                )}
                                {hasEducation && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <FaUniversity /> {profile.educationDetails?.college || profile.education[0]?.school}
                                    </span>
                                )}
                                {profile.preferences?.showEmail && userObj.email && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FaEnvelope /> {userObj.email}</span>
                                )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginTop: '16px' }}>
                                {profile.website && <a href={profile.website} target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary, #9ca3af)', fontSize: '1.1rem' }}><FaGlobe /></a>}
                                {profile.social?.github && <a href={profile.social.github} target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary, #9ca3af)', fontSize: '1.1rem' }}><FaGithub /></a>}
                                {profile.social?.linkedin && <a href={profile.social.linkedin} target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary, #9ca3af)', fontSize: '1.1rem' }}><FaLinkedin /></a>}
                                {profile.social?.twitter && <a href={profile.social.twitter} target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary, #9ca3af)', fontSize: '1.1rem' }}><FaTwitter /></a>}
                            </div>

                            {isOwnProfile && (
                                <button onClick={() => dispatch(logout())}
                                    style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', marginTop: '24px', padding: '6px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                    Sign Out
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Stats + Performance */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        {/* Quick Stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
                            <StatCard
                                icon={<FaTrophy />}
                                value={userObj.solvedProblems?.length || 0}
                                label="Solved"
                                color="#eab308"
                                subtitle={isOwnProfile ? 'Click to view all' : undefined}
                                onClick={isOwnProfile ? () => handleHistoryOpen('solved') : undefined}
                                active={historyView === 'solved'}
                            />
                            <StatCard
                                icon={<FaCode />}
                                value={totalSubmissions}
                                label="Submissions"
                                color="#3b82f6"
                                subtitle={isOwnProfile ? 'Click to view all' : undefined}
                                onClick={isOwnProfile ? () => handleHistoryOpen('submissions') : undefined}
                                active={historyView === 'submissions'}
                            />
                            <StatCard
                                icon={<FaBookmark />}
                                value={starredCount}
                                label="Saved"
                                color="#facc15"
                                subtitle={isOwnProfile ? 'Click to view all' : undefined}
                                onClick={isOwnProfile ? () => handleHistoryOpen('starred') : undefined}
                                active={historyView === 'starred'}
                            />
                            <StatCard icon={<FaFire />} value={userObj.streak?.current || 0} label="Day Streak" color="#f97316" subtitle={`Best: ${userObj.streak?.longest || 0}`} />
                            <StatCard icon={<FaChartBar />} value={`${acceptanceRate}%`} label="Acceptance" color="#22c55e" />
                            <StatCard icon={<FaBolt />} value={finalScore.toFixed(2)} label="Total Score" color="#06b6d4" />
                            <StatCard icon={<FaStar />} value={perf.globalRank || '-'} label="Global Rank" color="#a855f7" subtitle={perf.percentile ? `Top ${100 - perf.percentile}%` : ''} />
                        </div>

                        {/* Performance + Difficulty Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
                            {/* Performance Insights */}
                            <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
                                <h3 style={{ marginTop: 0, marginBottom: '14px', fontSize: '0.95rem' }}>⚡ Performance</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--text-muted, #888)' }}>Avg Runtime</span>
                                        <span style={{ color: '#22c55e', fontWeight: '600' }}>{avgRuntime.toFixed(1)}ms</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--text-muted, #888)' }}>Avg Memory</span>
                                        <span style={{ color: '#3b82f6', fontWeight: '600' }}>{avgMemory.toFixed(1)}MB</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--text-muted, #888)' }}>Fastest</span>
                                        <span style={{ color: '#f97316', fontWeight: '600' }}>{fastestRuntime != null ? `${fastestRuntime}ms` : '-'}</span>
                                    </div>
                                    {cStats.participated > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                            <span style={{ color: 'var(--text-muted, #888)' }}>Contests</span>
                                            <span style={{ color: '#a855f7', fontWeight: '600' }}>{cStats.participated} (Best #{cStats.bestRank || '-'})</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Difficulty Breakdown */}
                            <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
                                <h3 style={{ marginTop: 0, marginBottom: '14px', fontSize: '0.95rem' }}>📊 Difficulty</h3>
                                <DifficultyBreakdown stats={stats} />
                            </div>
                        </div>

                        {/* Heatmap */}
                        {(profile.preferences?.showActivity !== false || isOwnProfile) && (
                            <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
                                <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem' }}>Submission Activity</h3>
                                <ActivityHeatmap heatmap={analytics?.heatmap} selectedYear={heatmapYear} onYearChange={setHeatmapYear} />
                            </div>
                        )}
                    </div>
                </div>

                {isProgressView && (
                    <ProgressDetailsPanel
                        rows={progressHistoryRows}
                        loading={progressLoading}
                        hasMore={Boolean(progressData?.practiceHistoryPagination?.hasMore)}
                        loadingMore={historyLoadingMore}
                        onLoadMore={handleProgressLoadMore}
                        onClose={clearProgressView}
                        stats={progressStats}
                        totalSubmissions={progressTotalSubmissions}
                        acceptanceRate={progressAcceptanceRate}
                        topicProgress={progressTopicRows}
                    />
                )}

                {/* =============== MIDDLE: BADGES =============== */}
                {isOwnProfile && badgesData && (
                    <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', marginBottom: '24px' }}>
                        <BadgesSection badges={badgesData} loading={false} />
                    </div>
                )}

                {/* =============== LOWER: LANGUAGE + SKILL + RECENT =============== */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                    {/* Language Stats */}
                    <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '0.95rem' }}>🛠 Languages</h3>
                        <LanguageStats stats={analytics?.languageStats} />
                    </div>

                    {/* Skill Graph */}
                    <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '0.95rem' }}>Topic Skill Graph</h3>
                        <SkillRadarGraph topicProgress={progressTopicRows} />
                        <div style={{ marginTop: '16px' }}>
                            <SkillDistribution tagStats={analytics?.tagStats} />
                        </div>
                    </div>

                    {/* AI Insights */}
                    {analytics?.insights && (analytics.insights.weakTopics?.length > 0 || analytics.insights.strongTopics?.length > 0) && (
                        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '0.95rem' }}>💡 AI Insights</h3>
                            {analytics.insights.strongTopics?.length > 0 && (
                                <div style={{ marginBottom: '12px' }}>
                                    <p style={{ color: '#22c55e', fontSize: '0.8rem', fontWeight: '600', margin: '0 0 6px' }}>Strong Areas</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {analytics.insights.strongTopics.map(t => (
                                            <span key={t} style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontSize: '0.75rem' }}>{t}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {analytics.insights.weakTopics?.length > 0 && (
                                <div>
                                    <p style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: '600', margin: '0 0 6px' }}>Needs Practice</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {analytics.insights.weakTopics.map(t => (
                                            <span key={t} style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '0.75rem' }}>{t}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {analytics.insights.consistencyScore > 0 && (
                                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                    <span style={{ color: 'var(--text-muted, #888)' }}>Consistency (30d)</span>
                                    <span style={{ color: analytics.insights.consistencyScore > 50 ? '#22c55e' : '#eab308', fontWeight: '600' }}>
                                        {analytics.insights.consistencyScore}%
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {isOwnProfile && historyView && !isProgressView && (
                    <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '10px', flexWrap: 'wrap' }}>
                            <h3 style={{ margin: 0, fontSize: '0.95rem' }}>
                                {historyView === 'solved'
                                    ? '✅ Solved Problems'
                                    : historyView === 'starred'
                                        ? '⭐ Saved Problems'
                                        : '🧾 Submission History'}
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                    onClick={() => handleHistoryOpen('solved')}
                                    style={{
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '6px 10px',
                                        cursor: 'pointer',
                                        fontSize: '0.75rem',
                                        background: historyView === 'solved' ? 'rgba(234,179,8,0.2)' : 'rgba(255,255,255,0.08)',
                                        color: historyView === 'solved' ? '#facc15' : '#d1d5db'
                                    }}
                                >
                                    Solved
                                </button>
                                <button
                                    onClick={() => handleHistoryOpen('submissions')}
                                    style={{
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '6px 10px',
                                        cursor: 'pointer',
                                        fontSize: '0.75rem',
                                        background: historyView === 'submissions' ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.08)',
                                        color: historyView === 'submissions' ? '#60a5fa' : '#d1d5db'
                                    }}
                                >
                                    Submissions
                                </button>
                                <button
                                    onClick={() => handleHistoryOpen('starred')}
                                    style={{
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '6px 10px',
                                        cursor: 'pointer',
                                        fontSize: '0.75rem',
                                        background: historyView === 'starred' ? 'rgba(250,204,21,0.2)' : 'rgba(255,255,255,0.08)',
                                        color: historyView === 'starred' ? '#facc15' : '#d1d5db'
                                    }}
                                >
                                    Saved
                                </button>
                                <button
                                    onClick={() => setHistoryView(null)}
                                    style={{
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        borderRadius: '6px',
                                        padding: '6px 10px',
                                        cursor: 'pointer',
                                        fontSize: '0.75rem',
                                        background: 'transparent',
                                        color: 'var(--text-secondary, #9ca3af)'
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>

                        {historyLoading ? (
                            <p style={{ color: 'var(--text-muted, #888)' }}>Loading...</p>
                        ) : historyView === 'solved' ? (
                            <SolvedProblemsList solvedProblems={solvedHistory} />
                        ) : historyView === 'starred' ? (
                            <StarredProblemsList problems={starredHistory} />
                        ) : submissionsHistory.length > 0 ? (
                            <RecentSubmissions submissions={submissionsHistory} />
                        ) : (
                            <p style={{ color: 'var(--text-muted, #888)' }}>No submissions yet.</p>
                        )}

                        {((historyView === 'solved' && solvedPagination.hasMore) ||
                            (historyView === 'submissions' && submissionsPagination.hasMore)) && (
                                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '14px' }}>
                                    <button
                                        onClick={handleHistoryLoadMore}
                                        disabled={historyLoadingMore}
                                        style={{
                                            border: 'none',
                                            borderRadius: '8px',
                                            padding: '8px 16px',
                                            cursor: historyLoadingMore ? 'not-allowed' : 'pointer',
                                            background: 'rgba(59,130,246,0.2)',
                                            color: '#60a5fa',
                                            fontSize: '0.8rem',
                                            fontWeight: '600',
                                            opacity: historyLoadingMore ? 0.6 : 1
                                        }}
                                    >
                                        {historyLoadingMore ? 'Loading...' : 'Load More'}
                                    </button>
                                </div>
                            )}
                    </div>
                )}

                {/* =============== RECENT SUBMISSIONS =============== */}
                {isOwnProfile && recentSubs.length > 0 && (
                    <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <h3 style={{ margin: 0, fontSize: '0.95rem' }}>📂 Recent Submissions</h3>
                            <button
                                onClick={() => handleHistoryOpen('submissions')}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: 'var(--primary-teal)',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer'
                                }}
                            >
                                View All
                            </button>
                        </div>
                        <RecentSubmissions submissions={recentSubs} />
                    </div>
                )}

                {isOwnProfile && (
                    <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <h3 style={{ margin: 0, fontSize: '0.95rem' }}>📝 My Community Posts</h3>
                            <span style={{ color: 'var(--text-secondary, #9ca3af)', fontSize: '0.8rem' }}>
                                {communityPostsPagination.total || communityPostsHistory.length} posts
                            </span>
                        </div>

                        {communityPostsLoading && communityPostsHistory.length === 0 ? (
                            <p style={{ color: 'var(--text-muted, #888)' }}>Loading posts...</p>
                        ) : communityPostsHistory.length === 0 ? (
                            <p style={{ color: 'var(--text-muted, #888)' }}>No community posts yet.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {communityPostsHistory.map((post) => (
                                    <Link
                                        key={post._id}
                                        to={`/community?threadId=${post._id}`}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '11px 14px',
                                            borderRadius: '8px',
                                            background: 'rgba(255,255,255,0.03)',
                                            textDecoration: 'none',
                                            color: 'inherit'
                                        }}
                                    >
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                <FaComment size={12} style={{ color: '#60a5fa' }} />
                                                <span style={{ fontSize: '0.9rem', color: 'var(--text-primary, white)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {post.title || 'Untitled Post'}
                                                </span>
                                            </div>
                                            <p style={{ margin: 0, color: 'var(--text-secondary, #9ca3af)', fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {post.content}
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '14px', fontSize: '0.72rem', color: 'var(--text-muted, #888)' }}>
                                            <span>{post.likesCount || 0} likes</span>
                                            <span>{post.repliesCount || 0} replies</span>
                                            <span>{post.views || 0} views</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}

                        {communityPostsPagination.hasMore && (
                            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '14px' }}>
                                <button
                                    onClick={() => fetchCommunityPostsHistory((communityPostsPagination.page || 1) + 1, true)}
                                    disabled={communityPostsLoadingMore}
                                    style={{
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '8px 16px',
                                        cursor: communityPostsLoadingMore ? 'not-allowed' : 'pointer',
                                        background: 'rgba(96,165,250,0.2)',
                                        color: '#60a5fa',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        opacity: communityPostsLoadingMore ? 0.65 : 1
                                    }}
                                >
                                    {communityPostsLoadingMore ? 'Loading...' : 'Load More Posts'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

            </div>

            {/* Edit Profile Modal */}
            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                profileData={profile}
                onUpdate={(updatedProfile) => setProfile(updatedProfile)}
            />

            {/* Message Modal */}
            <AnimatePresence>
                {isMessageModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '400px', position: 'relative' }}
                        >
                            <button onClick={() => setIsMessageModalOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                                <FaTimes size={18} />
                            </button>
                            <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.25rem' }}>Message {userObj.username}</h2>
                            <form onSubmit={handleSendMessage}>
                                <textarea
                                    value={messageContent}
                                    onChange={(e) => setMessageContent(e.target.value)}
                                    placeholder="Type your message here..."
                                    rows={5}
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'rgba(255,255,255,0.05)', color: 'white', resize: 'vertical', marginBottom: '16px',
                                        fontSize: '0.95rem'
                                    }}
                                    required
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                    <button type="button" onClick={() => setIsMessageModalOpen(false)} style={{ padding: '8px 16px', background: 'transparent', color: '#9ca3af', border: 'none', cursor: 'pointer' }}>Cancel</button>
                                    <button
                                        type="submit"
                                        disabled={sendingMessage}
                                        style={{
                                            padding: '8px 20px', background: 'var(--primary-teal)', color: '#111827', border: 'none', borderRadius: '8px',
                                            fontWeight: '600', cursor: sendingMessage ? 'not-allowed' : 'pointer', opacity: sendingMessage ? 0.7 : 1
                                        }}
                                    >
                                        {sendingMessage ? 'Sending...' : 'Send'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                contentId={userObj?._id}
                contentType="Profile"
                reportedUserId={userObj?._id}
            />
        </div>
    );
};

export default Profile;



