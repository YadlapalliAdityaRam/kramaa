import React from 'react';
import { FaCheckCircle, FaTimesCircle, FaClock, FaMemory, FaCode, FaExclamationTriangle } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTestCaseInput, formatTestCaseOutput } from '../../utils/testCaseDisplay';

const SubmissionResultModal = ({ isOpen, onClose, result, problemParameters = [] }) => {
    if (!isOpen || !result) return null;

    const formatRuntime = (value) => {
        const numeric = Number(value);
        if (!Number.isFinite(numeric) || numeric <= 0) return '0.000 ms';
        if (numeric < 1) return `${numeric.toFixed(3)} ms`;
        return `${numeric.toFixed(2)} ms`;
    };

    const formatMemory = (value) => {
        const numeric = Number(value);
        if (!Number.isFinite(numeric) || numeric <= 0) return '0.000 MB';
        if (numeric < 1) return `${numeric.toFixed(3)} MB`;
        return `${numeric.toFixed(2)} MB`;
    };

    const hasGlobalError = !!result.error;
    let isSuccess = false;
    if (!hasGlobalError) {
        if (result.submission) {
            isSuccess = result.submission.status === 'accepted';
        } else if (result.testResults) {
            isSuccess = result.testResults.every(r => r.passed);
        }
    }

    const stats = result.stats || { averageTime: 0, maxMemory: 0 };
    const limits = result.limits || { timeLimit: 2000, memoryLimit: 256 };
    const runtimeMs = Number(stats.averageTime) || 0;
    const memoryMb = Number(stats.maxMemory) || 0;

    // Percentiles (from backend)
    const runtimePercentile = Math.max(0, Math.min(100, Number(stats.runtimePercentile) || 0));
    const memoryPercentile = Math.max(0, Math.min(100, Number(stats.memoryPercentile) || 0));

    // Bar Chart Data: User vs Average (Simulated or from stats if available)
    // To make it look like LeetCode, we show "You beat X%".
    // Visual: A bar representing the percentile.

    const timeData = [
        { name: 'Slower', value: 100 - Number(runtimePercentile), fill: '#374151' },
        { name: 'You', value: Number(runtimePercentile), fill: '#10b981' }
    ];

    const memoryData = [
        { name: 'More Mem', value: 100 - Number(memoryPercentile), fill: '#374151' },
        { name: 'You', value: Number(memoryPercentile), fill: '#3b82f6' }
    ];

    // Failure Data (First failed test case)
    const failedTest = result.testResults ? result.testResults.find(r => !r.passed) : null;
    const failedActualOutput = failedTest
        ? (failedTest.actualOutput === undefined || failedTest.actualOutput === null || failedTest.actualOutput === ''
            ? (failedTest.error ? `Error: ${failedTest.error}` : 'No Output')
            : formatTestCaseOutput(failedTest.actualOutput))
        : '';

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        style={{
                            background: 'var(--ws-panel)',
                            border: '1px solid var(--ws-border)',
                            borderRadius: '16px',
                            color: 'var(--ws-text)',
                            width: '100%',
                            maxWidth: '56rem',
                            maxHeight: '90vh',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '20px 24px',
                            borderBottom: '1px solid var(--ws-border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: isSuccess ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                    padding: '12px',
                                    borderRadius: '999px',
                                    background: isSuccess ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                    color: isSuccess ? '#22c55e' : '#ef4444'
                                }}>
                                    {isSuccess ? <FaCheckCircle style={{ fontSize: '24px' }} /> : <FaTimesCircle style={{ fontSize: '24px' }} />}
                                </div>
                                <div>
                                    <h2 style={{
                                        fontSize: '22px',
                                        fontWeight: 'bold',
                                        margin: 0,
                                        color: isSuccess ? '#22c55e' : '#ef4444'
                                    }}>
                                        {isSuccess ? 'Submission Accepted!' : 'Submission Failed'}
                                    </h2>
                                    <p style={{ margin: '4px 0 0', color: 'var(--ws-text-muted)', fontSize: '13px' }}>
                                        {isSuccess ? 'Great job! Your solution passed all test cases.' : "Don't worry, check the error details below and try again."}
                                    </p>
                                </div>
                            </div>
                            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--ws-text-muted)', cursor: 'pointer', fontSize: '24px' }}>&times;</button>
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }} className="custom-scrollbar">
                            {isSuccess ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                                    {/* Time Complexity */}
                                    <div style={{ background: 'var(--ws-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--ws-border)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--ws-text)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                                                <FaClock style={{ color: '#22c55e' }} /> Runtime
                                            </h3>
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--ws-text)' }}>{formatRuntime(runtimeMs)}</span>
                                            </div>
                                        </div>
                                        <div style={{ marginBottom: '16px' }}>
                                            <p style={{ color: 'var(--ws-text-muted)', fontSize: '13px', margin: '0 0 4px' }}>Beats <span style={{ color: '#22c55e', fontWeight: 'bold' }}>{parseFloat(runtimePercentile).toFixed(1)}%</span> of users</p>
                                            <div style={{ width: '100%', background: 'var(--ws-border)', height: '8px', borderRadius: '999px', overflow: 'hidden' }}>
                                                <div
                                                    style={{ width: `${runtimePercentile}%`, background: '#22c55e', height: '100%', borderRadius: '999px', transition: 'width 1s ease-out' }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Space Complexity */}
                                    <div style={{ background: 'var(--ws-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--ws-border)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--ws-text)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                                                <FaMemory style={{ color: '#3b82f6' }} /> Memory
                                            </h3>
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--ws-text)' }}>{formatMemory(memoryMb)}</span>
                                            </div>
                                        </div>
                                        <div style={{ marginBottom: '16px' }}>
                                            <p style={{ color: 'var(--ws-text-muted)', fontSize: '13px', margin: '0 0 4px' }}>Beats <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{parseFloat(memoryPercentile).toFixed(1)}%</span> of users</p>
                                            <div style={{ width: '100%', background: 'var(--ws-border)', height: '8px', borderRadius: '999px', overflow: 'hidden' }}>
                                                <div
                                                    style={{ width: `${memoryPercentile}%`, background: '#3b82f6', height: '100%', borderRadius: '999px', transition: 'width 1s ease-out' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {hasGlobalError ? (
                                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '20px' }}>
                                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px' }}>
                                                <FaExclamationTriangle /> Execution Error
                                            </h3>
                                            <div style={{ background: 'var(--ws-card)', padding: '14px', borderRadius: '8px', border: '1px solid var(--ws-border)', fontFamily: 'monospace', fontSize: '13px', color: '#f87171', whiteSpace: 'pre-wrap', overflow: 'auto', maxHeight: '240px' }} className="custom-scrollbar">
                                                {result.error}
                                            </div>
                                        </div>
                                    ) : failedTest ? (
                                        <div style={{ background: 'var(--ws-card)', borderRadius: '12px', border: '1px solid var(--ws-border)', overflow: 'hidden' }}>
                                            <div style={{ padding: '14px 20px', background: 'var(--ws-panel)', borderBottom: '1px solid var(--ws-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <span style={{ fontWeight: 'bold', color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <FaExclamationTriangle /> Test Case Failed
                                                </span>
                                                {failedTest.isHidden && <span style={{ fontSize: '11px', background: 'var(--ws-tag-bg)', color: 'var(--ws-text-muted)', padding: '2px 8px', borderRadius: '4px' }}>Hidden Test Case</span>}
                                            </div>
                                            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                <div>
                                                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--ws-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', display: 'block' }}>Input</label>
                                                    <div style={{ background: 'var(--ws-input-bg)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--ws-border)', fontFamily: 'monospace', fontSize: '13px', color: 'var(--ws-text-secondary)', overflowX: 'auto' }}>
                                                        {formatTestCaseInput(failedTest.input, problemParameters)}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                                                    <div>
                                                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--ws-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', display: 'block' }}>Expected Output</label>
                                                        <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.25)', fontFamily: 'monospace', fontSize: '13px', color: '#22c55e', overflowX: 'auto' }}>
                                                            {formatTestCaseOutput(failedTest.expectedOutput)}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--ws-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', display: 'block' }}>Your Output</label>
                                                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.25)', fontFamily: 'monospace', fontSize: '13px', color: '#f87171', overflowX: 'auto' }}>
                                                            {failedActualOutput}
                                                        </div>
                                                    </div>
                                                </div>
                                                {failedTest.error && !failedTest.actualOutput && (
                                                    <div>
                                                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--ws-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', display: 'block' }}>Error Details</label>
                                                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.25)', fontFamily: 'monospace', fontSize: '13px', color: '#f87171', whiteSpace: 'pre-wrap' }}>
                                                            {failedTest.error}
                                                        </div>
                                                    </div>
                                                )}
                                                {failedTest.printedOutput && (
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">stdout</label>
                                                        <div className="bg-amber-900/20 p-3 rounded-lg border border-amber-900/40 font-mono text-sm text-amber-300 whitespace-pre-wrap">
                                                            {failedTest.printedOutput}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-400 py-12">
                                            Unknown error occurred. Please check console.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>


                        {/* Footer */}
                        <div className="p-6 border-t border-gray-800 bg-gray-900/50 flex justify-end">
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors border border-gray-700"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </div >
            )}
        </AnimatePresence >
    );
};

export default SubmissionResultModal;
