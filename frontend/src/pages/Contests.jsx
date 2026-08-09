import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import {
    FaArrowRight,
    FaCalendarAlt,
    FaCheckCircle,
    FaClock,
    FaLock,
    FaTrophy,
    FaUserPlus,
    FaUsers
} from 'react-icons/fa';
import api from '../utils/api';

const normalizeContest = (contest = {}) => ({
    ...contest,
    _id: contest._id || contest.id,
    participantCount: contest.participantCount ?? contest.participantsCount ?? 0
});

const normalizeContestsPayload = (payload) => {
    if (Array.isArray(payload)) return payload.map(normalizeContest);

    if (payload && typeof payload === 'object') {
        return ['running', 'upcoming', 'completed']
            .flatMap((key) => Array.isArray(payload[key]) ? payload[key] : [])
            .map(normalizeContest);
    }

    return [];
};

const formatDate = (value) => new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
}).format(new Date(value));

const getDuration = (startTime, endTime) => {
    const durationMinutes = Math.max(0, Math.round((new Date(endTime) - new Date(startTime)) / 60000));
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    if (!hours) return `${minutes} min`;
    return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
};

const getCountdown = (startTime, nowMs) => {
    const difference = Math.max(0, new Date(startTime).getTime() - nowMs);
    const days = Math.floor(difference / 86400000);
    const hours = Math.floor((difference % 86400000) / 3600000);
    const minutes = Math.floor((difference % 3600000) / 60000);

    if (days) return `${days}d ${hours}h`;
    if (hours) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
};

const getContestState = (contest, nowMs) => {
    const now = new Date(nowMs);
    const startTime = new Date(contest.startTime);
    const endTime = new Date(contest.endTime);

    if (now >= startTime && now <= endTime) {
        return { key: 'live', label: 'Live now' };
    }

    if (now < startTime) {
        return { key: 'upcoming', label: 'Upcoming' };
    }

    return { key: 'completed', label: 'Completed' };
};

const ContestCard = ({ contest, onRegister, nowMs }) => {
    const { isAuthenticated } = useSelector((state) => state.auth);
    const [registering, setRegistering] = useState(false);
    const state = getContestState(contest, nowMs);
    const isLive = state.key === 'live';
    const isUpcoming = state.key === 'upcoming';
    const isCompleted = state.key === 'completed';
    const isRegistered = Boolean(contest.isRegistered);
    const registrationOpenDate = contest.registrationOpenDate ? new Date(contest.registrationOpenDate) : null;
    const registrationNotOpen = registrationOpenDate && Date.now() < registrationOpenDate.getTime();
    const canRegister = typeof contest.isRegistrationOpen === 'boolean'
        ? contest.isRegistrationOpen
        : isUpcoming;

    const handleRegister = async () => {
        if (!isAuthenticated) {
            toast.error('Login required to register');
            return;
        }

        setRegistering(true);
        try {
            await api.post(`/contests/${contest._id}/register`);
            toast.success('You are registered. Good luck!');
            onRegister();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Unable to register for this contest');
        } finally {
            setRegistering(false);
        }
    };

    return (
        <article className={`contest-card contest-card--${state.key}`}>
            <div className="contest-card-heading">
                <div>
                    <p className="contest-card-overline">{state.label}</p>
                    <h3>{contest.title}</h3>
                </div>
                <span className={`contest-status contest-status--${state.key}`}>{state.label}</span>
            </div>

            {contest.description && (
                <p className="contest-card-description">
                    {contest.description.length > 170
                        ? `${contest.description.slice(0, 170)}…`
                        : contest.description}
                </p>
            )}

            <dl className="contest-card-facts">
                <div>
                    <dt><FaCalendarAlt aria-hidden="true" /> Starts</dt>
                    <dd>{formatDate(contest.startTime)}</dd>
                </div>
                <div>
                    <dt><FaClock aria-hidden="true" /> Duration</dt>
                    <dd>{getDuration(contest.startTime, contest.endTime)}</dd>
                </div>
                <div>
                    <dt><FaUsers aria-hidden="true" /> Registered</dt>
                    <dd>{contest.participantCount}</dd>
                </div>
                {isUpcoming && (
                    <div>
                        <dt>Begins in</dt>
                        <dd>{getCountdown(contest.startTime, nowMs)}</dd>
                    </div>
                )}
            </dl>

            <div className="contest-card-actions">
                {isRegistered && (
                    <span className="contest-registration"><FaCheckCircle aria-hidden="true" /> Registered</span>
                )}

                {!isRegistered && registrationNotOpen && (
                    <span className="contest-registration contest-registration--muted">
                        <FaLock aria-hidden="true" /> Opens {formatDate(contest.registrationOpenDate)}
                    </span>
                )}

                {!isRegistered && isUpcoming && canRegister && !registrationNotOpen && (
                    <button type="button" className="content-button" onClick={handleRegister} disabled={registering}>
                        <FaUserPlus aria-hidden="true" />
                        {registering ? 'Registering…' : 'Register'}
                    </button>
                )}

                {isLive && isRegistered && (
                    <Link className="content-button" to={`/contest/${contest._id}`}>
                        Enter contest <FaArrowRight aria-hidden="true" />
                    </Link>
                )}

                {isLive && !isRegistered && (
                    <span className="contest-registration contest-registration--warning">
                        <FaLock aria-hidden="true" /> Registration is required to enter
                    </span>
                )}

                {isCompleted && (
                    <Link className="content-button content-button-secondary" to={`/contest/${contest._id}`}>
                        Review contest <FaArrowRight aria-hidden="true" />
                    </Link>
                )}
            </div>
        </article>
    );
};

const ContestSection = ({ title, detail, contests, nowMs, onRegister }) => {
    if (!contests.length) return null;

    return (
        <section className="contest-section" aria-labelledby={`contest-section-${title}`}>
            <header className="contest-section-heading">
                <div>
                    <p>{detail}</p>
                    <h2 id={`contest-section-${title}`}>{title}</h2>
                </div>
                <span>{contests.length}</span>
            </header>
            <div className="contest-list">
                {contests.map((contest) => (
                    <ContestCard key={contest._id} contest={contest} onRegister={onRegister} nowMs={nowMs} />
                ))}
            </div>
        </section>
    );
};

const Contests = () => {
    const [contests, setContests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [nowMs, setNowMs] = useState(() => Date.now());

    const fetchContests = useCallback(async ({ silent = false } = {}) => {
        try {
            const response = await api.get('/contests');
            setContests(normalizeContestsPayload(response.data.contests));
        } catch (error) {
            if (!silent) toast.error('Unable to load contests');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchContests();
    }, [fetchContests]);

    useEffect(() => {
        const clock = window.setInterval(() => setNowMs(Date.now()), 1000);
        const refresh = window.setInterval(() => fetchContests({ silent: true }), 15000);

        return () => {
            window.clearInterval(clock);
            window.clearInterval(refresh);
        };
    }, [fetchContests]);

    const contestGroups = useMemo(() => {
        const groups = { live: [], upcoming: [], completed: [] };

        contests.forEach((contest) => {
            groups[getContestState(contest, nowMs).key].push(contest);
        });

        return groups;
    }, [contests, nowMs]);

    if (loading) {
        return (
            <main className="content-page contest-page page-loading" aria-live="polite">
                <span aria-hidden="true" />
                <p>Loading contests</p>
            </main>
        );
    }

    const totalOpen = contestGroups.live.length + contestGroups.upcoming.length;

    return (
        <main className="content-page contest-page">
            <header className="contest-intro">
                <div className="content-page-intro">
                    <p className="content-kicker">Competitive programming</p>
                    <h1>Make practice count.</h1>
                    <p className="content-lede">
                        Choose a timed event, prepare with purpose, and review the work when the clock stops.
                    </p>
                </div>
                <div className="contest-intro-meta" aria-label="Contest overview">
                    <div>
                        <strong>{totalOpen}</strong>
                        <span>open events</span>
                    </div>
                    <div>
                        <strong>{contests.length}</strong>
                        <span>in the archive</span>
                    </div>
                    <Link to="/leaderboard" className="content-button content-button-secondary">
                        View standings <FaArrowRight aria-hidden="true" />
                    </Link>
                </div>
            </header>

            {contests.length ? (
                <div className="contest-sections">
                    <ContestSection
                        title="Live events"
                        detail="Available now"
                        contests={contestGroups.live}
                        nowMs={nowMs}
                        onRegister={fetchContests}
                    />
                    <ContestSection
                        title="Coming up"
                        detail="Plan ahead"
                        contests={contestGroups.upcoming}
                        nowMs={nowMs}
                        onRegister={fetchContests}
                    />
                    <ContestSection
                        title="Past events"
                        detail="Review and learn"
                        contests={contestGroups.completed}
                        nowMs={nowMs}
                        onRegister={fetchContests}
                    />
                </div>
            ) : (
                <section className="catalog-empty">
                    <FaTrophy aria-hidden="true" />
                    <h2>No events are scheduled yet.</h2>
                    <p>New contests will appear here as soon as they are published.</p>
                </section>
            )}
        </main>
    );
};

export default Contests;
