import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProblems } from '../redux/slices/problemSlice';
import { loadUser } from '../redux/slices/authSlice';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import api, { getCurrentSocketBaseUrl, getSocketClientOptions } from '../utils/api';
import {
    FaFire, FaCheckCircle, FaLock, FaSearch, FaTrophy, FaBuilding,
    FaUserCircle, FaBookmark, FaRegBookmark, FaBolt, FaStar, FaClock,
    FaChevronRight, FaSort, FaFilter, FaChevronLeft
} from 'react-icons/fa';
import { getAuthUserStorageScope } from '../utils/sessionIsolation';
import '../styles/CodingPlatform.css';

const DISMISSED_CONTEST_STORAGE_KEY_PREFIX = 'coding_arena_dismissed_contest_ids_v2';

function getDismissedContestStorageKey(userScope) {
    const scope = String(userScope || 'guest').trim().toLowerCase() || 'guest';
    return `${DISMISSED_CONTEST_STORAGE_KEY_PREFIX}:${scope}`;
}

function loadDismissedContestIds(storageKey) {
    try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveDismissedContestIds(storageKey, idsSet) {
    try {
        localStorage.setItem(storageKey, JSON.stringify([...idsSet]));
    } catch {
        // ignore
    }
}

function formatContestDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

function toAnnouncementPayload(contest) {
    if (!contest) return null;
    const id = contest._id || contest.id || contest.contestId;
    if (!id) return null;
    return {
        contestId: String(id),
        title: contest.title || 'Untitled Contest',
        description: contest.description || '',
        startTime: contest.startTime,
        endTime: contest.endTime,
        registrationOpenDate: contest.registrationOpenDate || null
    };
}

function toContestArray(contests) {
    if (!contests) return [];
    if (Array.isArray(contests)) return contests;
    if (typeof contests === 'object') return Object.values(contests);
    return [];
}

function getLatestVisibleContest(contests, dismissedIdsSet) {
    const arr = toContestArray(contests);
    const now = new Date();
    const visible = arr
        .filter(c => {
            const id = String(c._id || c.id || c.contestId || '');
            if (!id || dismissedIdsSet.has(id)) return false;
            const start = new Date(c.startTime);
            return !isNaN(start.getTime()) && start > now;
        })
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    return visible.length > 0 ? visible[0] : null;
}

function normalizeId(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return String(value._id || value.id || value);
    return String(value);
}

function formatUtcDateKey(value) {
    const date = new Date(value);
    if (isNaN(date.getTime())) return null;
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatPercent(value) {
    const num = parseFloat(value);
    if (isNaN(num)) return '0%';
    return num.toFixed(1) + '%';
}

// ── XP helpers ──
function getXpForLevel(level) {
    return level * 200;
}

function getLevelTitle(level) {
    if (level >= 20) return 'Algorithm Grandmaster';
    if (level >= 15) return 'Code Architect';
    if (level >= 10) return 'Algorithm Explorer';
    if (level >= 7) return 'Problem Solver';
    if (level >= 4) return 'Rising Coder';
    return 'Beginner';
}

// ── Countdown helper ──
function getTimeUntilMidnight() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const diff = tomorrow - now;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// ── SVG Progress Ring Component ──
function ProgressRing({ solved, total, easy, medium, hard }) {
    const radius = 35;
    const safeRadius = Number.isFinite(radius) ? radius : 35;
    const circumference = 2 * Math.PI * safeRadius;
    const pct = total > 0 ? (solved / total) : 0;
    const offset = circumference * (1 - pct);

    return (
        <div className="cp-progress-ring">
            <svg width="80" height="80" viewBox="0 0 80 80">
                <circle className="ring-bg" cx="40" cy="40" r={safeRadius} />
                <circle
                    className="ring-fill"
                    cx="40" cy="40" r={safeRadius}
                    stroke="url(#ringGrad)"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ animation: 'progress-fill 1.2s ease-out both' }}
                />
                <defs>
                    <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#14b8a6" />
                        <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="cp-ring-center">
                <span className="ring-num">{solved}</span>
                <span className="ring-label">/ {total}</span>
            </div>
        </div>
    );
}

const CodingPlatform = () => {
    const dispatch = useDispatch();
    const { problems, isLoading, error } = useSelector(state => state.problems);
    const { user, isAuthenticated } = useSelector(state => state.auth);
    const userStorageScope = useMemo(() => getAuthUserStorageScope(user), [user]);
    const dismissedContestStorageKey = useMemo(
        () => getDismissedContestStorageKey(userStorageScope),
        [userStorageScope]
    );

    const [filter, setFilter] = useState({ difficulty: 'All', topic: 'All', company: 'All', status: 'All' });
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('default');
    const [solvedIDs, setSolvedIDs] = useState([]);
    const [bookmarkedIDs, setBookmarkedIDs] = useState([]);
    const [contestAnnouncement, setContestAnnouncement] = useState(null);
    const [countdown, setCountdown] = useState(getTimeUntilMidnight());
    const [calendarView, setCalendarView] = useState(() => {
        const now = new Date();
        return {
            year: now.getUTCFullYear(),
            month: now.getUTCMonth() + 1
        };
    });
    const [dailyCalendar, setDailyCalendar] = useState(null);
    const [dailyCalendarLoading, setDailyCalendarLoading] = useState(false);
    const dismissedContestIdsRef = useRef(null);
    const seenContestIdsRef = useRef(new Set());
    const safeProblems = Array.isArray(problems) ? problems : [];

    if (!dismissedContestIdsRef.current) {
        dismissedContestIdsRef.current = new Set(loadDismissedContestIds(dismissedContestStorageKey));
    }

    useEffect(() => {
        dismissedContestIdsRef.current = new Set(loadDismissedContestIds(dismissedContestStorageKey));
        setContestAnnouncement(null);
        seenContestIdsRef.current = new Set();
    }, [dismissedContestStorageKey]);

    const fetchDailyChallengeCalendar = useCallback(async ({ silent = false } = {}) => {
        if (!isAuthenticated) {
            setDailyCalendar(null);
            return;
        }

        if (!silent) setDailyCalendarLoading(true);
        try {
            const { data } = await api.get('/profiles/daily-challenge-calendar', {
                params: {
                    year: calendarView.year,
                    month: calendarView.month
                }
            });
            setDailyCalendar(data || null);
        } catch (error) {
            if (error?.response?.status !== 401 && error?.response?.status !== 403) {
                toast.error('Failed to load daily challenge tracker');
            }
        } finally {
            if (!silent) setDailyCalendarLoading(false);
        }
    }, [calendarView.month, calendarView.year, isAuthenticated]);

    useEffect(() => {
        dispatch(fetchProblems());
        if (isAuthenticated) {
            dispatch(loadUser());
        } else {
            setDailyCalendar(null);
        }
    }, [dispatch, isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated) return;
        fetchDailyChallengeCalendar();
    }, [fetchDailyChallengeCalendar, isAuthenticated]);

    useEffect(() => {
        const interval = setInterval(() => {
            dispatch(fetchProblems());
            if (isAuthenticated) {
                dispatch(loadUser());
                fetchDailyChallengeCalendar({ silent: true });
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [dispatch, fetchDailyChallengeCalendar, isAuthenticated]);

    useEffect(() => {
        if (!user) {
            setSolvedIDs([]);
            setBookmarkedIDs([]);
            return;
        }
        if (Array.isArray(user.solvedProblems)) {
            setSolvedIDs(user.solvedProblems.map(normalizeId).filter(Boolean));
        }
        if (Array.isArray(user.bookmarkedProblems)) {
            setBookmarkedIDs(user.bookmarkedProblems.map(normalizeId).filter(Boolean));
        }
    }, [user]);

    // Countdown timer
    useEffect(() => {
        const timer = setInterval(() => setCountdown(getTimeUntilMidnight()), 1000);
        return () => clearInterval(timer);
    }, []);

    const upsertContestAnnouncement = useCallback((contestPayload, shouldToast = false) => {
        const normalized = toAnnouncementPayload(contestPayload);
        if (!normalized) return;
        if (dismissedContestIdsRef.current.has(normalized.contestId)) return;
        if (seenContestIdsRef.current.has(normalized.contestId)) {
            setContestAnnouncement(prev => (prev && prev.contestId === normalized.contestId ? prev : normalized));
            return;
        }
        seenContestIdsRef.current.add(normalized.contestId);
        setContestAnnouncement(normalized);
        if (shouldToast) {
            toast.success(`New contest: ${normalized.title}`);
        }
    }, []);

    useEffect(() => {
        if (!isAuthenticated) {
            setContestAnnouncement(null);
            return;
        }

        const fetchLatestContestAnnouncement = async () => {
            try {
                const { data } = await api.get('/contests');
                const arr = toContestArray(data?.contests || data?.data || []);
                const latest = getLatestVisibleContest(arr, dismissedContestIdsRef.current);
                if (latest) upsertContestAnnouncement(latest);
            } catch { /* ignore */ }
        };

        fetchLatestContestAnnouncement();

        const socket = io(getCurrentSocketBaseUrl(), getSocketClientOptions());
        const handleContestPublished = (data) => {
            upsertContestAnnouncement(data, true);
        };
        socket.on('contest:published', handleContestPublished);

        return () => {
            try {
                socket.off('contest:published', handleContestPublished);
                socket.disconnect();
            } catch { /* ignore */ }
        };
    }, [isAuthenticated, upsertContestAnnouncement]);

    const dismissContestAnnouncement = () => {
        if (contestAnnouncement?.contestId) {
            dismissedContestIdsRef.current.add(contestAnnouncement.contestId);
            saveDismissedContestIds(dismissedContestStorageKey, dismissedContestIdsRef.current);
        }
        setContestAnnouncement(null);
    };

    // Bookmark toggle
    const handleBookmark = async (e, problemId) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) {
            toast.error('Please log in to bookmark problems');
            return;
        }
        try {
            const { data } = await api.post(`/problems/${problemId}/bookmark`);
            if (data.bookmarked) {
                setBookmarkedIDs(prev => [...prev, normalizeId(problemId)]);
            } else {
                setBookmarkedIDs(prev => prev.filter(id => id !== normalizeId(problemId)));
            }
        } catch {
            toast.error('Failed to update bookmark');
        }
    };

    // ── Computed values ──
    const uniqueCompanies = [...new Set(
        safeProblems.reduce((allCompanies, problem) => {
            const companies = Array.isArray(problem?.companies) ? problem.companies : [];
            return allCompanies.concat(companies);
        }, [])
    )].sort();
    const uniqueTopics = [...new Set(
        safeProblems.reduce((allTopics, problem) => {
            const topics = Array.isArray(problem?.topics)
                ? problem.topics
                : (problem?.topic ? [problem.topic] : []);
            return allTopics.concat(topics);
        }, [])
    )].sort();

    const filteredProblems = safeProblems.filter(p => {
        const matchesDiff = filter.difficulty === 'All' || p.difficulty === filter.difficulty;
        const matchesTopic = filter.topic === 'All' ||
            (p.topics && p.topics.includes(filter.topic)) ||
            p.topic === filter.topic;
        const matchesCompany = filter.company === 'All' || (p.companies && p.companies.includes(filter.company));
        const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
        const pid = normalizeId(p._id);
        const matchesStatus = filter.status === 'All' ||
            (filter.status === 'Solved' && solvedIDs.includes(pid)) ||
            (filter.status === 'Unsolved' && !solvedIDs.includes(pid)) ||
            (filter.status === 'Bookmarked' && bookmarkedIDs.includes(pid));
        return matchesDiff && matchesTopic && matchesCompany && matchesSearch && matchesStatus;
    });

    // Sort
    const sortedProblems = [...filteredProblems].sort((a, b) => {
        if (sortBy === 'acceptance') return (b.submissionAcceptanceRate || 0) - (a.submissionAcceptanceRate || 0);
        if (sortBy === 'difficulty') {
            const order = { Easy: 0, Medium: 1, Hard: 2 };
            return (order[a.difficulty] || 0) - (order[b.difficulty] || 0);
        }
        if (sortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        return (a.problemNumber || 0) - (b.problemNumber || 0);
    });

    const userAcceptanceRate = user?.stats?.totalSubmissions > 0
        ? (user.stats.acceptedSubmissions / user.stats.totalSubmissions) * 100
        : 0;

    const userLevel = user?.level || 1;
    const userXp = user?.xp || 0;
    const xpForNext = getXpForLevel(userLevel);
    const xpPct = xpForNext > 0 ? Math.min((userXp / xpForNext) * 100, 100) : 0;
    // Real-time streak computation
    const computeStreak = () => {
        const raw = user?.streak?.current || 0;
        const lastActive = user?.streak?.lastActive;
        if (!lastActive || raw === 0) return { current: raw, activeToday: false };
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const last = new Date(lastActive);
        last.setHours(0, 0, 0, 0);
        const daysDiff = Math.floor((today - last) / (24 * 60 * 60 * 1000));
        if (daysDiff > 1) return { current: 0, activeToday: false }; // streak broken
        return { current: raw, activeToday: daysDiff === 0 };
    };
    const streakData = computeStreak();
    const streak = streakData.current;
    const streakActiveToday = streakData.activeToday;
    const longestStreak = user?.streak?.longest || 0;
    const easySolved = user?.stats?.easySolved || user?.totalSolvedEasy || 0;
    const mediumSolved = user?.stats?.mediumSolved || user?.totalSolvedMedium || 0;
    const hardSolved = user?.stats?.hardSolved || user?.totalSolvedHard || 0;

    // Daily Challenge + Calendar
    const fallbackDailyProblem = safeProblems.length > 0
        ? safeProblems[Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24) % safeProblems.length]
        : null;

    const dailyProblem = dailyCalendar?.todayChallenge?.problem || fallbackDailyProblem;
    const dailyChallengeSolvedToday = Boolean(dailyCalendar?.todayChallenge?.solved);

    const calendarYear = Number(dailyCalendar?.year || calendarView.year);
    const calendarMonth = Number(dailyCalendar?.month || calendarView.month);
    const firstDayWeekOffset = new Date(Date.UTC(calendarYear, calendarMonth - 1, 1)).getUTCDay();
    const daysInCalendarMonth = new Date(Date.UTC(calendarYear, calendarMonth, 0)).getUTCDate();
    const todayDateKey = dailyCalendar?.today || formatUtcDateKey(new Date());
    const calendarLabel = dailyCalendar?.monthLabel || new Date(Date.UTC(calendarYear, calendarMonth - 1, 1)).toLocaleString('en-US', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC'
    });

    const challengeByDate = new Map(
        (Array.isArray(dailyCalendar?.challenges) ? dailyCalendar.challenges : [])
            .map((item) => [item.date, item])
    );

    const challengeCalendarCells = [];
    for (let i = 0; i < firstDayWeekOffset; i++) {
        challengeCalendarCells.push(null);
    }
    for (let day = 1; day <= daysInCalendarMonth; day++) {
        const dateKey = `${calendarYear}-${String(calendarMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        challengeCalendarCells.push({
            day,
            dateKey,
            data: challengeByDate.get(dateKey) || null,
            isToday: dateKey === todayDateKey,
            isFuture: todayDateKey ? dateKey > todayDateKey : false
        });
    }

    const canMoveCalendarForward = (() => {
        const now = new Date();
        const currentYear = now.getUTCFullYear();
        const currentMonth = now.getUTCMonth() + 1;
        if (calendarView.year < currentYear) return true;
        if (calendarView.year > currentYear) return false;
        return calendarView.month < currentMonth;
    })();

    const goToPreviousMonth = () => {
        setCalendarView((prev) => {
            if (prev.month === 1) {
                return { year: prev.year - 1, month: 12 };
            }
            return { year: prev.year, month: prev.month - 1 };
        });
    };

    const goToNextMonth = () => {
        if (!canMoveCalendarForward) return;
        setCalendarView((prev) => {
            if (prev.month === 12) {
                return { year: prev.year + 1, month: 1 };
            }
            return { year: prev.year, month: prev.month + 1 };
        });
    };

    if (isLoading && problems.length === 0) return (
        <div style={{ color: '#64748b', textAlign: 'center', padding: '80px 20px', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Loading</div>
            Loading Problems...
        </div>
    );

    if (error) return (
        <div style={{ color: '#f87171', textAlign: 'center', padding: '80px 20px', fontFamily: "'Inter', sans-serif" }}>
            Error: {error}
        </div>
    );

    return (
        <div className="main-content">
            <div className="cp-root">

                {/* ═══ HERO SECTION ═══ */}
                <div className="cp-hero">
                    <div>
                        <h1>
                            {user ? <>Welcome back, <span style={{ color: '#5eead4' }}>{user.username}</span> 👋</> : 'Practice Arena ⚔️'}
                        </h1>
                        <p className="cp-subtitle">Sharpen your skills. Conquer the interview.</p>
                        {user && (
                            <div className="cp-level-badge">
                                <FaStar style={{ color: '#fbbf24' }} />
                                <span>Level <span className="level-num">{userLevel}</span></span>
                                <span style={{ color: '#475569' }}>•</span>
                                <span>{getLevelTitle(userLevel)}</span>
                            </div>
                        )}
                    </div>
                    <Link
                        to="/profile"
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            textDecoration: 'none', background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8',
                            fontWeight: '600', padding: '8px 16px', borderRadius: '12px',
                            fontSize: '0.85rem', transition: 'all 0.2s'
                        }}
                    >
                        <FaUserCircle /> Profile
                    </Link>
                </div>

                {/* ═══ STAT CARDS ═══ */}
                <div className="cp-stats-grid">
                    {/* Card 1: Problems Solved (Progress Ring) */}
                    <motion.div className="cp-stat-card" whileHover={{ y: -4 }}>
                        <div className="cp-stat-label">Problems Solved</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <ProgressRing
                                solved={solvedIDs.length}
                                total={problems.length}
                                easy={easySolved}
                                medium={mediumSolved}
                                hard={hardSolved}
                            />
                            <div className="cp-diff-breakdown">
                                <div className="cp-diff-row">
                                    <div className="cp-diff-dot" style={{ background: '#4ade80' }} />
                                    <span style={{ color: '#94a3b8' }}>Easy</span>
                                    <span>{easySolved}</span>
                                </div>
                                <div className="cp-diff-row">
                                    <div className="cp-diff-dot" style={{ background: '#facc15' }} />
                                    <span style={{ color: '#94a3b8' }}>Medium</span>
                                    <span>{mediumSolved}</span>
                                </div>
                                <div className="cp-diff-row">
                                    <div className="cp-diff-dot" style={{ background: '#f87171' }} />
                                    <span style={{ color: '#94a3b8' }}>Hard</span>
                                    <span>{hardSolved}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Card 2: Streak */}
                    <motion.div className="cp-stat-card" whileHover={{ y: -4 }}>
                        <div className="cp-stat-label">Current Streak</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span className="cp-streak-fire">{streak > 0 ? '🔥' : '❄️'}</span>
                            <div>
                                <div className="cp-stat-value" style={{ color: streak > 0 ? '#fb923c' : '#64748b' }}>{streak}</div>
                                <div className="cp-stat-sub">day{streak !== 1 ? 's' : ''}</div>
                            </div>
                        </div>
                        {isAuthenticated && (
                            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{
                                    width: '6px', height: '6px', borderRadius: '50%',
                                    background: streakActiveToday ? '#22c55e' : '#eab308',
                                    boxShadow: streakActiveToday ? '0 0 6px rgba(34,197,94,0.5)' : 'none'
                                }} />
                                <span style={{ fontSize: '0.72rem', color: streakActiveToday ? '#4ade80' : '#fbbf24', fontWeight: '500' }}>
                                    {streakActiveToday ? 'Active today ✓' : 'Solve a problem to keep streak!'}
                                </span>
                            </div>
                        )}
                        <div className="cp-stat-sub" style={{ marginTop: '6px' }}>
                            Longest: <span style={{ color: '#94a3b8', fontWeight: '600' }}>{longestStreak} days</span>
                        </div>
                    </motion.div>

                    {/* Card 3: XP & Level */}
                    <motion.div className="cp-stat-card" whileHover={{ y: -4 }}>
                        <div className="cp-stat-label">Experience Points</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                            <div className="cp-stat-value" style={{ color: '#c4b5fd' }}>{userXp}</div>
                            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: '500' }}>XP</span>
                        </div>
                        <div className="cp-xp-bar-track">
                            <div className="cp-xp-bar-fill" style={{ width: `${xpPct}%` }} />
                        </div>
                        <div className="cp-stat-sub" style={{ marginTop: '6px' }}>
                            {xpForNext - userXp} XP to Level {userLevel + 1}
                        </div>
                    </motion.div>

                    {/* Card 4: Acceptance Rate */}
                    <motion.div className="cp-stat-card" whileHover={{ y: -4 }}>
                        <div className="cp-stat-label">Acceptance Rate</div>
                        <div className="cp-stat-value" style={{ color: '#34d399' }}>
                            {formatPercent(userAcceptanceRate)}
                        </div>
                        <div className="cp-stat-sub" style={{ marginTop: '6px' }}>
                            {user?.stats?.acceptedSubmissions || 0} / {user?.stats?.totalSubmissions || 0} submissions
                        </div>
                        <div className="cp-xp-bar-track" style={{ marginTop: '10px' }}>
                            <div style={{
                                height: '100%', borderRadius: '4px',
                                background: 'linear-gradient(90deg, #22c55e, #14b8a6)',
                                width: `${Math.min(userAcceptanceRate, 100)}%`,
                                transition: 'width 0.8s ease'
                            }} />
                        </div>
                    </motion.div>
                </div>

                {/* ═══ CONTEST ANNOUNCEMENT ═══ */}
                {isAuthenticated && contestAnnouncement && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="cp-contest-banner"
                    >
                        <div className="cp-contest-info">
                            <div className="cp-contest-label">📢 Contest Announcement</div>
                            <div className="cp-contest-title">{contestAnnouncement.title}</div>
                            {contestAnnouncement.description && (
                                <p style={{ margin: '0 0 6px', color: '#94a3b8', fontSize: '0.85rem' }}>{contestAnnouncement.description}</p>
                            )}
                            <div className="cp-contest-date">
                                Starts: {formatContestDate(contestAnnouncement.startTime)}
                            </div>
                        </div>
                        <div className="cp-contest-actions">
                            <Link
                                to={contestAnnouncement.contestId ? `/contest/${contestAnnouncement.contestId}` : '/contests'}
                                className="cp-contest-btn primary"
                            >
                                View Contest
                            </Link>
                            <button onClick={dismissContestAnnouncement} className="cp-contest-btn secondary">
                                Dismiss
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Daily Challenge */}
                {dailyProblem && (
                    <motion.div
                        className="cp-daily-card"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                            <div style={{ flex: 1, minWidth: '260px' }}>
                                <div className="cp-daily-badge">
                                    <FaFire style={{ color: '#f59e0b' }} /> Daily Challenge
                                </div>
                                <h2 className="cp-daily-title">{dailyProblem.title}</h2>
                                <div className="cp-daily-meta">
                                    <span className={`cp-diff-badge ${dailyProblem.difficulty?.toLowerCase()}`}>
                                        {dailyProblem.difficulty}
                                    </span>
                                    {dailyProblem.topics && dailyProblem.topics.length > 0 && (
                                        <span className="cp-tag-chip" style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>
                                            {dailyProblem.topics[0]}
                                        </span>
                                    )}
                                    <div className="cp-countdown">
                                        <FaClock /> {countdown}
                                    </div>
                                    <div className="cp-xp-reward">
                                        <FaBolt /> +50 XP
                                    </div>
                                    {isAuthenticated && (
                                        <div className={`cp-daily-status ${dailyChallengeSolvedToday ? 'solved' : 'pending'}`}>
                                            {dailyChallengeSolvedToday ? 'Solved today' : 'Not solved today'}
                                        </div>
                                    )}
                                </div>
                                <Link to={`/coding-platform/${dailyProblem.slug || dailyProblem._id}`} className="cp-solve-btn">
                                    <FaChevronRight /> Solve Challenge
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}

                {isAuthenticated && (
                    <motion.div
                        className="cp-calendar-card"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="cp-calendar-header">
                            <div>
                                <div className="cp-calendar-title">Daily Challenge Tracker</div>
                                <div className="cp-calendar-subtitle">
                                    {dailyCalendar
                                        ? `${dailyCalendar.solvedDays}/${dailyCalendar.totalDays} solved this month (${dailyCalendar.completionRate || 0}%)`
                                        : 'Track solved challenges day by day'}
                                </div>
                            </div>

                            <div className="cp-calendar-nav">
                                <button
                                    type="button"
                                    className="cp-calendar-nav-btn"
                                    onClick={goToPreviousMonth}
                                    aria-label="Previous month"
                                >
                                    <FaChevronLeft />
                                </button>
                                <span className="cp-calendar-month">{calendarLabel}</span>
                                <button
                                    type="button"
                                    className="cp-calendar-nav-btn"
                                    onClick={goToNextMonth}
                                    disabled={!canMoveCalendarForward}
                                    aria-label="Next month"
                                >
                                    <FaChevronRight />
                                </button>
                            </div>
                        </div>

                        <div className="cp-calendar-weekdays">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName) => (
                                <span key={dayName}>{dayName}</span>
                            ))}
                        </div>

                        <div className="cp-calendar-grid">
                            {challengeCalendarCells.map((cell, index) => {
                                if (!cell) {
                                    return <div key={`blank-${index}`} className="cp-calendar-cell empty" />;
                                }

                                const solved = Boolean(cell.data?.solved);
                                const stateClass = solved ? 'solved' : (cell.isFuture ? 'future' : 'missed');
                                const challengePath = cell.data?.problem?.slug || cell.data?.problem?._id;

                                return (
                                    <Link
                                        key={cell.dateKey}
                                        to={challengePath ? `/coding-platform/${challengePath}` : '#'}
                                        className={`cp-calendar-cell ${stateClass} ${cell.isToday ? 'today' : ''}`}
                                        title={cell.data?.problem?.title
                                            ? `${cell.dateKey} - ${cell.data.problem.title} (${solved ? 'Solved' : (cell.isFuture ? 'Upcoming' : 'Not solved')})`
                                            : cell.dateKey
                                        }
                                        onClick={(event) => {
                                            if (!challengePath) event.preventDefault();
                                        }}
                                    >
                                        <span className="cp-calendar-day">{cell.day}</span>
                                        <span className={`cp-calendar-mark ${stateClass}`}>
                                            {solved ? <>&#10003;</> : <>&bull;</>}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>

                        <div className="cp-calendar-legend">
                            <span><span className="cp-legend-dot solved">&#10003;</span> Solved</span>
                            <span><span className="cp-legend-dot missed">&bull;</span> Missed</span>
                            <span><span className="cp-legend-dot future">&bull;</span> Upcoming</span>
                            {dailyCalendarLoading && <span className="cp-calendar-loading">Updating...</span>}
                        </div>
                    </motion.div>
                )}

                {/* ═══ FILTER BAR ═══ */}
                <div className="cp-filter-bar">
                    <div className="cp-search-box">
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search problems..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="cp-filter-pill"
                        value={filter.difficulty}
                        onChange={(e) => setFilter(f => ({ ...f, difficulty: e.target.value }))}
                    >
                        <option value="All">Difficulty: All</option>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                    </select>
                    <select
                        className="cp-filter-pill"
                        value={filter.topic}
                        onChange={(e) => setFilter(f => ({ ...f, topic: e.target.value }))}
                    >
                        <option value="All">Topic: All</option>
                        {uniqueTopics.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select
                        className="cp-filter-pill"
                        value={filter.company}
                        onChange={(e) => setFilter(f => ({ ...f, company: e.target.value }))}
                    >
                        <option value="All">Company: All</option>
                        {uniqueCompanies.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select
                        className="cp-filter-pill"
                        value={filter.status}
                        onChange={(e) => setFilter(f => ({ ...f, status: e.target.value }))}
                    >
                        <option value="All">Status: All</option>
                        <option value="Solved">Solved</option>
                        <option value="Unsolved">Unsolved</option>
                        <option value="Bookmarked">Bookmarked</option>
                    </select>
                    <select
                        className="cp-sort-pill"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="default">Sort: Default</option>
                        <option value="acceptance">Acceptance ↓</option>
                        <option value="difficulty">Difficulty ↑</option>
                        <option value="newest">Newest First</option>
                    </select>
                    <span className="cp-filter-count">
                        {sortedProblems.length} problem{sortedProblems.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* ═══ PROBLEM LIST ═══ */}
                <div className="cp-problem-list">
                    {/* Header */}
                    <div className="cp-problem-header">
                        <span>Status</span>
                        <span>#</span>
                        <span>Title</span>
                        <span>Difficulty</span>
                        <span>Acceptance</span>
                        <span>Companies</span>
                        <span></span>
                    </div>

                    {sortedProblems.map((problem, index) => {
                        const pid = normalizeId(problem._id);
                        const isSolved = solvedIDs.includes(pid);
                        const isBookmarked = bookmarkedIDs.includes(pid);
                        const acceptance = problem.submissionAcceptanceRate || 0;

                        return (
                            <motion.div
                                key={problem._id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: Math.min(index * 0.02, 0.5) }}
                            >
                                <Link
                                    to={`/coding-platform/${problem.slug || problem._id}`}
                                    className="cp-problem-row"
                                    style={{ textDecoration: 'none' }}
                                >
                                    {/* Status */}
                                    <div className={`cp-status-dot ${isSolved ? 'solved' : 'unsolved'}`}>
                                        {isSolved && <FaCheckCircle style={{ fontSize: '0.7rem' }} />}
                                    </div>

                                    {/* Number */}
                                    <span className="cp-problem-num">{problem.problemNumber || '—'}</span>

                                    {/* Title + Tags */}
                                    <div className="cp-problem-title-col">
                                        <span className="cp-problem-title">{problem.title}</span>
                                        <div className="cp-problem-tags">
                                            {(problem.topics || (problem.topic ? [problem.topic] : [])).slice(0, 3).map(t => (
                                                <span key={t} className="cp-tag-chip">{t}</span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Difficulty Badge */}
                                    <span className={`cp-diff-badge ${problem.difficulty?.toLowerCase()}`}>
                                        {problem.difficulty}
                                    </span>

                                    {/* Acceptance */}
                                    <div className="cp-accept-col">
                                        <span className="cp-accept-text">{formatPercent(acceptance)}</span>
                                        <div className="cp-accept-bar">
                                            <div className="cp-accept-bar-fill" style={{ width: `${Math.min(acceptance, 100)}%` }} />
                                        </div>
                                    </div>

                                    {/* Companies */}
                                    <div className="cp-company-chips">
                                        {(problem.companies || []).slice(0, 2).map((c, idx) => (
                                            <span key={`${c}-${idx}`} className="cp-company-chip">{c}</span>
                                        ))}
                                    </div>

                                    {/* Bookmark */}
                                    <button
                                        className={`cp-bookmark-btn ${isBookmarked ? 'active' : ''}`}
                                        onClick={(e) => handleBookmark(e, problem._id)}
                                        title={isBookmarked ? 'Remove bookmark' : 'Bookmark this problem'}
                                    >
                                        {isBookmarked ? <FaBookmark /> : <FaRegBookmark />}
                                    </button>
                                </Link>
                            </motion.div>
                        );
                    })}

                    {sortedProblems.length === 0 && (
                        <div className="cp-empty-state">
                            <div className="empty-icon">🔍</div>
                            <p>No problems found matching your filters.</p>
                            <button
                                className="cp-clear-btn"
                                onClick={() => {
                                    setFilter({ difficulty: 'All', topic: 'All', company: 'All', status: 'All' });
                                    setSearchTerm('');
                                    setSortBy('default');
                                }}
                            >
                                Clear All Filters
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CodingPlatform;
