import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    FaArrowRight,
    FaCheck,
    FaChevronRight,
    FaCode,
    FaLayerGroup,
    FaRoute,
    FaTrophy
} from 'react-icons/fa';
import { algorithmList } from '../data/algorithmsData';
import api from '../utils/api';
import FollowButton from '../components/social/FollowButton';
import './Home.css';

const relativeTime = (value) => {
    const timestamp = new Date(value).getTime();
    if (!Number.isFinite(timestamp)) return '';

    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
};

const describeActivity = (item) => {
    const username = item?.user?.username || 'A learner';

    switch (item?.activityType) {
        case 'problem_solved':
            return `${username} solved ${item?.problem?.title ? `“${item.problem.title}”` : 'a problem'}`;
        case 'daily_challenge_completed':
            return `${username} completed today’s challenge`;
        case 'solution_posted':
            return `${username} posted a solution`;
        case 'discussion_created':
            return `${username} started a discussion`;
        case 'contest_joined':
            return `${username} joined a contest`;
        default:
            return `${username} has new activity`;
    }
};

const Home = () => {
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const [algorithmCount, setAlgorithmCount] = useState(null);
    const [socialLoading, setSocialLoading] = useState(false);
    const [socialWidgets, setSocialWidgets] = useState({
        activity: [],
        suggested: [],
        friendsLeaderboard: [],
        dailyChallenge: null,
        dailyChallengeUsers: []
    });
    const [suggestedFollowState, setSuggestedFollowState] = useState({});

    useEffect(() => {
        let cancelled = false;

        const loadHomeStats = async () => {
            try {
                const { data } = await api.get('/home/stats');
                const count = Number(data?.data?.algorithmsCount);
                if (!cancelled && Number.isFinite(count)) setAlgorithmCount(count);
            } catch {
                if (!cancelled) setAlgorithmCount(null);
            }
        };

        loadHomeStats();
        return () => {
            cancelled = true;
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
            return undefined;
        }

        let cancelled = false;
        setSocialLoading(true);

        const loadSocialWidgets = async () => {
            try {
                const [activityRes, suggestedRes, friendsRes, dailyRes] = await Promise.all([
                    api.get('/activity/feed', { params: { limit: 8 } }),
                    api.get('/suggested-users', { params: { limit: 5 } }),
                    api.get('/social/friends-leaderboard', { params: { limit: 5 } }),
                    api.get('/social/daily-challenge-activity', { params: { limit: 5 } })
                ]);

                if (cancelled) return;

                const suggested = Array.isArray(suggestedRes.data?.users) ? suggestedRes.data.users : [];
                setSocialWidgets({
                    activity: Array.isArray(activityRes.data?.items) ? activityRes.data.items : [],
                    suggested,
                    friendsLeaderboard: Array.isArray(friendsRes.data?.users) ? friendsRes.data.users : [],
                    dailyChallenge: dailyRes.data?.challenge || null,
                    dailyChallengeUsers: Array.isArray(dailyRes.data?.users) ? dailyRes.data.users : []
                });
                setSuggestedFollowState((previous) => {
                    const next = { ...previous };
                    suggested.forEach((entry) => {
                        const id = String(entry?._id || '');
                        if (id && !Object.hasOwn(next, id)) next[id] = Boolean(entry?.isFollowing);
                    });
                    return next;
                });
            } catch {
                if (!cancelled) {
                    setSocialWidgets({
                        activity: [],
                        suggested: [],
                        friendsLeaderboard: [],
                        dailyChallenge: null,
                        dailyChallengeUsers: []
                    });
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

    const libraryCount = Math.max(algorithmCount || algorithmList.length, algorithmList.length);
    const featuredAlgorithms = algorithmList.slice(0, 4);
    const activity = Array.isArray(socialWidgets.activity) ? socialWidgets.activity : [];
    const suggested = Array.isArray(socialWidgets.suggested) ? socialWidgets.suggested : [];
    const friends = Array.isArray(socialWidgets.friendsLeaderboard) ? socialWidgets.friendsLeaderboard : [];
    const dailyUsers = Array.isArray(socialWidgets.dailyChallengeUsers) ? socialWidgets.dailyChallengeUsers : [];

    const handleFollowStateChange = (targetUserId, nextState) => {
        const id = String(targetUserId || '');
        if (id) setSuggestedFollowState((previous) => ({ ...previous, [id]: Boolean(nextState) }));
    };

    return (
        <div className="home-page">
            <section className="home-intro" aria-labelledby="home-title">
                <div className="home-intro-copy">
                    <p className="home-eyebrow"><span>Kramaa</span> / a practical way to learn algorithms</p>
                    <h1 id="home-title">See every move.<br />Build better instincts.</h1>
                    <p className="home-lede">
                        A focused workspace for understanding the decisions inside an algorithm, then applying them under real constraints.
                    </p>
                    <div className="home-actions">
                        <Link to="/algorithms" className="home-button home-button-primary">
                            Explore visualizers <FaArrowRight aria-hidden="true" />
                        </Link>
                        <Link to="/coding-platform" className="home-button home-button-quiet">
                            Practice problems
                        </Link>
                    </div>
                    <dl className="home-proof-points" aria-label="Platform highlights">
                        <div>
                            <dt>{libraryCount}+</dt>
                            <dd>interactive algorithms</dd>
                        </div>
                        <div>
                            <dt>Step by step</dt>
                            <dd>not just the final output</dd>
                        </div>
                    </dl>
                </div>

                <article className="study-preview" aria-label="Bubble sort learning preview">
                    <div className="study-preview-header">
                        <div>
                            <p>Currently exploring</p>
                            <h2>Bubble sort</h2>
                        </div>
                        <span className="study-preview-state"><span /> Live trace</span>
                    </div>
                    <div className="study-sequence" aria-label="Array values 5, 1, 4, 2, 8">
                        {[5, 1, 4, 2, 8].map((value, index) => (
                            <div key={`${value}-${index}`} className={`study-bar study-bar-${index + 1}`}>
                                <span>{value}</span>
                            </div>
                        ))}
                    </div>
                    <div className="study-note">
                        <span className="study-note-marker">02</span>
                        <p><strong>Compare adjacent values</strong> and move the larger one to the right.</p>
                    </div>
                    <div className="study-preview-footer">
                        <span>Time: <strong>O(n²)</strong></span>
                        <Link to="/algorithms/sorting/bubble">Open lesson <FaChevronRight aria-hidden="true" /></Link>
                    </div>
                </article>
            </section>

            <section className="home-paths" aria-labelledby="paths-heading">
                <div className="home-section-heading home-section-heading-inline">
                    <div>
                        <p className="home-kicker">Choose your starting point</p>
                        <h2 id="paths-heading">Make the next session count.</h2>
                    </div>
                    <p>Each part of Kramaa has a distinct job: learn the model, test the implementation, then measure your growth.</p>
                </div>
                <div className="path-list">
                    <Link to="/foundations" className="path-row">
                        <span className="path-index">01</span>
                        <span className="path-icon"><FaRoute aria-hidden="true" /></span>
                        <span className="path-copy"><strong>Start learning from zero</strong><small>No coding experience needed—meet each DSA idea through stories, visuals, simple questions, and guided practice.</small></span>
                        <FaArrowRight className="path-arrow" aria-hidden="true" />
                    </Link>
                    <Link to="/algorithms" className="path-row">
                        <span className="path-index">02</span>
                        <span className="path-icon"><FaLayerGroup aria-hidden="true" /></span>
                        <span className="path-copy"><strong>Build the mental model</strong><small>Walk through every comparison, branch, and state change.</small></span>
                        <FaArrowRight className="path-arrow" aria-hidden="true" />
                    </Link>
                    <Link to="/coding-platform" className="path-row">
                        <span className="path-index">03</span>
                        <span className="path-icon"><FaCode aria-hidden="true" /></span>
                        <span className="path-copy"><strong>Put it into practice</strong><small>Work through curated problems in an uncluttered coding workspace.</small></span>
                        <FaArrowRight className="path-arrow" aria-hidden="true" />
                    </Link>
                    <Link to="/contests" className="path-row">
                        <span className="path-index">04</span>
                        <span className="path-icon"><FaTrophy aria-hidden="true" /></span>
                        <span className="path-copy"><strong>Work under pressure</strong><small>Join timed rounds and calibrate your decision-making.</small></span>
                        <FaArrowRight className="path-arrow" aria-hidden="true" />
                    </Link>
                </div>
            </section>

            <section className="home-library" aria-labelledby="library-heading">
                <div className="home-section-heading">
                    <p className="home-kicker">A library with purpose</p>
                    <h2 id="library-heading">Good places to begin.</h2>
                    <p>Short, visual lessons for the concepts that form the rest of your algorithmic vocabulary.</p>
                </div>
                <div className="algorithm-shelf">
                    {featuredAlgorithms.map((algorithm, index) => (
                        <Link to={algorithm.path} className="algorithm-shelf-item" key={algorithm.id}>
                            <span className="algorithm-shelf-number">0{index + 1}</span>
                            <span className="algorithm-shelf-meta">{algorithm.category} · {algorithm.difficulty}</span>
                            <h3>{algorithm.name}</h3>
                            <p>{algorithm.description}</p>
                            <span className="algorithm-shelf-link">Open visualizer <FaChevronRight aria-hidden="true" /></span>
                        </Link>
                    ))}
                </div>
                <Link to="/algorithms" className="home-inline-link">View the full library <FaArrowRight aria-hidden="true" /></Link>
            </section>

            <section className="home-practice" aria-labelledby="practice-heading">
                <div className="home-practice-copy">
                    <p className="home-kicker">For the work after the lesson</p>
                    <h2 id="practice-heading">Turn understanding into reliable execution.</h2>
                    <p>Move from an animated concept into a deliberate problem-solving loop—with filters, saved problems, daily challenges, and a full coding workspace.</p>
                    <Link to="/coding-platform" className="home-button home-button-dark">
                        Enter the practice arena <FaArrowRight aria-hidden="true" />
                    </Link>
                </div>
                <div className="practice-checklist" aria-label="Practice workspace features">
                    <div><span><FaCheck aria-hidden="true" /></span><p><strong>Curated problem sets</strong><small>Find the right difficulty and topic without extra noise.</small></p></div>
                    <div><span><FaCheck aria-hidden="true" /></span><p><strong>Useful progress signals</strong><small>See what you solve, revisit, and improve over time.</small></p></div>
                    <div><span><FaCheck aria-hidden="true" /></span><p><strong>One workspace per problem</strong><small>Read, write, run, and learn in the same place.</small></p></div>
                </div>
            </section>

            {isAuthenticated && (
                <section className="home-community" aria-labelledby="community-heading">
                    <div className="home-section-heading home-section-heading-inline">
                        <div>
                            <p className="home-kicker">Your learning circle</p>
                            <h2 id="community-heading">Stay connected to the work.</h2>
                        </div>
                        <Link to="/community" className="home-inline-link">Open community <FaArrowRight aria-hidden="true" /></Link>
                    </div>
                    <div className="community-grid">
                        <article className="community-panel community-activity">
                            <div className="community-panel-heading"><h3>Following</h3><span>{activity.length} updates</span></div>
                            {socialLoading && activity.length === 0 ? (
                                <p className="community-empty">Loading activity…</p>
                            ) : activity.length === 0 ? (
                                <p className="community-empty">Follow a few learners to see their recent work here.</p>
                            ) : (
                                <ul className="activity-list">
                                    {activity.slice(0, 5).map((item) => (
                                        <li key={item?._id || `${item?.activityType}-${item?.createdAt}`}>
                                            <Link to={item?.problem?.slug ? `/coding-platform/${item.problem.slug}` : item?.metadata?.threadLink || '/community'}>
                                                <span className="activity-dot" />
                                                <span><strong>{describeActivity(item)}</strong><small>{relativeTime(item?.createdAt)}</small></span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </article>

                        <article className="community-panel community-daily">
                            <div className="community-panel-heading"><h3>Today’s challenge</h3><FaRoute aria-hidden="true" /></div>
                            {socialWidgets.dailyChallenge ? (
                                <>
                                    <Link to={socialWidgets.dailyChallenge.slug ? `/coding-platform/${socialWidgets.dailyChallenge.slug}` : '/coding-platform'} className="daily-challenge-title">
                                        {socialWidgets.dailyChallenge.title}
                                    </Link>
                                    <p className="daily-challenge-meta">{socialWidgets.dailyChallenge.difficulty || 'Practice'} · {dailyUsers.filter((entry) => entry?.solved).length} completed</p>
                                    <div className="daily-avatars" aria-label="Challenge participants">
                                        {dailyUsers.slice(0, 5).map((entry) => <span key={entry?._id || entry?.username}>{entry?.username?.charAt(0).toUpperCase() || '?'}</span>)}
                                    </div>
                                </>
                            ) : <p className="community-empty">A fresh challenge will appear here when it’s ready.</p>}
                        </article>

                        <article className="community-panel community-people">
                            <div className="community-panel-heading"><h3>People to learn with</h3><span>Suggested</span></div>
                            {socialLoading && suggested.length === 0 ? (
                                <p className="community-empty">Finding people…</p>
                            ) : suggested.length === 0 ? (
                                <p className="community-empty">No suggestions right now.</p>
                            ) : (
                                <ul className="people-list">
                                    {suggested.slice(0, 4).map((entry) => {
                                        const id = String(entry?._id || '');
                                        return (
                                            <li key={id || entry?.username}>
                                                <Link to={`/profile/${entry?.username || ''}`}><span className="person-avatar">{entry?.username?.charAt(0).toUpperCase() || '?'}</span><span><strong>{entry?.username || 'Unknown learner'}</strong><small>{Number(entry?.problemsSolved || 0)} problems solved</small></span></Link>
                                                <FollowButton
                                                    targetUserId={id}
                                                    isSelf={id === String(user?._id || user?.id || '')}
                                                    size="sm"
                                                    initialFollowing={Boolean(suggestedFollowState[id])}
                                                    onStateChange={(nextState) => handleFollowStateChange(id, nextState)}
                                                />
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </article>

                        <article className="community-panel community-ranking">
                            <div className="community-panel-heading"><h3>Your circle</h3></div>
                            {socialLoading && friends.length === 0 ? (
                                <p className="community-empty">Loading standings…</p>
                            ) : friends.length === 0 ? (
                                <p className="community-empty">Your followed learners will show up here.</p>
                            ) : (
                                <ol className="ranking-list">
                                    {friends.slice(0, 4).map((entry) => (
                                        <li key={entry?._id || entry?.rank}><span>{entry?.rank || '—'}</span><Link to={`/profile/${entry?.username || ''}`}>{entry?.username || 'Unknown'}{entry?.isCurrentUser ? ' (You)' : ''}</Link><strong>{Number(entry?.problemsSolved || 0)}</strong></li>
                                    ))}
                                </ol>
                            )}
                        </article>
                    </div>
                </section>
            )}

            <section className="home-closing" aria-labelledby="closing-heading">
                <div>
                    <p className="home-kicker">A clearer way forward</p>
                    <h2 id="closing-heading">One good session can change how a problem feels.</h2>
                </div>
                <Link to={isAuthenticated ? '/coding-platform' : '/register'} className="home-button home-button-primary">
                    {isAuthenticated ? 'Choose a problem' : 'Create your account'} <FaArrowRight aria-hidden="true" />
                </Link>
            </section>
        </div>
    );
};

export default Home;
