import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import CodeEditor from '../components/coding/CodeEditor';
import SubmissionResultModal from '../components/coding/SubmissionResultModal';
import api from '../utils/api';
import { generateTemplates } from '../utils/templateGenerator';
import { formatTestCaseInput, formatTestCaseOutput } from '../utils/testCaseDisplay';
import { getRequestErrorMessage } from '../utils/requestError';
import {
    buildContestDraftStorageKey,
    clearLegacyUnscopedEditorDrafts,
    getAuthUserStorageScope,
    readEditorDraft,
    writeEditorDraft
} from '../utils/sessionIsolation';
import { FaPlay, FaCheckCircle, FaExclamationCircle, FaArrowLeft, FaClock, FaCode, FaChevronUp, FaChevronDown } from 'react-icons/fa';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import '../styles/Workspace.css';

const SUBMISSION_REQUEST_TIMEOUT_MS = 120000;
const RUN_REQUEST_TIMEOUT_MS = 60000;

const ContestProblemView = () => {
    const { contestId, problemId } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useSelector(state => state.auth);
    const userStorageScope = getAuthUserStorageScope(user);

    const [problem, setProblem] = useState(null);
    const [contest, setContest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [language, setLanguage] = useState('javascript');
    const [code, setCode] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [submissionResult, setSubmissionResult] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewportWidth, setViewportWidth] = useState(() => (
        typeof window !== 'undefined' ? window.innerWidth : 1400
    ));

    // Tab state
    const [activeTab, setActiveTab] = useState('Description');
    const [userSubmissions, setUserSubmissions] = useState([]);
    const [fetchingSubmissions, setFetchingSubmissions] = useState(false);

    // Fetch Problem and Contest
    useEffect(() => {
        const onResize = () => setViewportWidth(window.innerWidth);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [problemRes, contestRes] = await Promise.all([
                    api.get(`/problems/${problemId}`),
                    api.get(`/contests/${contestId}`)
                ]);
                setProblem(problemRes.data.problem);
                setContest(contestRes.data.contest);
            } catch {
                toast.error("Failed to load problem");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [contestId, problemId]);

    const getStarterTemplate = useCallback((problemData, lang) => {
        const fromProblem = problemData?.starterCode?.[lang];
        if (typeof fromProblem === 'string' && fromProblem.trim().length > 0) {
            return fromProblem;
        }
        const generatedTemplates = generateTemplates(
            problemData?.className || 'Solution',
            problemData?.functionName || 'solve',
            problemData?.returnType || 'void',
            problemData?.parameters || []
        );
        return generatedTemplates?.[lang] || '';
    }, []);

    const getDraftStorageKey = useCallback((cid, pid, lang) => {
        if (!isAuthenticated || !userStorageScope) return null;
        return buildContestDraftStorageKey({
            contestId: cid,
            problemId: pid,
            language: lang,
            userScope: userStorageScope
        });
    }, [isAuthenticated, userStorageScope]);

    useEffect(() => {
        clearLegacyUnscopedEditorDrafts();
    }, []);

    // Load code
    useEffect(() => {
        if (!problem) return;
        const starterTemplate = getStarterTemplate(problem, language);
        const storageKey = getDraftStorageKey(contestId, problemId, language);
        const savedDraft = readEditorDraft({
            storageKey,
            starterTemplate
        });

        if (typeof savedDraft === 'string' && savedDraft.trim().length > 0) {
            setCode(savedDraft);
            return;
        }

        setCode(starterTemplate);
    }, [problem, language, contestId, problemId, getDraftStorageKey, getStarterTemplate]);

    // Save code
    useEffect(() => {
        const storageKey = getDraftStorageKey(contestId, problemId, language);
        if (!storageKey) return;

        writeEditorDraft({
            storageKey,
            code,
            starterTemplate: getStarterTemplate(problem, language)
        });
    }, [code, contestId, problemId, language, problem, getDraftStorageKey, getStarterTemplate]);

    // Contest Timer
    useEffect(() => {
        if (!contest) return;
        const updateTimer = () => {
            const now = new Date();
            const end = new Date(contest.endTime);
            const diff = end - now;

            if (diff <= 0) {
                setTimeRemaining('Contest Ended');
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
        };
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [contest]);

    // Fetch Submissions
    const fetchUserSubmissions = async () => {
        if (!isAuthenticated || !resolvedProblemId) return;
        setFetchingSubmissions(true);
        try {
            // Adjust endpoint if needed. Assuming standard submissions endpoint works.
            const res = await api.get(`/submissions/my-submissions?problemId=${resolvedProblemId}`);
            setUserSubmissions(res.data.submissions);
        } catch (error) {
            console.error("Failed to fetch submissions", error);
        } finally {
            setFetchingSubmissions(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'Submissions' && problem) {
            fetchUserSubmissions();
        }
    }, [activeTab, problem]);

    const resolvedProblemId = problem?._id || problemId;
    const resolvedContestId = contest?.id || contest?._id || contestId;
    const isMobile = viewportWidth <= 768;
    const isCompactMobile = viewportWidth <= 480;
    const mobileLeftPanelDefault = isCompactMobile ? 32 : 35;
    const mobileRightPanelDefault = 100 - mobileLeftPanelDefault;
    const mobileEditorPanelDefault = isCompactMobile ? 50 : 54;
    const mobileResultsPanelDefault = 100 - mobileEditorPanelDefault;


    const handleSubmit = async () => {
        if (!isAuthenticated) return toast.error("Login required");
        if (isRunning || !resolvedProblemId || !resolvedContestId) return;
        setIsRunning(true);
        setSubmissionResult(null);

        try {
            const submitRes = await api.post('/submissions/submit', {
                code,
                language,
                problemId: resolvedProblemId,
                contestId: resolvedContestId
            }, {
                timeout: SUBMISSION_REQUEST_TIMEOUT_MS
            });

            setSubmissionResult(submitRes.data);
            setIsModalOpen(true); // Show modal on submit
            if (submitRes.data.submission.status === 'accepted') {
                confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
                toast.success("Accepted!");
            } else {
                toast.error("Test cases failed.");
            }
        } catch (error) {
            const message = getRequestErrorMessage(error, 'Submission failed');
            toast.error(message);
            setSubmissionResult({ error: message });
        } finally {
            setIsRunning(false);
        }
    };

    const handleRun = async () => {
        if (!isAuthenticated) return toast.error("Login required");
        if (isRunning || !resolvedProblemId) return;
        setIsRunning(true);
        setSubmissionResult(null);
        toast.loading("Running sample cases...");

        try {
            const res = await api.post('/submissions/run-samples', {
                code,
                language,
                problemId: resolvedProblemId
            }, {
                timeout: RUN_REQUEST_TIMEOUT_MS
            });
            setSubmissionResult(res.data);
            toast.dismiss();
            if (res.data.testResults.every(r => r.passed)) {
                toast.success("Samples Passed!");
            } else {
                toast.error("Samples Failed.");
            }
        } catch (error) {
            toast.dismiss();
            const message = getRequestErrorMessage(error, 'Run failed');
            toast.error(message);
            setSubmissionResult({ error: message });
        } finally {
            setIsRunning(false);
        }
    };

    const handleResetCode = () => {
        if (window.confirm("Reset code to starter template?")) {
            const starterCode = getStarterTemplate(problem, language);
            setCode(starterCode);

            const storageKey = getDraftStorageKey(contestId, problemId, language);
            if (storageKey) {
                writeEditorDraft({
                    storageKey,
                    code: starterCode,
                    starterTemplate: starterCode
                });
            }
            toast.success("Code reset");
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100dvh', background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <FaClock style={{ fontSize: '60px', color: '#14b8a6', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                    <p style={{ color: '#9ca3af', fontSize: '20px' }}>Loading Question...</p>
                </div>
            </div>
        );
    }

    if (!problem) return <div>Problem not found</div>;

    const getDifficultyColor = (diff) => {
        switch (diff?.toLowerCase()) {
            case 'easy': return '#22c55e';
            case 'medium': return '#eab308';
            case 'hard': return '#ef4444';
            default: return '#9ca3af';
        }
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

    return (
        <div style={{ height: '100dvh', minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#111827', color: 'white', overflow: 'hidden', paddingBottom: isMobile ? 'env(safe-area-inset-bottom, 0px)' : 0 }}>
            {/* Header */}
            <div style={{
                height: '48px', background: '#1f2937', borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: isMobile ? 'stretch' : 'center', justifyContent: isMobile ? 'flex-start' : 'space-between', padding: isMobile ? '10px 12px' : '0 16px', paddingTop: isMobile ? 'calc(env(safe-area-inset-top, 0px) + 8px)' : 0, flexShrink: 0, flexDirection: isMobile ? 'column' : 'row', minHeight: isMobile ? 'auto' : '48px', gap: isMobile ? '8px' : 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: isMobile ? '100%' : 'auto', flexWrap: isMobile ? 'nowrap' : 'wrap', overflowX: isMobile ? 'auto' : 'visible', paddingBottom: isMobile ? '2px' : 0, WebkitOverflowScrolling: isMobile ? 'touch' : 'auto' }} className={isMobile ? 'custom-scrollbar' : undefined}>
                    <button onClick={() => navigate(`/contest/${contestId}`)} style={{
                        padding: '6px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af',
                        display: 'flex', alignItems: 'center', fontSize: '14px'
                    }}>
                        <FaArrowLeft />
                    </button>
                    <span style={{ fontWeight: 'bold', fontSize: '16px', minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{problem.title}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: isCompactMobile ? '8px' : '10px', width: isMobile ? '100%' : 'auto', flexWrap: isMobile ? 'nowrap' : 'wrap', overflowX: isMobile ? 'auto' : 'visible', paddingBottom: isMobile ? '2px' : 0, WebkitOverflowScrolling: isMobile ? 'touch' : 'auto' }} className={isMobile ? 'custom-scrollbar' : undefined}>
                    {/* Timer */}
                    {timeRemaining && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)',
                            padding: '4px 10px', borderRadius: '6px'
                        }}>
                            <FaClock style={{ color: '#eab308', fontSize: '12px' }} />
                            <span style={{ color: '#eab308', fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace' }}>{timeRemaining}</span>
                        </div>
                    )}

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

                    <button onClick={handleResetCode} style={{ background: '#dc2626', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', border: 'none', cursor: 'pointer' }}>
                        Reset
                    </button>
                    <button onClick={handleRun} disabled={isRunning} style={{
                        background: 'linear-gradient(to right, #2563eb, #3b82f6)', color: 'white', padding: '4px 12px', borderRadius: '6px',
                        fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', border: 'none',
                        cursor: isRunning ? 'not-allowed' : 'pointer', opacity: isRunning ? 0.7 : 1
                    }}>
                        <FaPlay style={{ fontSize: '9px' }} /> Run
                    </button>
                    <button onClick={handleSubmit} disabled={isRunning} style={{
                        background: 'linear-gradient(to right, #059669, #14b8a6)', color: 'white', padding: '4px 14px', borderRadius: '6px',
                        fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', border: 'none',
                        cursor: isRunning ? 'not-allowed' : 'pointer', opacity: isRunning ? 0.7 : 1
                    }}>
                        <FaCheckCircle /> Submit
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, minHeight: 0 }}>
                <PanelGroup orientation={isMobile ? "vertical" : "horizontal"} style={{ height: '100%', minHeight: 0 }}>
                    {/* Left Panel: Description & Submissions */}
                    <Panel defaultSize={isMobile ? mobileLeftPanelDefault : 33} minSize={isMobile ? 24 : 20}>
                        <div style={{ height: '100%', background: '#1f2937', display: 'flex', flexDirection: 'column' }}>
                            {/* Tabs */}
                            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', background: '#111827', overflowX: 'auto', whiteSpace: 'nowrap' }} className="custom-scrollbar">
                                {['Description', 'Submissions'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        style={{
                                            padding: '10px 16px', background: 'transparent',
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

                            {activeTab === 'Description' ? (
                                <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '12px' : '20px' }} className="custom-scrollbar">
                                    <h1 style={{ fontSize: '22px', fontWeight: '600', color: 'white', marginBottom: '12px' }}>{problem.title}</h1>
                                    <div style={{ marginBottom: '20px' }}>
                                        <span style={{
                                            fontSize: '12px', padding: '3px 10px', borderRadius: '20px',
                                            background: `${getDifficultyColor(problem.difficulty)}20`, color: getDifficultyColor(problem.difficulty), fontWeight: '500'
                                        }}>
                                            {problem.difficulty}
                                        </span>
                                        <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '10px' }}>
                                            {problem.points ? `${problem.points} Points` : ''}
                                        </span>
                                    </div>
                                    <div style={{ color: '#d1d5db', lineHeight: '1.7', fontSize: '14px', marginBottom: '28px' }}>
                                        {problem.description}
                                    </div>

                                    <div style={{ marginBottom: '16px' }}>
                                        <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'white', marginBottom: '6px' }}>Input</h3>
                                        <p style={{ color: '#d1d5db', fontSize: '13px', fontFamily: 'monospace', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '6px', margin: 0 }}>
                                            {problem.inputFormat}
                                        </p>
                                    </div>
                                    <div style={{ marginBottom: '16px' }}>
                                        <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'white', marginBottom: '6px' }}>Output</h3>
                                        <p style={{ color: '#d1d5db', fontSize: '13px', fontFamily: 'monospace', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '6px', margin: 0 }}>
                                            {problem.outputFormat}
                                        </p>
                                    </div>
                                    <div style={{ marginBottom: '20px' }}>
                                        <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'white', marginBottom: '6px' }}>Constraints</h3>
                                        <pre style={{ color: '#d1d5db', fontSize: '13px', fontFamily: 'monospace', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '6px', margin: 0, whiteSpace: 'pre-wrap' }}>
                                            {problem.constraints}
                                        </pre>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '12px' : '20px' }} className="custom-scrollbar">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', margin: 0 }}>My Submissions</h2>
                                        <button onClick={fetchUserSubmissions} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '12px' }}>Refresh</button>
                                    </div>
                                    {fetchingSubmissions ? <div style={{ color: '#9ca3af' }}>Loading...</div> : userSubmissions.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {userSubmissions.map((sub) => (
                                                <div key={sub._id} style={{
                                                    background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px',
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer'
                                                }} onClick={() => { setCode(sub.code); setLanguage(sub.language); }}>
                                                    <div>
                                                        <div style={{ fontWeight: 'bold', color: sub.status === 'accepted' ? '#22c55e' : '#ef4444', fontSize: '13px' }}>
                                                            {sub.status === 'accepted' ? 'Accepted' : 'Wrong Answer'}
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: sub.status === 'accepted' ? '#86efac' : '#fcd34d' }}>
                                                            Test cases: {formatTestCaseSummary(sub)}
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: '#6b7280' }}>{new Date(sub.createdAt).toLocaleString()}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ color: '#6b7280' }}>No submissions yet.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </Panel>

                    <PanelResizeHandle style={{ width: isMobile ? '100%' : '4px', height: isMobile ? '4px' : '100%', background: 'rgba(255,255,255,0.1)', cursor: isMobile ? 'row-resize' : 'col-resize' }} />

                    {/* Right Panel: Editor & Results */}
                    <Panel defaultSize={isMobile ? mobileRightPanelDefault : 67} minSize={isMobile ? 35 : 40}>
                        <PanelGroup orientation="vertical" style={{ height: '100%', minHeight: 0 }}>
                            <Panel
                                defaultSize={isMobile ? mobileEditorPanelDefault : 50}
                                minSize={isMobile ? 35 : 20}
                                maxSize={isMobile ? 65 : 85}
                            >
                                <div style={{ height: '100%', background: '#111827', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ background: 'rgba(17, 24, 39, 0.5)', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '6px 16px', flexShrink: 0 }}>
                                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#3b82f6', textTransform: 'uppercase' }}>Code Editor</span>
                                    </div>
                                    <div style={{ flex: 1, position: 'relative' }}>
                                        <CodeEditor code={code} setCode={setCode} language={language} theme="vs-dark" />
                                    </div>
                                </div>
                            </Panel>

                            <PanelResizeHandle style={{ height: '4px', background: 'rgba(255,255,255,0.1)', cursor: 'row-resize' }} />

                            <Panel
                                defaultSize={isMobile ? mobileResultsPanelDefault : 50}
                                minSize={isMobile ? 35 : 20}
                                maxSize={isMobile ? 65 : 85}
                            >
                                <div style={{ height: '100%', background: '#1f2937', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ background: 'rgba(17, 24, 39, 0.5)', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '6px 16px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#eab308', textTransform: 'uppercase' }}>{submissionResult ? 'Results' : 'Test Cases'}</span>
                                        {submissionResult && <button onClick={() => setSubmissionResult(null)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '11px' }}>Clear</button>}
                                    </div>
                                    <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '12px' : '16px' }} className="custom-scrollbar">
                                        {submissionResult ? (
                                            <div>
                                                {submissionResult.error ? (
                                                    <div style={{ color: '#f87171', fontSize: '13px' }}>
                                                        <strong>Error:</strong> <pre style={{ whiteSpace: 'pre-wrap', background: 'rgba(0,0,0,0.3)', padding: '8px', marginTop: '4px' }}>{submissionResult.error}</pre>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div style={{ marginBottom: '10px', color: submissionResult.testResults?.every(r => r.passed) ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>
                                                            {submissionResult.testResults?.every(r => r.passed) ? 'All Passed' : 'Failed'}
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
                                                        {submissionResult.testResults?.map((res, i) => (
                                                            <div key={i} style={{ marginBottom: '8px', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '4px' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                                                    <span>Case {res.testCaseNumber || (i + 1)}</span>
                                                                    <span style={{ color: res.passed ? '#22c55e' : '#ef4444' }}>{res.passed ? 'Passed' : 'Failed'}</span>
                                                                </div>
                                                                {!res.passed && (
                                                                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                                                                        <div>Expected: {formatOutputDisplay(res.expectedOutput)}</div>
                                                                        <div>Actual: {formatOutputDisplay(res.actualOutput)}</div>
                                                                    </div>
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
                                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                {problem.sampleTestCases?.map((tc, i) => (
                                                    <div key={i} style={{ background: 'rgba(17, 24, 39, 0.5)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', flex: isMobile ? '1 1 100%' : '1 1 200px' }}>
                                                        <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Case {i + 1}</div>
                                                        <div style={{ fontSize: '12px', color: '#d1d5db', fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '6px', whiteSpace: 'pre-wrap' }}>
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
        </div>
    );
};

export default ContestProblemView;
