
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import SubmissionResultModal from '../components/coding/SubmissionResultModal';
import ReportModal from '../components/common/ReportModal';
import PerformanceGraphModal from '../components/coding/PerformanceGraphModal';
import CodeEditor from '../components/coding/CodeEditor';
import FollowButton from '../components/social/FollowButton';
import api, { getCurrentSocketBaseUrl, getSocketClientOptions } from '../utils/api';
import { fetchProblem, likeProblem, unlikeProblem } from '../redux/slices/problemSlice';
import { loadUser } from '../redux/slices/authSlice';
import { generateTemplates } from '../utils/templateGenerator';
import { formatTestCaseInput, formatTestCaseOutput } from '../utils/testCaseDisplay';
import { getRequestErrorMessage } from '../utils/requestError';
import {
    buildProblemDraftStorageKey,
    clearLegacyUnscopedEditorDrafts,
    getAuthUserStorageScope,
    readEditorDraft,
    writeEditorDraft
} from '../utils/sessionIsolation';
import { FaPlay, FaCheckCircle, FaExclamationCircle, FaArrowLeft, FaClock, FaCode, FaLightbulb, FaChevronDown, FaChevronUp, FaChevronLeft, FaChevronRight, FaRandom, FaList, FaThumbsUp, FaThumbsDown, FaShareAlt, FaSearch, FaTimes, FaTrash, FaPaperPlane, FaUserCircle, FaBars, FaEdit, FaFlag, FaHeart, FaRegHeart, FaReply, FaSortAmountDown, FaEllipsisH, FaExpand, FaCompress, FaSpinner, FaStar } from 'react-icons/fa';
import io from 'socket.io-client';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import '../styles/Workspace.css';

const SUBMISSION_REQUEST_TIMEOUT_MS = 120000;
const RUN_REQUEST_TIMEOUT_MS = 60000;

const ProblemWorkspace = () => {
    const { id } = useParams();
    const problemId = id?.trim(); // Handle potential URL encoding spaces
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useSelector(state => state.auth);
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
    const currentUserId = (user?.id || user?._id || '').toString();
    const solvedProblemIds = useMemo(() => (
        Array.isArray(user?.solvedProblems)
            ? user.solvedProblems
                .map((p) => (typeof p === 'string' ? p : (p?._id || p?.id)))
                .filter(Boolean)
                .map((p) => p.toString())
            : []
    ), [user?.solvedProblems]);
    const userStorageScope = useMemo(() => getAuthUserStorageScope(user), [user]);

    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [language, setLanguage] = useState('javascript');
    const [code, setCode] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [loadingType, setLoadingType] = useState(null); // 'run' or 'submit'
    const [submissionResult, setSubmissionResult] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
    const [performanceGraphData, setPerformanceGraphData] = useState(null);
    const [performanceGraphLoading, setPerformanceGraphLoading] = useState(false);
    const [performanceGraphError, setPerformanceGraphError] = useState('');
    const [performanceSubmissionLoadingId, setPerformanceSubmissionLoadingId] = useState(null);
    const [activePerformanceSubmissionId, setActivePerformanceSubmissionId] = useState(null);

    // Timer state
    const [timerSeconds, setTimerSeconds] = useState(0);
    const [timerActive, setTimerActive] = useState(false);

    // Tab state
    const [activeTab, setActiveTab] = useState('Description');

    // Toggle Expand Logic
    const toggleExpand = (panel) => {
        if (expandedPanel === panel) {
            setExpandedPanel(null);
        } else {
            setExpandedPanel(panel);
        }
    };
    const [hintsExpanded, setHintsExpanded] = useState(false);

    // Submissions state
    const [userSubmissions, setUserSubmissions] = useState([]);
    const [fetchingSubmissions, setFetchingSubmissions] = useState(false);
    const [publicSolutions, setPublicSolutions] = useState([]);
    const [fetchingSolutions, setFetchingSolutions] = useState(false);
    const [solutionsPage, setSolutionsPage] = useState(1);
    const [solutionsHasMore, setSolutionsHasMore] = useState(false);
    const [solutionsSort, setSolutionsSort] = useState('latest');
    const [expandedSolutions, setExpandedSolutions] = useState({});
    const [solutionsFollowMap, setSolutionsFollowMap] = useState({});

    // Problem list state
    const [allProblems, setAllProblems] = useState([]);
    const [showProblemList, setShowProblemList] = useState(false);
    const [problemSearchQuery, setProblemSearchQuery] = useState('');

    // Like/Dislike state
    const [isReacting, setIsReacting] = useState(false);
    const [bookmarkLoading, setBookmarkLoading] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [activeUsersCount, setActiveUsersCount] = useState(0);
    const [viewportWidth, setViewportWidth] = useState(() => (
        typeof window !== 'undefined' ? window.innerWidth : 1400
    ));
    const [headerHeight, setHeaderHeight] = useState(56);

    // Expanded Panel State
    const [expandedPanel, setExpandedPanel] = useState(null); // 'left', 'editor', 'console'
    const headerRef = useRef(null);
    const leftPanelRef = useRef(null);
    const rightPanelRef = useRef(null);
    const editorPanelRef = useRef(null);
    const consolePanelRef = useRef(null);

    // Solved State
    const [isSolved, setIsSolved] = useState(false);

    // Doubts state
    const [doubts, setDoubts] = useState([]);
    const [fetchingDoubts, setFetchingDoubts] = useState(false);
    const [doubtContent, setDoubtContent] = useState('');
    const [postingDoubt, setPostingDoubt] = useState(false);
    const [discussionsEnabled, setDiscussionsEnabled] = useState(true);
    const [doubtSort, setDoubtSort] = useState('recent');
    const [doubtPage, setDoubtPage] = useState(1);
    const [doubtHasMore, setDoubtHasMore] = useState(false);
    const [doubtTotal, setDoubtTotal] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);
    const [repliesMap, setRepliesMap] = useState({}); // commentId -> { replies: [], hasMore, page }
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [postingReply, setPostingReply] = useState(false);
    const [editingDoubt, setEditingDoubt] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [reportData, setReportData] = useState({ isOpen: false, contentId: null, contentType: 'Doubt', reportedUserId: null });

    // Editorial state
    const [editorialData, setEditorialData] = useState(null);
    const [editorialPublished, setEditorialPublished] = useState(false);
    const [editorialLoading, setEditorialLoading] = useState(false);
    const [editorialEditing, setEditorialEditing] = useState(false);
    const [editorialSaving, setEditorialSaving] = useState(false);
    const [editorialApproaches, setEditorialApproaches] = useState([]);

    const bookmarkedProblemIds = useMemo(() => (
        Array.isArray(user?.bookmarkedProblems)
            ? user.bookmarkedProblems
                .map((p) => (typeof p === 'string' ? p : (p?._id || p?.id)))
                .filter(Boolean)
                .map((p) => p.toString())
            : []
    ), [user?.bookmarkedProblems]);

    // Refs for scrolling
    const topicsRef = useRef(null);
    const companiesRef = useRef(null);
    const constraintsRef = useRef(null);
    const hintsRef = useRef(null);
    const descriptionScrollRef = useRef(null);

    const updateViewportMetrics = useCallback(() => {
        if (typeof window === 'undefined') return;
        setViewportWidth(window.innerWidth);

        if (headerRef.current) {
            const measuredHeight = Math.ceil(headerRef.current.getBoundingClientRect().height);
            if (Number.isFinite(measuredHeight) && measuredHeight > 0) {
                setHeaderHeight(measuredHeight);
            }
        }
    }, []);

    // Fetch Problem
    useEffect(() => {
        updateViewportMetrics();
        window.addEventListener('resize', updateViewportMetrics);
        return () => window.removeEventListener('resize', updateViewportMetrics);
    }, [updateViewportMetrics]);

    useEffect(() => {
        const fetchProblemData = async () => {
            if (!problemId) return;

            // Clear previous state before fetching
            setProblem(null);
            setCode('');
            setSubmissionResult(null);
            setDoubts([]);
            setEditorialData(null);
            setPublicSolutions([]);
            setSolutionsPage(1);
            setSolutionsHasMore(false);
            setExpandedSolutions({});
            setSolutionsFollowMap({});
            setActiveTab('Description');

            try {
                setLoading(true);
                const res = await api.get(`/problems/${problemId}`);
                setProblem(res.data.problem);
            } catch (err) {
                toast.error("Failed to load problem");
            } finally {
                setLoading(false);
            }
        };
        fetchProblemData();
    }, [problemId]);

    // Fetch all problems for navigation
    useEffect(() => {
        const fetchAll = async () => {
            try {
                const res = await api.get('/problems');
                setAllProblems(res.data.problems || []);
            } catch (err) {
                console.error("Failed to fetch problems list");
            }
        };
        fetchAll();
    }, []);

    const getStarterTemplate = useCallback((problemData, lang) => {
        if (!problemData) return '';
        const fromProblem = problemData.starterCode?.[lang];
        if (typeof fromProblem === 'string' && fromProblem.trim().length > 0) {
            return fromProblem;
        }

        const generatedTemplates = generateTemplates(
            problemData.className || 'Solution',
            problemData.functionName || 'solve',
            problemData.returnType || 'void',
            problemData.parameters || []
        );
        return generatedTemplates?.[lang] || '';
    }, []);

    const getDraftStorageKey = useCallback((pid, lang) => {
        if (!isAuthenticated || !userStorageScope) return null;
        return buildProblemDraftStorageKey({
            problemId: pid,
            language: lang,
            userScope: userStorageScope
        });
    }, [isAuthenticated, userStorageScope]);

    useEffect(() => {
        clearLegacyUnscopedEditorDrafts();
    }, []);

    // Load code when problem or language changes
    useEffect(() => {
        if (!problem || !problemId) return;
        const starterTemplate = getStarterTemplate(problem, language);
        const storageKey = getDraftStorageKey(problemId, language);
        const savedDraft = readEditorDraft({
            storageKey,
            starterTemplate
        });

        if (typeof savedDraft === 'string' && savedDraft.trim().length > 0) {
            setCode(savedDraft);
            return;
        }

        setCode(starterTemplate);
    }, [problem, language, problemId, getStarterTemplate, getDraftStorageKey]);

    // Auto-save code
    useEffect(() => {
        if (!problemId) return;
        const storageKey = getDraftStorageKey(problemId, language);
        if (!storageKey) return;

        writeEditorDraft({
            storageKey,
            code,
            starterTemplate: getStarterTemplate(problem, language)
        });
    }, [code, language, problemId, problem, getStarterTemplate, getDraftStorageKey]);

    // Timer logic
    useEffect(() => {
        let interval = null;
        if (timerActive) {
            interval = setInterval(() => setTimerSeconds(s => s + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timerActive]);

    // Fetch submissions when tab changes or on mount to check solved status
    useEffect(() => {
        if (isAuthenticated && problem) {
            fetchUserSubmissions();
        }
    }, [activeTab, problem, isAuthenticated]);

    useEffect(() => {
        if (activeTab !== 'Solutions' || !problem?._id) return;
        fetchPublicSolutions(1, false);
    }, [activeTab, problem?._id, solutionsSort]);

    // Check solved status when submissions change
    useEffect(() => {
        const solvedFromSubmissions = userSubmissions.some(sub => sub.status === 'accepted');
        const solvedFromProfile = !!problem?._id && solvedProblemIds.includes(problem._id.toString());
        setIsSolved(Boolean(solvedFromProfile || solvedFromSubmissions));
    }, [userSubmissions, problem?._id, solvedProblemIds]);

    useEffect(() => {
        const pid = problem?._id?.toString();
        if (!pid) {
            setIsBookmarked(false);
            return;
        }
        setIsBookmarked(bookmarkedProblemIds.includes(pid));
    }, [problem?._id, bookmarkedProblemIds]);

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} `;
    };

    const formatSubmissionStatus = (status) => {
        if (!status) return 'Unknown';
        return status
            .toString()
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const formatTestCaseSummary = (submission) => {
        const total = Math.max(0, Math.trunc(Number(submission?.totalTestCases) || 0));
        const passedRaw = Math.max(0, Math.trunc(Number(submission?.testCasesPassed) || 0));
        if (total <= 0) return '-';
        const passed = Math.min(passedRaw, total);
        return `${passed}/${total}`;
    };

    const formatInputDisplay = (inputStr, parameters) => formatTestCaseInput(inputStr, parameters);
    const formatOutputDisplay = (value) => formatTestCaseOutput(value);

    const handleSubmit = async () => {
        if (!isAuthenticated) return toast.error("Login required");
        if (isAdmin) return toast.error("Admin accounts are view-only for submissions");
        if (isRunning || !problem?._id) return;
        setIsRunning(true);
        setLoadingType('submit');
        setSubmissionResult(null);
        try {
            const submitRes = await api.post('/submissions/submit', {
                code, language, problemId: problem._id
            }, {
                timeout: SUBMISSION_REQUEST_TIMEOUT_MS
            });
            setSubmissionResult(submitRes.data);
            setIsModalOpen(true);
            if (submitRes.data.submission.status === 'accepted') {
                confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
                toast.success("All Test Cases Passed!");
                setIsSolved(true);
                // Reload user to update solvedProblems list
                dispatch(loadUser());
            } else {
                toast.error("Some test cases failed.");
            }
        } catch (error) {
            const message = getRequestErrorMessage(error, 'Submission failed');
            toast.error(message);
            setSubmissionResult({ error: message });
        } finally {
            setIsRunning(false);
            setLoadingType(null);
        }
    };

    const handleRun = async () => {
        if (!isAuthenticated) return toast.error("Login required");
        if (isRunning || !problem?._id) return;
        setIsRunning(true);
        setLoadingType('run');
        setSubmissionResult(null);
        toast.loading("Running sample test cases...");
        try {
            const res = await api.post('/submissions/run-samples', {
                code, language, problemId: problem._id
            }, {
                timeout: RUN_REQUEST_TIMEOUT_MS
            });
            setSubmissionResult(res.data);
            toast.dismiss();
            if (res.data.testResults.every(r => r.passed)) {
                toast.success("Sample Test Cases Passed!");
            } else {
                toast.error("Some sample test cases failed.");
            }
        } catch (error) {
            toast.dismiss();
            const message = getRequestErrorMessage(error, 'Run failed');
            toast.error(message);
            setSubmissionResult({ error: message });
        } finally {
            setIsRunning(false);
            setLoadingType(null);
        }
    };

    const handleResetCode = () => {
        if (window.confirm("Are you sure you want to reset your code to the starter template?")) {
            const starterCode = getStarterTemplate(problem, language);
            setCode(starterCode);

            const storageKey = getDraftStorageKey(problemId, language);
            if (storageKey) {
                writeEditorDraft({
                    storageKey,
                    code: starterCode,
                    starterTemplate: starterCode
                });
            }
            toast.success("Code reset to starter template");
        }
    };

    const handleLastSubmission = async () => {
        try {
            const res = await api.get(`/submissions/last/${problem._id}`);
            if (res.data.submission) {
                setCode(res.data.submission.code);
                setLanguage(res.data.submission.language);
                toast.success("Loaded last submission");
            } else {
                toast.info("No previous submission found");
            }
        } catch (error) {
            toast.error("Failed to load last submission");
        }
    };

    const fetchUserSubmissions = async () => {
        if (!isAuthenticated || !problem?._id) return;
        // Only show loading if manually refreshing or tab switch, not background check
        if (activeTab === 'Submissions') setFetchingSubmissions(true);
        try {
            const res = await api.get(`/submissions/my-submissions?problemId=${problem._id}`);
            setUserSubmissions(res.data.submissions);
        } catch (error) {
            console.error("Failed to fetch submissions", error);
        } finally {
            setFetchingSubmissions(false);
        }
    };

    const fetchPublicSolutions = async (pageNum = 1, append = false) => {
        if (!problem?._id) return;

        if (!append) setFetchingSolutions(true);
        try {
            const res = await api.get(`/submissions/problem/${problem._id}/solutions`, {
                params: {
                    page: pageNum,
                    limit: 12,
                    sort: solutionsSort
                }
            });

            const items = Array.isArray(res.data?.items) ? res.data.items : [];
            const pagination = res.data?.pagination || {};

            setPublicSolutions((prev) => append ? [...(Array.isArray(prev) ? prev : []), ...items] : items);
            setSolutionsPage(Number(pagination.page || pageNum));
            setSolutionsHasMore(Number(pagination.page || pageNum) < Number(pagination.pages || 1));

            setSolutionsFollowMap((prev) => {
                const next = { ...(prev || {}) };
                items.forEach((entry) => {
                    const uid = String(entry?.user?._id || '');
                    if (uid) next[uid] = Boolean(entry?.user?.isFollowing);
                });
                return next;
            });
        } catch (error) {
            if (!append) {
                setPublicSolutions([]);
                setSolutionsHasMore(false);
                setSolutionsPage(1);
            }
            toast.error(error?.response?.data?.message || 'Failed to load solutions');
        } finally {
            setFetchingSolutions(false);
        }
    };

    const handleSolutionFollowStateChange = (targetUserId, nextState) => {
        const normalizedId = String(targetUserId || '');
        if (!normalizedId) return;

        setSolutionsFollowMap((prev) => ({ ...(prev || {}), [normalizedId]: Boolean(nextState) }));
        setPublicSolutions((prev) => (Array.isArray(prev) ? prev : []).map((entry) => (
            String(entry?.user?._id || '') === normalizedId
                ? { ...entry, user: { ...(entry.user || {}), isFollowing: Boolean(nextState) } }
                : entry
        )));
    };

    const toggleSolutionExpand = (solutionId) => {
        const normalizedId = String(solutionId || '');
        if (!normalizedId) return;
        setExpandedSolutions((prev) => ({
            ...(prev || {}),
            [normalizedId]: !prev?.[normalizedId]
        }));
    };

    const closePerformanceGraph = () => {
        setIsPerformanceModalOpen(false);
        setPerformanceGraphData(null);
        setPerformanceGraphError('');
        setPerformanceGraphLoading(false);
        setPerformanceSubmissionLoadingId(null);
        setActivePerformanceSubmissionId(null);
    };

    const openPerformanceGraph = async (submissionId) => {
        if (!submissionId) return;
        setActivePerformanceSubmissionId(submissionId);
        setPerformanceSubmissionLoadingId(submissionId);
        setPerformanceGraphLoading(true);
        setPerformanceGraphError('');
        setPerformanceGraphData(null);
        setIsPerformanceModalOpen(true);

        try {
            const res = await api.get(`/submissions/performance/${submissionId}`);
            if (!res.data?.success) {
                throw new Error(res.data?.message || 'Failed to load performance graph.');
            }
            setPerformanceGraphData(res.data);
        } catch (error) {
            const message = error?.response?.data?.message || error.message || 'Failed to load performance graph.';
            setPerformanceGraphError(message);
            setPerformanceGraphData(null);
        } finally {
            setPerformanceGraphLoading(false);
            setPerformanceSubmissionLoadingId(null);
        }
    };



    // Like/Dislike handler with debounce
    const handleReaction = useCallback(async (type) => {
        if (!isAuthenticated) return toast.error("Login required");
        if (isReacting) return; // Prevent rapid clicks
        setIsReacting(true);
        try {
            const res = await api.post(`/problems/${problem._id}/react`, { type });
            setProblem(prev => ({
                ...prev,
                likesCount: res.data.likesCount,
                dislikesCount: res.data.dislikesCount,
                hasLiked: res.data.hasLiked,
                hasDisliked: res.data.hasDisliked
            }));
        } catch (error) {
            toast.error("Failed to react");
        } finally {
            setIsReacting(false);
        }
    }, [isAuthenticated, isReacting, problem?._id]);

    const handleBookmarkToggle = useCallback(async () => {
        if (!isAuthenticated) return toast.error('Login required');
        if (!problem?._id || bookmarkLoading) return;

        setBookmarkLoading(true);
        try {
            const res = await api.post(`/problems/${problem._id}/bookmark`);
            const nextBookmarked = Boolean(res?.data?.bookmarked);
            setIsBookmarked(nextBookmarked);
            dispatch(loadUser());
            toast.success(nextBookmarked ? 'Problem saved' : 'Problem removed from saved');
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to update saved problem');
        } finally {
            setBookmarkLoading(false);
        }
    }, [bookmarkLoading, dispatch, isAuthenticated, problem?._id]);

    // ═══ Doubts handlers ═══
    const getRelativeTime = (date) => {
        const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return new Date(date).toLocaleDateString();
    };

    const fetchDoubts = async (page = 1, sort = doubtSort, append = false) => {
        if (!problem) return;
        if (!append) setFetchingDoubts(true);
        else setLoadingMore(true);
        try {
            const userId = currentUserId;
            const res = await api.get(`/doubts/problem/${problem._id}?page=${page}&limit=20&sort=${sort}&userId=${userId}`);
            if (append) {
                setDoubts(prev => [...prev, ...res.data.doubts]);
            } else {
                setDoubts(res.data.doubts);
            }
            setDiscussionsEnabled(res.data.discussionsEnabled);
            setDoubtHasMore(res.data.pagination.hasMore);
            setDoubtTotal(res.data.pagination.total);
            setDoubtPage(page);
        } catch (error) {
            console.error('Failed to fetch doubts', error);
        } finally {
            setFetchingDoubts(false);
            setLoadingMore(false);
        }
    };

    const fetchReplies = async (commentId, page = 1) => {
        try {
            const userId = currentUserId;
            const res = await api.get(`/doubts/${commentId}/replies?page=${page}&limit=10&userId=${userId}`);
            setRepliesMap(prev => ({
                ...prev,
                [commentId]: {
                    replies: page === 1 ? res.data.replies : [...(prev[commentId]?.replies || []), ...res.data.replies],
                    hasMore: res.data.pagination.hasMore,
                    page,
                    loaded: true
                }
            }));
        } catch (error) {
            console.error('Failed to fetch replies', error);
        }
    };

    const handlePostDoubt = async () => {
        if (!isAuthenticated) return toast.error('Login required to post');
        if (!doubtContent.trim()) return toast.error('Write something first');
        if (doubtContent.length > 2000) return toast.error('Max 2000 characters');
        setPostingDoubt(true);
        try {
            const res = await api.post(`/doubts/problem/${problem._id}`, { content: doubtContent.trim() });
            setDoubts(prev => [res.data.doubt, ...prev]);
            setDoubtContent('');
            setDoubtTotal(prev => prev + 1);
            toast.success('Comment posted!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to post');
        } finally {
            setPostingDoubt(false);
        }
    };

    const handlePostReply = async (parentCommentId) => {
        if (!isAuthenticated) return toast.error('Login required');
        if (!replyContent.trim()) return;
        setPostingReply(true);
        try {
            const res = await api.post(`/doubts/problem/${problem._id}`, {
                content: replyContent.trim(),
                parentCommentId
            });
            // Add to replies map
            setRepliesMap(prev => ({
                ...prev,
                [parentCommentId]: {
                    ...(prev[parentCommentId] || { hasMore: false, page: 1 }),
                    replies: [...(prev[parentCommentId]?.replies || []), res.data.doubt],
                    loaded: true
                }
            }));
            // Update parent's repliesCount
            setDoubts(prev => prev.map(d =>
                d._id === parentCommentId ? { ...d, repliesCount: (d.repliesCount || 0) + 1 } : d
            ));
            setReplyContent('');
            setReplyingTo(null);
            toast.success('Reply posted!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reply');
        } finally {
            setPostingReply(false);
        }
    };

    const handleEditDoubt = async (doubtId) => {
        if (!editContent.trim()) return;
        try {
            const res = await api.put(`/doubts/${doubtId}`, { content: editContent.trim() });
            const updateInList = (list) => list.map(d => d._id === doubtId ? { ...d, content: res.data.doubt.content, isEdited: true, updatedAt: res.data.doubt.updatedAt } : d);
            setDoubts(updateInList);
            // Also update in replies
            setRepliesMap(prev => {
                const updated = { ...prev };
                for (const key in updated) {
                    if (updated[key]?.replies) {
                        updated[key] = { ...updated[key], replies: updateInList(updated[key].replies) };
                    }
                }
                return updated;
            });
            setEditingDoubt(null);
            setEditContent('');
            toast.success('Comment updated!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to edit');
        }
    };

    const handleDeleteDoubt = async (doubtId) => {
        if (!window.confirm('Delete this comment?')) return;
        try {
            await api.delete(`/doubts/${doubtId}`);
            // Soft delete — update content in place
            const softDelete = (list) => list.map(d => d._id === doubtId ? { ...d, isDeleted: true, content: 'This comment has been deleted' } : d);
            setDoubts(softDelete);
            setRepliesMap(prev => {
                const updated = { ...prev };
                for (const key in updated) {
                    if (updated[key]?.replies) {
                        updated[key] = { ...updated[key], replies: softDelete(updated[key].replies) };
                    }
                }
                return updated;
            });
            toast.success('Comment deleted');
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const handleLikeDoubt = async (doubtId) => {
        if (!isAuthenticated) return toast.error('Login required');
        try {
            const res = await api.post(`/doubts/${doubtId}/like`);
            const updateLike = (list) => list.map(d => d._id === doubtId ? { ...d, likesCount: res.data.likesCount, hasLiked: res.data.hasLiked } : d);
            setDoubts(updateLike);
            setRepliesMap(prev => {
                const updated = { ...prev };
                for (const key in updated) {
                    if (updated[key]?.replies) {
                        updated[key] = { ...updated[key], replies: updateLike(updated[key].replies) };
                    }
                }
                return updated;
            });
        } catch (error) {
            toast.error('Failed to like');
        }
    };

    const handleReportDoubt = async () => {
        // Handled by global ReportModal
    };

    const handleSortChange = (newSort) => {
        setDoubtSort(newSort);
        setDoubtPage(1);
        setRepliesMap({});
        fetchDoubts(1, newSort, false);
    };

    useEffect(() => {
        if (activeTab !== 'Doubts' || !problem?._id) return;
        setRepliesMap({});
        fetchDoubts(1, doubtSort, false);
    }, [activeTab, problem?._id, currentUserId]);

    // Socket.io for real-time updates
    useEffect(() => {
        if (!problem?._id) return;
        const socket = io(getCurrentSocketBaseUrl(), getSocketClientOptions());
        const activeProblemId = problem._id.toString();
        socket.emit('problem:presence:join', {
            problemId: activeProblemId,
            userId: currentUserId || null
        });

        socket.on('problem:active-users:update', (data) => {
            const incomingProblemId = data?.problemId?.toString();
            if (incomingProblemId !== activeProblemId) return;
            const nextCount = Number(data?.count || 0);
            setActiveUsersCount(Number.isFinite(nextCount) ? nextCount : 0);
        });

        socket.on('new_comment', (data) => {
            const incomingProblemId = data?.problemId?.toString();
            if (incomingProblemId !== activeProblemId) return;

            const commentAuthorId = (data?.comment?.user?._id || data?.comment?.user?.id || '').toString();
            if (commentAuthorId && commentAuthorId === currentUserId) return;

            if (data.comment.parentComment) {
                const parentId = data.comment.parentComment.toString();

                setDoubts(prev => prev.map(d =>
                    d._id === parentId ? { ...d, repliesCount: (d.repliesCount || 0) + 1 } : d
                ));

                setRepliesMap(prev => {
                    const parentReplies = prev[parentId];
                    if (!parentReplies?.loaded) return prev;

                    const existing = parentReplies.replies || [];
                    if (existing.find(r => r._id === data.comment._id)) return prev;

                    return {
                        ...prev,
                        [parentId]: {
                            ...parentReplies,
                            replies: [...existing, data.comment]
                        }
                    };
                });
            } else {
                let inserted = false;
                setDoubts(prev => {
                    if (prev.find(d => d._id === data.comment._id)) return prev;
                    inserted = true;
                    return [data.comment, ...prev];
                });
                if (inserted) {
                    setDoubtTotal(prev => prev + 1);
                }
            }
        });

        socket.on('delete_comment', (data) => {
            const softDelete = (list) => list.map(d => d._id === data.commentId ? { ...d, isDeleted: true, content: 'This comment has been deleted' } : d);
            setDoubts(softDelete);
            setRepliesMap(prev => {
                const updated = { ...prev };
                for (const key in updated) {
                    if (updated[key]?.replies) {
                        updated[key] = { ...updated[key], replies: softDelete(updated[key].replies) };
                    }
                }
                return updated;
            });
        });

        socket.on('like_update', (data) => {
            const updateLike = (list) => list.map(d => d._id === data.commentId ? { ...d, likesCount: data.likesCount } : d);
            setDoubts(updateLike);
            setRepliesMap(prev => {
                const updated = { ...prev };
                for (const key in updated) {
                    if (updated[key]?.replies) {
                        updated[key] = { ...updated[key], replies: updateLike(updated[key].replies) };
                    }
                }
                return updated;
            });
        });

        return () => {
            socket.emit('problem:presence:leave', { problemId: activeProblemId });
            socket.disconnect();
        };
    }, [problem?._id, currentUserId]);

    // Navigation helpers
    const sortedProblems = useMemo(() => {
        const source = Array.isArray(allProblems) ? allProblems : [];
        return source
            .map((entry, index) => ({
                entry,
                index,
                numericOrder: Number(entry?.problemNumber)
            }))
            .sort((left, right) => {
                const leftHasOrder = Number.isFinite(left.numericOrder) && left.numericOrder > 0;
                const rightHasOrder = Number.isFinite(right.numericOrder) && right.numericOrder > 0;

                if (leftHasOrder && rightHasOrder && left.numericOrder !== right.numericOrder) {
                    return left.numericOrder - right.numericOrder;
                }
                if (leftHasOrder !== rightHasOrder) {
                    return leftHasOrder ? -1 : 1;
                }

                return left.index - right.index;
            })
            .map(({ entry }) => entry);
    }, [allProblems]);
    const normalizedRouteProblemKey = String(problemId || id || '').trim();
    const isSameProblem = useCallback((candidate) => {
        if (!candidate) return false;
        const candidateId = String(candidate._id || '').trim();
        const candidateSlug = String(candidate.slug || '').trim();
        return candidateId === normalizedRouteProblemKey || candidateSlug === normalizedRouteProblemKey;
    }, [normalizedRouteProblemKey]);
    const currentIndex = useMemo(() => {
        const routeMatchIndex = sortedProblems.findIndex((p) => isSameProblem(p));
        if (routeMatchIndex >= 0) return routeMatchIndex;

        const currentProblemId = String(problem?._id || '').trim();
        if (!currentProblemId) return -1;
        return sortedProblems.findIndex((p) => String(p?._id || '').trim() === currentProblemId);
    }, [isSameProblem, problem?._id, sortedProblems]);
    const prevProblem = currentIndex > 0 ? sortedProblems[currentIndex - 1] : null;
    const nextProblem = currentIndex >= 0 && currentIndex < sortedProblems.length - 1
        ? sortedProblems[currentIndex + 1]
        : null;
    const displayedProblemNumber = Number.isFinite(Number(problem?.problemNumber)) && Number(problem?.problemNumber) > 0
        ? Number(problem?.problemNumber)
        : (currentIndex >= 0 ? currentIndex + 1 : null);

    // DEBUG LOGS
    // console.log("Navigation Debug:", { allProblemsLen: allProblems.length, currentIndex, id, prev: prevProblem?._id, next: nextProblem?._id });

    const handleRandomProblem = () => {
        if (sortedProblems.length < 2) {
            if (sortedProblems.length === 1 && !isSameProblem(sortedProblems[0])) {
                navigate(`/coding-platform/${sortedProblems[0]._id}`);
            }
            return;
        }
        let randomIdx;
        let attempts = 0;
        do {
            randomIdx = Math.floor(Math.random() * sortedProblems.length);
            attempts++;
        } while (isSameProblem(sortedProblems[randomIdx]) && attempts < 10);

        navigate(`/coding-platform/${sortedProblems[randomIdx]._id}`);
    };

    const filteredProblems = sortedProblems.filter(p =>
        String(p?.title || '').toLowerCase().includes(problemSearchQuery.toLowerCase())
    );

    const getDifficultyColor = (diff) => {
        switch (diff?.toLowerCase()) {
            case 'easy': return '#22c55e';
            case 'medium': return '#eab308';
            case 'hard': return '#ef4444';
            default: return '#9ca3af';
        }
    };

    const scrollToRef = (ref) => {
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const isMobile = viewportWidth <= 768;
    const isCompactMobile = viewportWidth <= 480;
    const mobileLeftPanelDefault = isCompactMobile ? 32 : 35;
    const mobileRightPanelDefault = 100 - mobileLeftPanelDefault;
    const mobileEditorPanelDefault = isCompactMobile ? 50 : 54;
    const mobileConsolePanelDefault = 100 - mobileEditorPanelDefault;
    const resultCases = Array.isArray(submissionResult?.testResults) ? submissionResult.testResults : [];
    const passedResultCases = resultCases.filter((entry) => entry?.passed).length;

    useEffect(() => {
        const shouldLockBody = Boolean(expandedPanel);
        document.body.style.overflow = shouldLockBody ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [expandedPanel]);

    if (loading) {
        return (
            <div style={{ minHeight: '100dvh', background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <FaClock style={{ fontSize: '60px', color: '#14b8a6', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                    <p style={{ color: '#9ca3af', fontSize: '20px' }}>Loading Problem...</p>
                </div>
            </div>
        );
    }

    if (!problem) {
        return (
            <div style={{ minHeight: '100dvh', background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <FaExclamationCircle style={{ fontSize: '60px', color: '#f87171', margin: '0 auto 16px' }} />
                    <p style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Problem Not Found</p>
                    <button onClick={() => navigate('/coding-platform')} style={{ color: '#14b8a6', cursor: 'pointer', background: 'none', border: 'none' }}>
                        ← Back to Problems
                    </button>
                </div>
            </div>
        );
    }

    // ═══ RENDER COMMENT CARD (recursive for threads) ═══
    const renderCommentCard = (comment, depth = 0) => {
        const commentAuthorId = (comment.user?._id || comment.user?.id || '').toString();
        const isAuthor = commentAuthorId && currentUserId === commentAuthorId;
        const canModify = isAuthor || isAdmin;
        const isEditing = editingDoubt === comment._id;
        const isReplying = replyingTo === comment._id;
        const commentReplies = repliesMap[comment._id];
        const indentPx = Math.min(depth * 24, 48);
        const maxDepth = 2;

        return (
            <div key={comment._id} style={{ marginLeft: `${indentPx}px`, borderLeft: depth > 0 ? '2px solid rgba(59,130,246,0.2)' : 'none', paddingLeft: depth > 0 ? '12px' : '0' }}>
                <div style={{
                    background: depth === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                    border: depth === 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    borderRadius: '10px', padding: depth === 0 ? '14px' : '10px 0',
                    transition: 'background 0.15s'
                }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaUserCircle style={{ fontSize: depth === 0 ? '22px' : '18px', color: comment.isDeleted ? '#4b5563' : '#6366f1' }} />
                            <span style={{ fontSize: '13px', fontWeight: 'bold', color: comment.isDeleted ? '#6b7280' : '#d1d5db' }}>
                                {comment.isDeleted ? 'Deleted' : (comment.user?.username || 'User')}
                            </span>
                            <span style={{ fontSize: '11px', color: '#6b7280' }}>• {getRelativeTime(comment.createdAt)}</span>
                            {comment.isEdited && !comment.isDeleted && (
                                <span style={{ fontSize: '10px', color: '#6b7280', fontStyle: 'italic' }}>(edited)</span>
                            )}
                        </div>
                        {!comment.isDeleted && (
                            <div style={{ display: 'flex', gap: '4px' }}>
                                {isAuthor && (
                                    <button onClick={() => { setEditingDoubt(comment._id); setEditContent(comment.content); }} title="Edit"
                                        style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '11px', padding: '3px', transition: 'color 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = '#60a5fa'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}>
                                        <FaEdit />
                                    </button>
                                )}
                                {canModify && (
                                    <button onClick={() => handleDeleteDoubt(comment._id)} title="Delete"
                                        style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '11px', padding: '3px', transition: 'color 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}>
                                        <FaTrash />
                                    </button>
                                )}
                                {isAuthenticated && (
                                    <button onClick={() => setReportData({ isOpen: true, contentId: comment._id, contentType: 'Doubt', reportedUserId: comment.user?._id })} title="Report"
                                        style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '11px', padding: '3px', transition: 'color 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = '#f59e0b'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}>
                                        <FaFlag />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Content / Edit Mode */}
                    {isEditing ? (
                        <div style={{ paddingLeft: depth === 0 ? '30px' : '26px', marginBottom: '8px' }}>
                            <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} maxLength={2000}
                                style={{
                                    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(59,130,246,0.3)',
                                    borderRadius: '8px', padding: '8px', color: 'white', fontSize: '13px',
                                    resize: 'vertical', minHeight: '50px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
                                }} />
                            <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                                <button onClick={() => handleEditDoubt(comment._id)} style={{
                                    padding: '4px 10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer'
                                }}>Save</button>
                                <button onClick={() => { setEditingDoubt(null); setEditContent(''); }} style={{
                                    padding: '4px 10px', background: '#374151', color: '#d1d5db', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer'
                                }}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <p style={{
                            color: comment.isDeleted ? '#6b7280' : '#d1d5db', fontSize: '13px', lineHeight: '1.6',
                            margin: '0 0 8px 0', paddingLeft: depth === 0 ? '30px' : '26px',
                            fontStyle: comment.isDeleted ? 'italic' : 'normal'
                        }}>
                            {comment.content}
                        </p>
                    )}

                    {/* Action Bar */}
                    {!comment.isDeleted && !isEditing && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingLeft: depth === 0 ? '30px' : '26px' }}>
                            <button onClick={() => handleLikeDoubt(comment._id)} style={{
                                display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none',
                                color: comment.hasLiked ? '#ef4444' : '#6b7280', cursor: 'pointer', fontSize: '12px',
                                padding: '2px', transition: 'color 0.2s'
                            }}>
                                {comment.hasLiked ? <FaHeart style={{ fontSize: '12px' }} /> : <FaRegHeart style={{ fontSize: '12px' }} />}
                                {(comment.likesCount || 0) > 0 && <span>{comment.likesCount}</span>}
                            </button>

                            {depth < maxDepth && isAuthenticated && (
                                <button onClick={() => { setReplyingTo(isReplying ? null : comment._id); setReplyContent(''); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none',
                                        color: isReplying ? '#3b82f6' : '#6b7280', cursor: 'pointer', fontSize: '12px', padding: '2px', transition: 'color 0.2s'
                                    }}>
                                    <FaReply style={{ fontSize: '11px' }} />
                                    <span>Reply</span>
                                </button>
                            )}

                            {(comment.repliesCount || 0) > 0 && (
                                <button onClick={() => {
                                    if (commentReplies?.loaded) {
                                        setRepliesMap(prev => { const u = { ...prev }; delete u[comment._id]; return u; });
                                    } else {
                                        fetchReplies(comment._id);
                                    }
                                }} style={{
                                    display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none',
                                    color: '#3b82f6', cursor: 'pointer', fontSize: '11px', padding: '2px'
                                }}>
                                    <FaChevronDown style={{ fontSize: '9px', transform: commentReplies?.loaded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                    {commentReplies?.loaded ? 'Hide' : `${comment.repliesCount} ${comment.repliesCount === 1 ? 'reply' : 'replies'}`}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Inline Reply Composer */}
                    {isReplying && (
                        <div style={{ paddingLeft: depth === 0 ? '30px' : '26px', marginTop: '8px' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                <FaUserCircle style={{ fontSize: '18px', color: '#4b5563', flexShrink: 0, marginTop: '4px' }} />
                                <div style={{ flex: 1 }}>
                                    <textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && replyContent.trim()) { e.preventDefault(); handlePostReply(comment._id); } }}
                                        placeholder={`Reply to ${comment.user?.username || 'user'}...`}
                                        maxLength={2000} autoFocus
                                        style={{
                                            width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px', padding: '8px', color: 'white', fontSize: '12px',
                                            resize: 'none', minHeight: '40px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
                                        }} />
                                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px', justifyContent: 'flex-end' }}>
                                        <button onClick={() => { setReplyingTo(null); setReplyContent(''); }} style={{
                                            padding: '3px 8px', background: '#374151', color: '#d1d5db', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer'
                                        }}>Cancel</button>
                                        <button onClick={() => handlePostReply(comment._id)} disabled={postingReply || !replyContent.trim()} style={{
                                            padding: '3px 8px', background: replyContent.trim() ? '#2563eb' : '#374151', color: 'white', border: 'none',
                                            borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: postingReply || !replyContent.trim() ? 'not-allowed' : 'pointer'
                                        }}>{postingReply ? '...' : 'Reply'}</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Threaded Replies */}
                {commentReplies?.loaded && commentReplies.replies.length > 0 && (
                    <div style={{ marginTop: '4px' }}>
                        {commentReplies.replies.map(reply => renderCommentCard(reply, depth + 1))}
                        {commentReplies.hasMore && (
                            <button onClick={() => fetchReplies(comment._id, commentReplies.page + 1)} style={{
                                marginLeft: `${(depth + 1) * 24}px`, padding: '4px 8px', background: 'none', border: 'none',
                                color: '#3b82f6', cursor: 'pointer', fontSize: '11px'
                            }}>Load more replies</button>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{
            height: '100dvh',
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            background: '#111827',
            color: 'white',
            overflow: 'hidden',
            paddingBottom: isMobile ? 'env(safe-area-inset-bottom, 0px)' : 0
        }}>
            {/* ═══════════ HEADER ═══════════ */}
            <div ref={headerRef} style={{
                minHeight: isMobile ? 'auto' : '48px',
                background: '#1f2937',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: isMobile ? 'stretch' : 'center',
                justifyContent: isMobile ? 'flex-start' : 'space-between',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '8px' : 0,
                padding: isMobile ? '10px 12px' : '0 16px',
                paddingTop: isMobile ? 'calc(env(safe-area-inset-top, 0px) + 8px)' : 0,
                flexShrink: 0,
                position: 'relative',
                zIndex: 100
            }}>
                {/* Left: Back + Problem List + Nav */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexWrap: isMobile ? 'nowrap' : 'wrap',
                    width: isMobile ? '100%' : 'auto',
                    overflowX: isMobile ? 'auto' : 'visible',
                    paddingBottom: isMobile ? '2px' : 0,
                    WebkitOverflowScrolling: isMobile ? 'touch' : 'auto'
                }} className={isMobile ? 'custom-scrollbar' : undefined}>
                    <button onClick={() => navigate('/')} style={{
                        padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', fontSize: '15px', fontWeight: '800',
                        letterSpacing: '-0.5px',
                        backgroundImage: 'linear-gradient(135deg, #6366f1, #ec4899)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                    }}>
                        AV
                    </button>
                    <button
                        onClick={() => navigate('/profile')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '5px 10px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: '6px',
                            color: '#d1d5db',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600'
                        }}
                        title="Open profile"
                    >
                        <FaUserCircle style={{ fontSize: '13px' }} />
                        <span>Profile</span>
                    </button>
                    <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)', margin: '0 4px', display: isMobile ? 'none' : 'block' }}></div>
                    <button onClick={() => navigate('/coding-platform')} style={{
                        padding: '6px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af',
                        display: 'flex', alignItems: 'center', fontSize: '14px'
                    }}>
                        <FaArrowLeft />
                    </button>

                    {/* Problem List Button */}
                    <button onClick={() => setShowProblemList(!showProblemList)} style={{
                        display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#d1d5db', cursor: 'pointer', fontSize: '13px', fontWeight: '500'
                    }}>
                        <FaList style={{ fontSize: '11px' }} /> Problem List
                    </button>

                    {/* Prev Button */}
                    <button onClick={() => prevProblem && navigate(`/coding-platform/${prevProblem._id}`)} disabled={!prevProblem} style={{
                        padding: '5px 8px', background: 'transparent', border: 'none', color: prevProblem ? '#d1d5db' : '#4b5563',
                        cursor: prevProblem ? 'pointer' : 'not-allowed', fontSize: '14px', display: 'flex', alignItems: 'center'
                    }}>
                        <FaChevronLeft />
                    </button>

                    {/* Next Button */}
                    <button onClick={() => nextProblem && navigate(`/coding-platform/${nextProblem._id}`)} disabled={!nextProblem} style={{
                        padding: '5px 8px', background: 'transparent', border: 'none', color: nextProblem ? '#d1d5db' : '#4b5563',
                        cursor: nextProblem ? 'pointer' : 'not-allowed', fontSize: '14px', display: 'flex', alignItems: 'center'
                    }}>
                        <FaChevronRight />
                    </button>

                    {/* Random Button */}
                    <button onClick={handleRandomProblem} style={{
                        padding: '5px 8px', background: 'transparent', border: 'none', color: '#d1d5db',
                        cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center'
                    }}>
                        <FaRandom />
                    </button>
                </div>

                {/* Right: Timer + Language + Actions */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isCompactMobile ? '8px' : '10px',
                    flexWrap: isMobile ? 'nowrap' : 'wrap',
                    width: isMobile ? '100%' : 'auto',
                    overflowX: isMobile ? 'auto' : 'visible',
                    paddingBottom: isMobile ? '2px' : 0,
                    WebkitOverflowScrolling: isMobile ? 'touch' : 'auto'
                }} className={isMobile ? 'custom-scrollbar' : undefined}>
                    {/* Timer */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)',
                        padding: '4px 10px', borderRadius: '6px'
                    }}>
                        <FaClock style={{ color: '#3b82f6', fontSize: '12px' }} />
                        <span style={{ color: '#3b82f6', fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace' }}>{formatTime(timerSeconds)}</span>
                        <button onClick={() => setTimerActive(!timerActive)} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '10px' }}>
                            {timerActive ? '⏸' : '▶'}
                        </button>
                        <button onClick={() => { setTimerSeconds(0); setTimerActive(false); }} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '10px' }}>
                            ↻
                        </button>
                    </div>

                    {/* Language */}
                    <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{
                        background: '#374151', color: 'white', fontSize: '12px', border: '1px solid #4b5563',
                        borderRadius: '6px', padding: '4px 10px', outline: 'none', cursor: 'pointer'
                    }}>
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                        <option value="c">C</option>
                    </select>

                    <button onClick={handleLastSubmission} style={{ background: '#374151', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', border: '1px solid #4b5563', cursor: 'pointer' }}>
                        Last
                    </button>
                    <button onClick={handleResetCode} style={{ background: '#dc2626', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', border: 'none', cursor: 'pointer' }}>
                        Reset
                    </button>
                    <button onClick={handleRun} disabled={isRunning || !isAuthenticated} style={{
                        background: 'linear-gradient(to right, #2563eb, #3b82f6)', color: 'white', padding: '4px 12px', borderRadius: '6px',
                        fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', border: 'none',
                        cursor: (isRunning || !isAuthenticated) ? 'not-allowed' : 'pointer', opacity: (isRunning || !isAuthenticated) ? 0.7 : 1, transition: 'all 0.2s'
                    }}>
                        {isRunning && loadingType === 'run' ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaPlay style={{ fontSize: '9px' }} />} Run
                    </button>
                    <button onClick={handleSubmit} disabled={isRunning || isAdmin || !isAuthenticated} style={{
                        background: 'linear-gradient(to right, #059669, #14b8a6)', color: 'white', padding: '4px 14px', borderRadius: '6px',
                        fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', border: 'none',
                        cursor: (isRunning || isAdmin || !isAuthenticated) ? 'not-allowed' : 'pointer', opacity: (isRunning || isAdmin || !isAuthenticated) ? 0.7 : 1, transition: 'all 0.2s'
                    }}>
                        {isRunning && loadingType === 'submit' ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaCheckCircle />} {isAdmin ? 'View Only' : 'Submit'}
                    </button>
                </div>

                {isMobile && (
                    <div style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        padding: '2px 2px 0',
                        minWidth: 0
                    }}>
                        <div style={{
                            fontSize: '12px',
                            color: '#e5e7eb',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            flex: 1,
                            minWidth: 0
                        }}>
                            {displayedProblemNumber ? `${displayedProblemNumber}. ` : ''}{problem.title}
                        </div>
                        <span style={{
                            fontSize: '10px',
                            color: getDifficultyColor(problem.difficulty),
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '999px',
                            padding: '3px 8px',
                            fontWeight: 700,
                            flexShrink: 0
                        }}>
                            {problem.difficulty}
                        </span>
                    </div>
                )}
            </div>

            {/* ═══════════ PROBLEM LIST DROPDOWN ═══════════ */}
            {showProblemList && (
                <div style={{
                    position: isMobile ? 'fixed' : 'absolute',
                    top: isMobile ? `${headerHeight + 8}px` : '48px',
                    left: isMobile ? '12px' : 0,
                    right: isMobile ? '12px' : 'auto',
                    width: isMobile ? 'auto' : '450px',
                    maxHeight: isMobile ? `calc(100dvh - ${headerHeight + 20}px)` : '70vh',
                    background: '#1f2937', borderRight: '1px solid rgba(255,255,255,0.1)',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    zIndex: 200, display: 'flex', flexDirection: 'column',
                    boxShadow: '4px 4px 20px rgba(0,0,0,0.5)'
                }}>
                    {/* Header */}
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', color: 'white', fontSize: '14px' }}>Problem List</span>
                        <button onClick={() => setShowProblemList(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '14px' }}>
                            <FaTimes />
                        </button>
                    </div>
                    {/* Search */}
                    <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '6px 10px', gap: '8px' }}>
                            <FaSearch style={{ color: '#6b7280', fontSize: '12px' }} />
                            <input
                                value={problemSearchQuery}
                                onChange={(e) => setProblemSearchQuery(e.target.value)}
                                placeholder="Search questions"
                                style={{ background: 'transparent', border: 'none', outline: 'none', color: 'white', fontSize: '13px', width: '100%' }}
                            />
                        </div>
                    </div>
                    {/* List */}
                    <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                        {filteredProblems.map((p) => (
                            <div
                                key={p._id}
                                onClick={() => { navigate(`/coding-platform/${p._id}`); setShowProblemList(false); }}
                                style={{
                                    padding: '10px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                                    background: isSameProblem(p) ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                    transition: 'background 0.15s'
                                }}
                                onMouseEnter={(e) => { if (!isSameProblem(p)) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                                onMouseLeave={(e) => { if (!isSameProblem(p)) e.currentTarget.style.background = 'transparent'; }}
                            >
                                <span style={{ fontSize: '13px', color: isSameProblem(p) ? '#3b82f6' : '#d1d5db' }}>
                                    {Number.isFinite(Number(p?.problemNumber)) && Number(p?.problemNumber) > 0
                                        ? `${Number(p.problemNumber)}. ${p.title}`
                                        : p.title}
                                </span>
                                <span style={{ fontSize: '12px', color: getDifficultyColor(p.difficulty), fontWeight: '500' }}>
                                    {p.difficulty === 'Medium' ? 'Med.' : p.difficulty}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══════════ MAIN CONTENT ═══════════ */}
            <div style={{ flex: 1, minHeight: 0 }}>
                <PanelGroup orientation={isMobile ? "vertical" : "horizontal"} style={{ height: '100%', minHeight: 0 }}>

                    <Panel ref={leftPanelRef} defaultSize={isMobile ? mobileLeftPanelDefault : 33} minSize={isMobile ? 24 : 20} collapsible={true}>
                        <div style={{
                            height: '100%', background: '#1f2937', display: 'flex', flexDirection: 'column',
                            ...(expandedPanel === 'left' ? {
                                position: 'fixed',
                                top: isMobile ? 0 : 48,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                zIndex: 250,
                                background: '#1f2937',
                                width: '100vw',
                                maxWidth: '100vw',
                                height: isMobile ? '100dvh' : 'auto',
                                overflow: 'hidden'
                            } : {})
                        }}>
                            {/* Tabs */}
                            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', background: '#111827', justifyContent: 'space-between', alignItems: 'center', paddingRight: '10px', gap: '8px' }}>
                                <div style={{ display: 'flex', overflowX: 'auto', whiteSpace: 'nowrap' }} className="custom-scrollbar">
                                    {['Description', 'Submissions', 'Doubts', 'Editorial', 'Solutions'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            style={{
                                                padding: isMobile ? '9px 12px' : '10px 16px', background: 'transparent',
                                                color: activeTab === tab ? 'white' : '#9ca3af',
                                                border: 'none', borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
                                                cursor: 'pointer', fontWeight: activeTab === tab ? 'bold' : 'normal',
                                                fontSize: '12px', transition: 'all 0.2s'
                                            }}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={() => toggleExpand('left')} title={expandedPanel === 'left' ? "Restore" : "Maximize"} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                                    {expandedPanel === 'left' ? <FaCompress /> : <FaExpand />}
                                </button>
                            </div>

                            {/* ═══ DESCRIPTION TAB ═══ */}
                            {activeTab === 'Description' ? (
                                <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '12px' : '20px', position: 'relative' }} className="custom-scrollbar" ref={descriptionScrollRef}>
                                    {/* Title */}
                                    <h1 style={{ fontSize: '22px', fontWeight: '600', color: 'white', marginBottom: '12px', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        {displayedProblemNumber ? `${displayedProblemNumber}. ` : ''}{problem.title}
                                        {isSolved && <FaCheckCircle style={{ color: '#22c55e', fontSize: '18px' }} title="Solved" />}
                                    </h1>

                                    {/* Clickable Tags */}
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
                                        <span onClick={() => scrollToRef(constraintsRef)} style={{
                                            fontSize: '12px', padding: '3px 10px', borderRadius: '20px', cursor: 'pointer',
                                            background: `${getDifficultyColor(problem.difficulty)}20`, color: getDifficultyColor(problem.difficulty), fontWeight: '500'
                                        }}>
                                            {problem.difficulty}
                                        </span>
                                        {(problem.topics && problem.topics.length > 0 || problem.topic) && (
                                            <span onClick={() => scrollToRef(topicsRef)} style={{
                                                fontSize: '12px', padding: '3px 10px', borderRadius: '20px', cursor: 'pointer',
                                                background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)'
                                            }}>
                                                🏷 Topics
                                            </span>
                                        )}
                                        <span onClick={() => { }} style={{
                                            fontSize: '12px', padding: '3px 10px', borderRadius: '20px', cursor: 'default',
                                            background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)'
                                        }}>
                                            {problem.submissionAcceptanceRate}% Acceptance
                                        </span>
                                        {problem.companies && problem.companies.length > 0 && (
                                            <span onClick={() => scrollToRef(companiesRef)} style={{
                                                fontSize: '12px', padding: '3px 10px', borderRadius: '20px', cursor: 'pointer',
                                                background: 'rgba(234,179,8,0.15)', color: '#fbbf24', border: '1px solid rgba(234,179,8,0.3)'
                                            }}>
                                                🏢 Companies
                                            </span>
                                        )}
                                        {problem.hints && problem.hints.length > 0 && (
                                            <span onClick={() => { setHintsExpanded(true); scrollToRef(hintsRef); }} style={{
                                                fontSize: '12px', padding: '3px 10px', borderRadius: '20px', cursor: 'pointer',
                                                background: 'rgba(20,184,166,0.15)', color: '#2dd4bf', border: '1px solid rgba(20,184,166,0.3)'
                                            }}>
                                                💡 Hints
                                            </span>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <div style={{ color: '#d1d5db', lineHeight: '1.7', fontSize: '14px', marginBottom: '28px' }}>
                                        {problem.description}
                                    </div>

                                    {/* Topics Section */}
                                    <div ref={topicsRef} style={{ marginBottom: '20px' }}>
                                        <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>Topics</h3>
                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                            {(problem.topics && problem.topics.length > 0 ? problem.topics : [problem.topic]).filter(Boolean).map((t, i) => (
                                                <span key={i} style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(255,255,255,0.08)', color: '#d1d5db' }}>{t}</span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Companies Section */}
                                    {problem.companies && problem.companies.length > 0 && (
                                        <div ref={companiesRef} style={{ marginBottom: '20px' }}>
                                            <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>Companies</h3>
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                {problem.companies.map((c, i) => (
                                                    <span key={i} style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(255,255,255,0.08)', color: '#d1d5db' }}>{c}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Input */}
                                    <div style={{ marginBottom: '16px' }}>
                                        <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: 'white', marginBottom: '6px' }}>Input</h3>
                                        <p style={{ color: '#d1d5db', fontSize: '13px', fontFamily: 'monospace', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '6px', margin: 0 }}>
                                            {problem.inputFormat || "Standard Input"}
                                        </p>
                                    </div>

                                    {/* Output */}
                                    <div style={{ marginBottom: '16px' }}>
                                        <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: 'white', marginBottom: '6px' }}>Output</h3>
                                        <p style={{ color: '#d1d5db', fontSize: '13px', fontFamily: 'monospace', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '6px', margin: 0 }}>
                                            {problem.outputFormat || "Standard Output"}
                                        </p>
                                    </div>

                                    {/* Constraints */}
                                    <div ref={constraintsRef} style={{ marginBottom: '20px' }}>
                                        <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: 'white', marginBottom: '6px' }}>Constraints</h3>
                                        <ul style={{ color: '#d1d5db', fontSize: '13px', paddingLeft: '20px', margin: 0 }}>
                                            {problem.constraints && problem.constraints.split('\n').map((c, i) => (
                                                <li key={i} style={{ marginBottom: '4px' }}>{c}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Hints */}
                                    <div ref={hintsRef}>
                                        {problem.hints && problem.hints.length > 0 && (
                                            <div style={{ marginBottom: '24px' }}>
                                                <div
                                                    onClick={() => setHintsExpanded(!hintsExpanded)}
                                                    style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px', color: '#9ca3af', fontSize: '14px' }}
                                                >
                                                    {hintsExpanded ? <FaChevronUp /> : <FaChevronDown />}
                                                    <span>Hints</span>
                                                </div>
                                                {hintsExpanded && (
                                                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                        {problem.hints.map((hint, idx) => (
                                                            <div key={idx} style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '6px', fontSize: '13px', color: '#d1d5db' }}>
                                                                {hint}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Spacer for floating bar */}
                                    <div style={{ height: '60px' }} />

                                    {/* ═══ FLOATING LIKE/DISLIKE BAR ═══ */}
                                    <div style={{
                                        position: 'sticky', bottom: 0, left: 0, right: 0,
                                        background: 'linear-gradient(transparent, #1f2937 30%)',
                                        paddingTop: '20px', paddingBottom: '8px'
                                    }}>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '16px',
                                            background: 'rgba(17,24,39,0.95)', backdropFilter: 'blur(10px)',
                                            padding: '8px 16px', borderRadius: '12px',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            width: 'fit-content'
                                        }}>
                                            {/* Thumbs Up */}
                                            <button onClick={() => handleReaction('like')} disabled={isReacting} style={{
                                                display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none',
                                                color: problem.hasLiked ? '#22c55e' : '#9ca3af', cursor: isReacting ? 'not-allowed' : 'pointer',
                                                fontSize: '15px', padding: '4px', transition: 'color 0.2s'
                                            }}>
                                                <FaThumbsUp /> <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{problem.likesCount || 0}</span>
                                            </button>

                                            <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.15)' }} />

                                            {/* Thumbs Down */}
                                            <button onClick={() => handleReaction('dislike')} disabled={isReacting} style={{
                                                display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none',
                                                color: problem.hasDisliked ? '#ef4444' : '#9ca3af', cursor: isReacting ? 'not-allowed' : 'pointer',
                                                fontSize: '15px', padding: '4px', transition: 'color 0.2s'
                                            }}>
                                                <FaThumbsDown /> <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{problem.dislikesCount || 0}</span>
                                            </button>

                                            <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.15)' }} />

                                            {/* Save / Bookmark */}
                                            <button
                                                onClick={handleBookmarkToggle}
                                                disabled={bookmarkLoading}
                                                title={isBookmarked ? 'Saved problem' : 'Save problem'}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none',
                                                    color: isBookmarked ? '#facc15' : '#9ca3af',
                                                    cursor: bookmarkLoading ? 'not-allowed' : 'pointer',
                                                    fontSize: '15px', padding: '4px', transition: 'color 0.2s'
                                                }}
                                            >
                                                <FaStar />
                                                <span style={{ fontSize: '12px', fontWeight: '600' }}>{isBookmarked ? 'Saved' : 'Save'}</span>
                                            </button>

                                            <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.15)' }} />

                                            {/* Active users on this problem */}
                                            <div
                                                title="Users currently solving this problem"
                                                style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#9ca3af', fontSize: '12px', fontWeight: '600' }}
                                            >
                                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 10px rgba(34,197,94,0.8)' }} />
                                                {activeUsersCount} Active
                                            </div>

                                            <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.15)' }} />

                                            {/* Share */}
                                            <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }} style={{
                                                display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none',
                                                color: '#9ca3af', cursor: 'pointer', fontSize: '14px', padding: '4px'
                                            }}>
                                                <FaShareAlt />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                /* ═══ SUBMISSIONS TAB ═══ */
                            ) : activeTab === 'Submissions' ? (
                                <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '12px' : '20px' }} className="custom-scrollbar">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', margin: 0 }}>My Submissions</h2>
                                        <button onClick={() => fetchUserSubmissions(true)} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <FaClock /> Refresh
                                        </button>
                                    </div>
                                    {fetchingSubmissions ? (
                                        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                                            <FaClock style={{ animation: 'spin 1s linear infinite', color: '#3b82f6', fontSize: '24px' }} />
                                        </div>
                                    ) : userSubmissions.length > 0 ? (
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', color: '#d1d5db' }}>
                                                <thead>
                                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                                                        <th style={{ padding: '12px', color: '#9ca3af', fontWeight: '500' }}>Status</th>
                                                        <th style={{ padding: '12px', color: '#9ca3af', fontWeight: '500' }}>Language</th>
                                                        <th style={{ padding: '12px', color: '#9ca3af', fontWeight: '500' }}>Runtime</th>
                                                        <th style={{ padding: '12px', color: '#9ca3af', fontWeight: '500' }}>Memory</th>
                                                        <th style={{ padding: '12px', color: '#9ca3af', fontWeight: '500' }}>Test Cases</th>
                                                        <th style={{ padding: '12px', color: '#9ca3af', fontWeight: '500' }}>Date</th>
                                                        <th style={{ padding: '12px', color: '#9ca3af', fontWeight: '500' }}>Performance</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {userSubmissions.map((sub, i) => (
                                                        <tr
                                                            key={sub._id}
                                                            onClick={() => {
                                                                setCode(sub.code);
                                                                setLanguage(sub.language);
                                                                toast.success(`Loaded submission from ${new Date(sub.createdAt).toLocaleDateString()}`);
                                                                if (sub.status === 'accepted') {
                                                                    openPerformanceGraph(sub._id);
                                                                }
                                                            }}
                                                            style={{
                                                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                                cursor: 'pointer',
                                                                background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                                                                transition: 'background 0.15s'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent'}
                                                        >
                                                            <td style={{ padding: '12px' }}>
                                                                <span style={{ color: sub.status === 'accepted' ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>
                                                                    {formatSubmissionStatus(sub.status)}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '12px' }}>
                                                                <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>
                                                                    {sub.language}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '12px', color: sub.status === 'accepted' ? 'white' : '#6b7280' }}>
                                                                {sub.status === 'accepted' && sub.runtime != null ? (
                                                                    <><FaClock style={{ fontSize: '10px', marginRight: '4px' }} /> {Number(sub.runtime).toFixed(2)} ms</>
                                                                ) : 'N/A'}
                                                            </td>
                                                            <td style={{ padding: '12px', color: sub.status === 'accepted' ? 'white' : '#6b7280' }}>
                                                                {sub.status === 'accepted' && sub.memory != null ? (
                                                                    <><FaCode style={{ fontSize: '10px', marginRight: '4px' }} /> {Number(sub.memory).toFixed(3)} MB</>
                                                                ) : 'N/A'}
                                                            </td>
                                                            <td style={{ padding: '12px', color: sub.status === 'accepted' ? '#86efac' : '#fcd34d', fontWeight: 600 }}>
                                                                {formatTestCaseSummary(sub)}
                                                            </td>
                                                            <td style={{ padding: '12px', color: '#9ca3af' }}>
                                                                {new Date(sub.createdAt).toLocaleDateString()}
                                                            </td>
                                                            <td style={{ padding: '12px' }}>
                                                                {sub.status === 'accepted' ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(event) => {
                                                                            event.stopPropagation();
                                                                            openPerformanceGraph(sub._id);
                                                                        }}
                                                                        disabled={performanceSubmissionLoadingId === sub._id}
                                                                        style={{
                                                                            border: '1px solid rgba(59,130,246,0.45)',
                                                                            background: 'rgba(59,130,246,0.15)',
                                                                            color: '#93c5fd',
                                                                            borderRadius: '999px',
                                                                            padding: '4px 10px',
                                                                            fontSize: '11px',
                                                                            fontWeight: '600',
                                                                            cursor: performanceSubmissionLoadingId === sub._id ? 'not-allowed' : 'pointer',
                                                                            opacity: performanceSubmissionLoadingId === sub._id ? 0.6 : 1
                                                                        }}
                                                                    >
                                                                        {performanceSubmissionLoadingId === sub._id ? 'Loading...' : 'Graph'}
                                                                    </button>
                                                                ) : (
                                                                    <span style={{ color: '#6b7280', fontSize: '11px' }}>-</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                                            <p>No submissions found.</p>
                                        </div>
                                    )}
                                </div>

                                /* ═══ DOUBTS TAB ═══ */
                            ) : activeTab === 'Doubts' ? (
                                <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '12px' : '20px' }} className="custom-scrollbar">
                                    {/* Header + Sort */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', margin: 0 }}>Discussion <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 'normal' }}>({doubtTotal})</span></h2>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <FaSortAmountDown style={{ color: '#6b7280', fontSize: '12px' }} />
                                            <select value={doubtSort} onChange={(e) => handleSortChange(e.target.value)} style={{
                                                background: '#1f2937', color: '#d1d5db', border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '6px', padding: '4px 8px', fontSize: '11px', outline: 'none', cursor: 'pointer'
                                            }}>
                                                <option value="recent">Most Recent</option>
                                                <option value="oldest">Oldest</option>
                                                <option value="mostLiked">Most Liked</option>
                                                <option value="mostReplied">Most Replied</option>
                                            </select>
                                        </div>
                                    </div>

                                    {!discussionsEnabled ? (
                                        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                                            <FaExclamationCircle style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.5 }} />
                                            <p style={{ fontSize: '14px' }}>Discussions are currently disabled by admin.</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* ── Composer ── */}
                                            {isAuthenticated && (
                                                <div style={{ marginBottom: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                                        <FaUserCircle style={{ fontSize: '28px', color: '#4b5563', flexShrink: 0, marginTop: '2px' }} />
                                                        <div style={{ flex: 1 }}>
                                                            <textarea
                                                                value={doubtContent}
                                                                onChange={(e) => setDoubtContent(e.target.value)}
                                                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && doubtContent.trim()) { e.preventDefault(); handlePostDoubt(); } }}
                                                                placeholder="Share your thoughts or ask a question..."
                                                                maxLength={2000}
                                                                style={{
                                                                    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                                                    borderRadius: '8px', padding: '10px', color: 'white', fontSize: '13px',
                                                                    resize: 'vertical', minHeight: '60px', outline: 'none', fontFamily: 'inherit',
                                                                    boxSizing: 'border-box'
                                                                }}
                                                            />
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                                                                <span style={{ fontSize: '11px', color: doubtContent.length > 1800 ? '#ef4444' : '#6b7280' }}>{doubtContent.length}/2000</span>
                                                                <button onClick={handlePostDoubt} disabled={postingDoubt || !doubtContent.trim()} style={{
                                                                    display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px',
                                                                    background: doubtContent.trim() ? 'linear-gradient(to right, #2563eb, #3b82f6)' : '#374151',
                                                                    color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px',
                                                                    fontWeight: 'bold', cursor: postingDoubt || !doubtContent.trim() ? 'not-allowed' : 'pointer'
                                                                }}>
                                                                    <FaPaperPlane style={{ fontSize: '10px' }} /> {postingDoubt ? 'Posting...' : 'Post'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* ── Comments List ── */}
                                            {fetchingDoubts ? (
                                                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                                                    <FaClock style={{ animation: 'spin 1s linear infinite', color: '#3b82f6', fontSize: '24px' }} />
                                                </div>
                                            ) : doubts.length > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    {doubts.map((doubt) => (
                                                        <div key={doubt._id}>
                                                            {renderCommentCard(doubt, 0)}
                                                        </div>
                                                    ))}

                                                    {/* Load More */}
                                                    {doubtHasMore && (
                                                        <button onClick={() => fetchDoubts(doubtPage + 1, doubtSort, true)} disabled={loadingMore}
                                                            style={{
                                                                padding: '10px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
                                                                borderRadius: '8px', color: '#60a5fa', cursor: loadingMore ? 'not-allowed' : 'pointer',
                                                                fontSize: '13px', fontWeight: '500', marginTop: '8px'
                                                            }}>
                                                            {loadingMore ? 'Loading...' : 'Load more comments'}
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <div style={{ textAlign: 'center', padding: '50px 20px', color: '#6b7280' }}>
                                                    <FaCode style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.3 }} />
                                                    <p style={{ fontSize: '15px', fontWeight: '500' }}>Be the first to comment!</p>
                                                    <p style={{ fontSize: '12px', marginTop: '4px' }}>Share your approach, ask questions, or help others.</p>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* ── Report Modal ── */}
                                    <ReportModal
                                        isOpen={reportData.isOpen}
                                        onClose={() => setReportData({ ...reportData, isOpen: false })}
                                        contentId={reportData.contentId}
                                        contentType={reportData.contentType}
                                        reportedUserId={reportData.reportedUserId}
                                    />
                                </div>

                                /* ═══ EDITORIAL TAB ═══ */
                            ) : activeTab === 'Editorial' ? (
                                <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '12px' : '20px' }} className="custom-scrollbar">
                                    {(() => {
                                        // Fetch editorial on mount
                                        if (!editorialData && !editorialLoading) {
                                            setEditorialLoading(true);
                                            api.get(`/problems/${problem._id}/editorial`)
                                                .then(res => {
                                                    setEditorialData(res.data.editorial || { approaches: [] });
                                                    setEditorialPublished(res.data.editorialPublished || false);
                                                })
                                                .catch(() => setEditorialData({ approaches: [] }))
                                                .finally(() => setEditorialLoading(false));
                                        }
                                        return null;
                                    })()}

                                    {editorialLoading ? (
                                        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                                            <FaClock style={{ animation: 'spin 1s linear infinite', color: '#3b82f6', fontSize: '24px' }} />
                                        </div>
                                    ) : editorialEditing ? (
                                        /* ── ADMIN EDIT MODE ── */
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', margin: 0 }}>Edit Editorial</h2>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button onClick={() => { setEditorialEditing(false); }} style={{
                                                        padding: '6px 14px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                                                        borderRadius: '8px', color: '#9ca3af', cursor: 'pointer', fontSize: '12px'
                                                    }}>Cancel</button>
                                                    <button onClick={async () => {
                                                        const validApproaches = editorialApproaches.filter(a => a.title.trim() && a.description.trim());
                                                        if (validApproaches.length === 0) { toast.error('Add at least one approach with title and description'); return; }
                                                        setEditorialSaving(true);
                                                        try {
                                                            const res = await api.put(`/problems/${problem._id}/editorial`, { approaches: validApproaches, publish: true });
                                                            setEditorialData(res.data.editorial);
                                                            setEditorialPublished(res.data.editorialPublished);
                                                            setEditorialEditing(false);
                                                            toast.success('Editorial saved!');
                                                        } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
                                                        finally { setEditorialSaving(false); }
                                                    }} disabled={editorialSaving} style={{
                                                        padding: '6px 14px', background: '#3b82f6', border: 'none',
                                                        borderRadius: '8px', color: 'white', cursor: editorialSaving ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: '600'
                                                    }}>{editorialSaving ? 'Saving...' : 'Save & Publish'}</button>
                                                </div>
                                            </div>

                                            {editorialApproaches.map((approach, aIdx) => (
                                                <div key={aIdx} style={{
                                                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                                                    borderRadius: '12px', padding: '16px', marginBottom: '16px'
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                        <span style={{ color: '#60a5fa', fontWeight: '600', fontSize: '13px' }}>Approach #{aIdx + 1}</span>
                                                        {editorialApproaches.length > 1 && (
                                                            <button onClick={() => setEditorialApproaches(editorialApproaches.filter((_, i) => i !== aIdx))}
                                                                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', color: '#f87171', cursor: 'pointer', padding: '4px 10px', fontSize: '11px' }}>
                                                                Remove
                                                            </button>
                                                        )}
                                                    </div>

                                                    <input placeholder="Approach title (e.g. Brute Force, Optimal - Two Pointers)" value={approach.title}
                                                        onChange={e => { const u = [...editorialApproaches]; u[aIdx] = { ...u[aIdx], title: e.target.value }; setEditorialApproaches(u); }}
                                                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', color: 'white', fontSize: '13px', marginBottom: '10px', outline: 'none', boxSizing: 'border-box' }} />

                                                    <textarea placeholder="Explain the approach in detail..." value={approach.description} rows={5}
                                                        onChange={e => { const u = [...editorialApproaches]; u[aIdx] = { ...u[aIdx], description: e.target.value }; setEditorialApproaches(u); }}
                                                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 12px', color: 'white', fontSize: '13px', resize: 'vertical', minHeight: '80px', outline: 'none', fontFamily: 'inherit', marginBottom: '10px', boxSizing: 'border-box' }} />

                                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                                                        <input placeholder="Time: O(n)" value={approach.timeComplexity}
                                                            onChange={e => { const u = [...editorialApproaches]; u[aIdx] = { ...u[aIdx], timeComplexity: e.target.value }; setEditorialApproaches(u); }}
                                                            style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px 10px', color: '#a5f3fc', fontSize: '12px', outline: 'none' }} />
                                                        <input placeholder="Space: O(1)" value={approach.spaceComplexity}
                                                            onChange={e => { const u = [...editorialApproaches]; u[aIdx] = { ...u[aIdx], spaceComplexity: e.target.value }; setEditorialApproaches(u); }}
                                                            style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px 10px', color: '#a5f3fc', fontSize: '12px', outline: 'none' }} />
                                                    </div>

                                                    <textarea placeholder="Optional code snippet" value={approach.code || ''} rows={4}
                                                        onChange={e => { const u = [...editorialApproaches]; u[aIdx] = { ...u[aIdx], code: e.target.value }; setEditorialApproaches(u); }}
                                                        style={{ width: '100%', background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 12px', color: '#a5d6ff', fontSize: '12px', fontFamily: 'monospace', resize: 'vertical', minHeight: '60px', outline: 'none', marginBottom: '10px', boxSizing: 'border-box' }} />

                                                    {/* Media section */}
                                                    <div style={{ marginTop: '8px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                            <span style={{ color: '#9ca3af', fontSize: '12px', fontWeight: '600' }}>📎 Media (Images & Videos)</span>
                                                            <button type="button" onClick={() => {
                                                                const u = [...editorialApproaches];
                                                                u[aIdx] = { ...u[aIdx], media: [...(u[aIdx].media || []), { type: 'image', url: '', caption: '' }] };
                                                                setEditorialApproaches(u);
                                                            }} style={{
                                                                background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '6px',
                                                                color: '#60a5fa', cursor: 'pointer', padding: '3px 10px', fontSize: '11px'
                                                            }}>+ Add Media</button>
                                                        </div>
                                                        {(approach.media || []).map((m, mIdx) => (
                                                            <div key={mIdx} style={{ display: 'flex', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
                                                                <select value={m.type} onChange={e => {
                                                                    const u = [...editorialApproaches]; const media = [...(u[aIdx].media || [])];
                                                                    media[mIdx] = { ...media[mIdx], type: e.target.value }; u[aIdx] = { ...u[aIdx], media }; setEditorialApproaches(u);
                                                                }} style={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '4px', color: 'white', fontSize: '11px', outline: 'none' }}>
                                                                    <option value="image">🖼 Image</option>
                                                                    <option value="video">🎬 Video</option>
                                                                </select>
                                                                <input placeholder="URL (https://...)" value={m.url} onChange={e => {
                                                                    const u = [...editorialApproaches]; const media = [...(u[aIdx].media || [])];
                                                                    media[mIdx] = { ...media[mIdx], url: e.target.value }; u[aIdx] = { ...u[aIdx], media }; setEditorialApproaches(u);
                                                                }} style={{ flex: 2, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '4px 8px', color: 'white', fontSize: '11px', outline: 'none' }} />
                                                                <input placeholder="Caption (optional)" value={m.caption || ''} onChange={e => {
                                                                    const u = [...editorialApproaches]; const media = [...(u[aIdx].media || [])];
                                                                    media[mIdx] = { ...media[mIdx], caption: e.target.value }; u[aIdx] = { ...u[aIdx], media }; setEditorialApproaches(u);
                                                                }} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '4px 8px', color: 'white', fontSize: '11px', outline: 'none' }} />
                                                                <button type="button" onClick={() => {
                                                                    const u = [...editorialApproaches]; u[aIdx] = { ...u[aIdx], media: (u[aIdx].media || []).filter((_, i) => i !== mIdx) }; setEditorialApproaches(u);
                                                                }} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '14px', padding: '2px' }}>×</button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}

                                            <button onClick={() => setEditorialApproaches([...editorialApproaches, { title: '', description: '', timeComplexity: '', spaceComplexity: '', code: '', codeLanguage: '', media: [] }])}
                                                style={{
                                                    width: '100%', padding: '10px', background: 'rgba(59,130,246,0.08)', border: '1px dashed rgba(59,130,246,0.3)',
                                                    borderRadius: '10px', color: '#60a5fa', cursor: 'pointer', fontSize: '13px', fontWeight: '500'
                                                }}>+ Add Another Approach</button>
                                        </div>
                                    ) : (
                                        /* ── READ-ONLY VIEW ── */
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', margin: 0 }}>Editorial</h2>
                                                {isAdmin && (
                                                    <button onClick={() => {
                                                        setEditorialApproaches(
                                                            editorialData?.approaches?.length > 0
                                                                ? editorialData.approaches.map(a => ({ ...a, media: a.media || [] }))
                                                                : [{ title: '', description: '', timeComplexity: '', spaceComplexity: '', code: '', codeLanguage: '', media: [] }]
                                                        );
                                                        setEditorialEditing(true);
                                                    }} style={{
                                                        padding: '6px 14px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
                                                        borderRadius: '8px', color: '#60a5fa', cursor: 'pointer', fontSize: '12px', fontWeight: '500'
                                                    }}>{editorialData?.approaches?.length > 0 ? '✏️ Edit' : '+ Write Editorial'}</button>
                                                )}
                                            </div>

                                            {!editorialPublished && !isAdmin ? (
                                                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
                                                    <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.3 }}>📝</div>
                                                    <p style={{ fontSize: '15px', fontWeight: '500' }}>Editorial not available yet</p>
                                                    <p style={{ fontSize: '12px', marginTop: '4px' }}>The editorial for this problem hasn't been published.</p>
                                                </div>
                                            ) : !editorialData?.approaches?.length ? (
                                                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
                                                    <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.3 }}>📝</div>
                                                    <p style={{ fontSize: '15px', fontWeight: '500' }}>No editorial yet</p>
                                                    {isAdmin && <p style={{ fontSize: '12px', marginTop: '4px' }}>Click "Write Editorial" to add one.</p>}
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                    {editorialData.approaches.map((approach, idx) => (
                                                        <div key={idx} style={{
                                                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                                                            borderRadius: '12px', padding: '16px', position: 'relative'
                                                        }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                                                <span style={{
                                                                    background: 'rgba(59,130,246,0.15)', color: '#60a5fa', padding: '2px 8px',
                                                                    borderRadius: '6px', fontSize: '11px', fontWeight: '600'
                                                                }}>Approach {idx + 1}</span>
                                                                <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'white', margin: 0 }}>{approach.title}</h3>
                                                            </div>

                                                            <p style={{ color: '#d1d5db', fontSize: '13px', lineHeight: '1.7', whiteSpace: 'pre-wrap', marginBottom: '12px' }}>
                                                                {approach.description}
                                                            </p>

                                                            {(approach.timeComplexity || approach.spaceComplexity) && (
                                                                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                                                                    {approach.timeComplexity && (
                                                                        <span style={{ background: 'rgba(16,185,129,0.1)', color: '#6ee7b7', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>
                                                                            ⏱ {approach.timeComplexity}
                                                                        </span>
                                                                    )}
                                                                    {approach.spaceComplexity && (
                                                                        <span style={{ background: 'rgba(168,85,247,0.1)', color: '#c4b5fd', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>
                                                                            💾 {approach.spaceComplexity}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {approach.code && (
                                                                <pre style={{
                                                                    background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
                                                                    padding: '12px', overflowX: 'auto', marginBottom: '12px', fontSize: '12px',
                                                                    color: '#a5d6ff', fontFamily: 'monospace', lineHeight: '1.5'
                                                                }}><code>{approach.code}</code></pre>
                                                            )}

                                                            {approach.media?.length > 0 && (
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                                                                    {approach.media.map((m, mIdx) => (
                                                                        <div key={mIdx} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                                                                            {m.type === 'image' ? (
                                                                                <img src={m.url} alt={m.caption || `Diagram ${mIdx + 1}`}
                                                                                    style={{ width: '100%', display: 'block', borderRadius: '8px' }}
                                                                                    onError={e => { e.target.style.display = 'none'; }} />
                                                                            ) : (
                                                                                <video controls style={{ width: '100%', display: 'block', borderRadius: '8px', maxHeight: '400px' }}>
                                                                                    <source src={m.url} />
                                                                                    Your browser does not support the video tag.
                                                                                </video>
                                                                            )}
                                                                            {m.caption && (
                                                                                <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', color: '#9ca3af', fontSize: '12px', fontStyle: 'italic' }}>
                                                                                    {m.caption}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}

                                                    {editorialData.publishedBy && (
                                                        <div style={{ color: '#6b7280', fontSize: '11px', textAlign: 'right', marginTop: '4px' }}>
                                                            Published by {editorialData.publishedBy.username || 'Admin'}
                                                            {editorialData.publishedAt && ` · ${new Date(editorialData.publishedAt).toLocaleDateString()}`}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                /* Solutions Tab */
                            ) : activeTab === 'Solutions' ? (
                                <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '12px' : '20px' }} className="custom-scrollbar">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: '14px', gap: '10px', flexDirection: isMobile ? 'column' : 'row' }}>
                                        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', margin: 0 }}>Community Solutions</h2>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: isMobile ? '100%' : 'auto' }}>
                                            <select
                                                value={solutionsSort}
                                                onChange={(event) => setSolutionsSort(event.target.value)}
                                                style={{
                                                    background: '#1f2937',
                                                    color: '#d1d5db',
                                                    border: '1px solid rgba(255,255,255,0.12)',
                                                    borderRadius: '8px',
                                                    padding: '6px 10px',
                                                    fontSize: '12px',
                                                    outline: 'none',
                                                    minWidth: isMobile ? '100%' : '160px'
                                                }}
                                            >
                                                <option value="latest">Latest</option>
                                                <option value="runtime">Fastest Runtime</option>
                                                <option value="memory">Least Memory</option>
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => fetchPublicSolutions(1, false)}
                                                style={{
                                                    border: '1px solid rgba(59,130,246,0.45)',
                                                    background: 'rgba(59,130,246,0.15)',
                                                    color: '#93c5fd',
                                                    borderRadius: '8px',
                                                    padding: '6px 10px',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                Refresh
                                            </button>
                                        </div>
                                    </div>

                                    {fetchingSolutions && publicSolutions.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '36px', color: '#6b7280' }}>
                                            <FaSpinner style={{ animation: 'spin 1s linear infinite', fontSize: '22px', color: '#60a5fa', marginBottom: '10px' }} />
                                            <div>Loading solutions...</div>
                                        </div>
                                    ) : !Array.isArray(publicSolutions) || publicSolutions.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '36px', color: '#6b7280', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                                            <FaCode style={{ fontSize: '30px', marginBottom: '10px', opacity: 0.4 }} />
                                            <p style={{ margin: 0, fontSize: '13px' }}>No accepted public solutions yet for this problem.</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {publicSolutions.map((solution) => {
                                                const solutionId = String(solution?._id || '');
                                                const authorId = String(solution?.user?._id || '');
                                                const expanded = Boolean(expandedSolutions?.[solutionId]);
                                                const isSelf = authorId && authorId === currentUserId;
                                                const followState = Boolean(solutionsFollowMap?.[authorId] ?? solution?.user?.isFollowing);

                                                return (
                                                    <div
                                                        key={solutionId || `${authorId}-${solution?.createdAt}`}
                                                        style={{
                                                            border: '1px solid rgba(255,255,255,0.08)',
                                                            borderRadius: '12px',
                                                            background: 'rgba(255,255,255,0.02)',
                                                            padding: isMobile ? '12px' : '14px'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '10px', flexDirection: isMobile ? 'column' : 'row' }}>
                                                            <div style={{ minWidth: 0 }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                                    <Link to={`/profile/${solution?.user?.username || ''}`} style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>
                                                                        {solution?.user?.username || 'Unknown'}
                                                                    </Link>
                                                                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                                                        {getRelativeTime(solution?.createdAt)}
                                                                    </span>
                                                                    <span style={{ fontSize: '0.7rem', color: '#cbd5e1', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', padding: '2px 8px' }}>
                                                                        {solution?.language || 'unknown'}
                                                                    </span>
                                                                </div>
                                                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '6px', color: '#9ca3af', fontSize: '0.74rem' }}>
                                                                    <span>Runtime: {Number(solution?.runtime || 0).toFixed(2)} ms</span>
                                                                    <span>Memory: {Number(solution?.memory || 0).toFixed(2)} MB</span>
                                                                    <span>Tests: {Number(solution?.testCasesPassed || 0)}/{Number(solution?.totalTestCases || 0)}</span>
                                                                    <span>Solved: {Number(solution?.user?.problemsSolved || 0)}</span>
                                                                </div>
                                                            </div>

                                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-end' }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleSolutionExpand(solutionId)}
                                                                    style={{
                                                                        border: '1px solid rgba(59,130,246,0.4)',
                                                                        background: 'rgba(59,130,246,0.15)',
                                                                        color: '#93c5fd',
                                                                        borderRadius: '8px',
                                                                        padding: '7px 10px',
                                                                        fontSize: '12px',
                                                                        fontWeight: 600,
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    {expanded ? 'Hide Solution' : 'View Solution'}
                                                                </button>
                                                                {isAuthenticated && (
                                                                    <FollowButton
                                                                        targetUserId={authorId}
                                                                        isSelf={isSelf}
                                                                        initialFollowing={followState}
                                                                        size="sm"
                                                                        onStateChange={(nextState) => handleSolutionFollowStateChange(authorId, nextState)}
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>

                                                        {expanded && (
                                                            <pre
                                                                style={{
                                                                    marginTop: '10px',
                                                                    background: '#0f172a',
                                                                    border: '1px solid rgba(255,255,255,0.08)',
                                                                    borderRadius: '8px',
                                                                    padding: isMobile ? '10px' : '12px',
                                                                    fontSize: '12px',
                                                                    color: '#e2e8f0',
                                                                    overflowX: 'auto',
                                                                    whiteSpace: 'pre'
                                                                }}
                                                            >
                                                                <code>{String(solution?.code || '').trim() || '// Solution not available'}</code>
                                                            </pre>
                                                        )}
                                                    </div>
                                                );
                                            })}

                                            {solutionsHasMore && (
                                                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
                                                    <button
                                                        type="button"
                                                        disabled={fetchingSolutions}
                                                        onClick={() => fetchPublicSolutions((solutionsPage || 1) + 1, true)}
                                                        style={{
                                                            border: '1px solid rgba(59,130,246,0.45)',
                                                            background: 'rgba(59,130,246,0.15)',
                                                            color: '#93c5fd',
                                                            borderRadius: '8px',
                                                            padding: '8px 14px',
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                            cursor: fetchingSolutions ? 'not-allowed' : 'pointer',
                                                            opacity: fetchingSolutions ? 0.6 : 1
                                                        }}
                                                    >
                                                        {fetchingSolutions ? 'Loading...' : 'Load More Solutions'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                /* Fallback Tab */
                            ) : (
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', flexDirection: 'column' }}>
                                    <FaCode style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.3 }} />
                                    <p>{activeTab} coming soon!</p>
                                </div>
                            )}
                        </div>
                    </Panel>

                    <PanelResizeHandle style={{
                        width: isMobile ? '100%' : '4px',
                        height: isMobile ? '4px' : '100%',
                        background: 'rgba(255,255,255,0.1)',
                        cursor: isMobile ? 'row-resize' : 'col-resize'
                    }} />

                    {/* ═══ SECTION 2+3: Code Editor + Test Cases ═══ */}
                    <Panel ref={rightPanelRef} defaultSize={isMobile ? mobileRightPanelDefault : 67} minSize={isMobile ? 35 : 40} collapsible={true}>
                        <PanelGroup orientation="vertical" style={{ height: '100%', minHeight: 0 }}>
                            {/* Editor Panel */}
                            <Panel
                                ref={editorPanelRef}
                                defaultSize={isMobile ? mobileEditorPanelDefault : 70}
                                minSize={isMobile ? 35 : 20}
                                maxSize={isMobile ? 65 : 90}
                                collapsible={true}
                            >
                                <div style={{
                                    height: '100%', display: 'flex', flexDirection: 'column',
                                    ...(expandedPanel === 'editor' ? {
                                        position: 'fixed',
                                        top: isMobile ? 0 : 48,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        zIndex: 250,
                                        background: '#1f2937',
                                        width: '100vw',
                                        maxWidth: '100vw',
                                        height: isMobile ? '100dvh' : 'auto',
                                        overflow: 'hidden'
                                    } : {})
                                }}>
                                    <div style={{
                                        padding: '10px', background: '#1f2937', color: 'white',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        borderBottom: '1px solid rgba(255,255,255,0.1)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <FaCode className="text-blue-500" />
                                            <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Code Editor</span>
                                        </div>
                                        <button onClick={() => toggleExpand('editor')} title={expandedPanel === 'editor' ? "Restore" : "Maximize"} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                                            {expandedPanel === 'editor' ? <FaCompress /> : <FaExpand />}
                                        </button>
                                    </div>
                                    <div style={{ flex: 1, position: 'relative' }}>
                                        <CodeEditor
                                            code={code}
                                            setCode={setCode}
                                            language={language}
                                            theme="vs-dark"
                                        />
                                    </div>
                                </div>
                            </Panel>

                            <PanelResizeHandle style={{ height: '4px', background: 'rgba(255,255,255,0.1)', cursor: 'row-resize' }} />

                            {/* Test Cases / Console Panel */}
                            <Panel
                                ref={consolePanelRef}
                                defaultSize={isMobile ? mobileConsolePanelDefault : 30}
                                minSize={isMobile ? 35 : 20}
                                maxSize={isMobile ? 65 : 80}
                                collapsible={true}
                            >
                                <div style={{
                                    height: '100%', background: '#111827', display: 'flex', flexDirection: 'column',
                                    ...(expandedPanel === 'console' ? {
                                        position: 'fixed',
                                        top: isMobile ? 0 : 48,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        zIndex: 250,
                                        background: '#111827',
                                        width: '100vw',
                                        maxWidth: '100vw',
                                        height: isMobile ? '100dvh' : 'auto',
                                        overflow: 'hidden'
                                    } : {})
                                }}>
                                    <div style={{
                                        padding: '10px', background: '#1f2937', color: 'white',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        borderBottom: '1px solid rgba(255,255,255,0.1)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <FaList className="text-green-500" />
                                            <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Test Results</span>
                                        </div>
                                        {submissionResult && (
                                            <button onClick={() => setSubmissionResult(null)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '11px' }}>
                                                Clear
                                            </button>
                                        )}
                                        <button onClick={() => toggleExpand('console')} title={expandedPanel === 'console' ? "Restore" : "Maximize"} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                                            {expandedPanel === 'console' ? <FaCompress /> : <FaExpand />}
                                        </button>
                                    </div>
                                    <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '12px' : '14px 20px' }} className="custom-scrollbar">
                                        {submissionResult ? (
                                            <div>
                                                {submissionResult.error ? (
                                                    <div style={{ color: '#f87171' }}>
                                                        <h3 style={{ fontSize: '13px', fontWeight: 'bold' }}>Error</h3>
                                                        <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '4px', whiteSpace: 'pre-wrap', fontSize: '12px' }}>{submissionResult.error}</pre>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            {resultCases.length > 0 && resultCases.every(r => r.passed) ? (
                                                                <span style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '14px' }}>All Tests Passed</span>
                                                            ) : (
                                                                <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '14px' }}>Tests Failed</span>
                                                            )}
                                                            {resultCases.length > 0 && (
                                                                <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                                                                    ({passedResultCases}/{resultCases.length} passed)
                                                                </span>
                                                            )}
                                                        </div>
                                                        {submissionResult.firstFailedTestCase && (
                                                            <div style={{ marginBottom: '10px', background: 'rgba(239,68,68,0.12)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.4)' }}>
                                                                <div style={{ fontSize: '12px', color: '#fca5a5', fontWeight: 'bold', marginBottom: '4px' }}>
                                                                    First Failed Test Case: #{submissionResult.firstFailedTestCase.testCaseNumber}
                                                                </div>
                                                                <div style={{ fontSize: '11px', color: '#d1d5db', whiteSpace: 'pre-wrap' }}>Input: {formatInputDisplay(submissionResult.firstFailedTestCase.input, problem?.parameters || [])}</div>
                                                                <div style={{ fontSize: '11px', color: '#d1d5db' }}>Expected: {formatOutputDisplay(submissionResult.firstFailedTestCase.expectedOutput)}</div>
                                                                <div style={{ fontSize: '11px', color: '#d1d5db' }}>Actual: {formatOutputDisplay(submissionResult.firstFailedTestCase.actualOutput)}</div>
                                                                {submissionResult.firstFailedTestCase.error && (
                                                                    <div style={{ fontSize: '11px', color: '#f87171', marginTop: '4px' }}>
                                                                        Error: {submissionResult.firstFailedTestCase.error}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        {resultCases.map((res, idx) => (
                                                            <div key={idx} style={{ marginBottom: '10px', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '6px' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>Case {res.testCaseNumber || (idx + 1)}</span>
                                                                    <span style={{ color: res.passed ? '#22c55e' : '#ef4444', fontSize: '11px' }}>{res.passed ? 'Passed' : 'Failed'}</span>
                                                                </div>
                                                                {res.isHidden ? (
                                                                    <div style={{ fontSize: '11px', color: '#6b7280' }}>
                                                                        Hidden test case {res.passed ? 'passed' : 'failed'}.
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <div style={{ fontSize: '11px', color: '#6b7280', whiteSpace: 'pre-wrap' }}>
                                                                            Input: {formatInputDisplay(res.input, problem?.parameters || [])}
                                                                        </div>
                                                                        <div style={{ fontSize: '11px', color: '#6b7280' }}>Expected: {formatOutputDisplay(res.expectedOutput)}</div>
                                                                        <div style={{ fontSize: '11px', color: '#6b7280' }}>Actual: {formatOutputDisplay(res.actualOutput)}</div>
                                                                    </>
                                                                )}
                                                                {res.printedOutput && (
                                                                    <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px' }}>
                                                                        stdout: {res.printedOutput}
                                                                    </div>
                                                                )}
                                                                {res.error && (
                                                                    <div style={{ fontSize: '11px', color: '#f87171', marginTop: '4px' }}>
                                                                        Error: {res.error}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                                {problem.sampleTestCases && problem.sampleTestCases.map((tc, idx) => (
                                                    <div key={idx} style={{ flex: isMobile ? '1 1 100%' : '1 1 calc(50% - 6px)', minWidth: isMobile ? '0' : '220px', background: 'rgba(17, 24, 39, 0.5)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                        <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '4px', fontWeight: 'bold' }}>Test Case {idx + 1}</div>
                                                        <div style={{ background: 'rgba(0,0,0,0.4)', padding: '6px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '11px', color: '#d1d5db', whiteSpace: 'pre-wrap' }}>
                                                            {formatInputDisplay(tc.input, problem.parameters)}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Panel>
                        </PanelGroup>
                    </Panel>
                </PanelGroup>
            </div>

            <SubmissionResultModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                result={submissionResult}
                problemParameters={problem?.parameters || []}
            />
            <PerformanceGraphModal
                isOpen={isPerformanceModalOpen}
                onClose={closePerformanceGraph}
                data={performanceGraphData}
                loading={performanceGraphLoading}
                error={performanceGraphError}
                onRetry={() => {
                    if (activePerformanceSubmissionId) {
                        openPerformanceGraph(activePerformanceSubmissionId);
                    }
                }}
            />
        </div>
    );
};

export default ProblemWorkspace;

