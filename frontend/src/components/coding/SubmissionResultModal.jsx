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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className={`p-6 border-b border-gray-800 flex items-center justify-between ${isSuccess ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-full ${isSuccess ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                    {isSuccess ? <FaCheckCircle className="text-2xl" /> : <FaTimesCircle className="text-2xl" />}
                                </div>
                                <div>
                                    <h2 className={`text-2xl font-bold ${isSuccess ? 'text-green-500' : 'text-red-500'}`}>
                                        {isSuccess ? 'Submission Accepted!' : 'Submission Failed'}
                                    </h2>
                                    <p className="text-gray-400 text-sm">
                                        {isSuccess ? 'Great job! Your solution passed all test cases.' : 'Don\'t worry, check the error details below and try again.'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-2xl">&times;</button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            {isSuccess ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Time Complexity */}
                                    <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-bold text-gray-200 flex items-center gap-2">
                                                <FaClock className="text-green-500" /> Runtime
                                            </h3>
                                            <div className="text-right">
                                                <span className="text-2xl font-bold text-white block">{formatRuntime(runtimeMs)}</span>
                                            </div>
                                        </div>
                                        <div className="mb-4">
                                            <p className="text-gray-400 text-sm mb-1">Beats <span className="text-green-400 font-bold">{parseFloat(runtimePercentile).toFixed(1)}%</span> of users</p>
                                            <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-green-500 h-full rounded-full transition-all duration-1000 ease-out"
                                                    style={{ width: `${runtimePercentile}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Space Complexity */}
                                    <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-bold text-gray-200 flex items-center gap-2">
                                                <FaMemory className="text-blue-500" /> Memory
                                            </h3>
                                            <div className="text-right">
                                                <span className="text-2xl font-bold text-white block">{formatMemory(memoryMb)}</span>
                                            </div>
                                        </div>
                                        <div className="mb-4">
                                            <p className="text-gray-400 text-sm mb-1">Beats <span className="text-blue-400 font-bold">{parseFloat(memoryPercentile).toFixed(1)}%</span> of users</p>
                                            <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-blue-500 h-full rounded-full transition-all duration-1000 ease-out"
                                                    style={{ width: `${memoryPercentile}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {hasGlobalError ? (
                                        <div className="bg-red-900/20 border border-red-900/50 rounded-xl p-6">
                                            <h3 className="text-lg font-bold text-red-400 flex items-center gap-2 mb-4">
                                                <FaExclamationTriangle /> Execution Error
                                            </h3>
                                            <div className="bg-black/40 p-4 rounded-lg border border-red-900/30 font-mono text-sm text-red-300 whitespace-pre-wrap overflow-auto max-h-60 custom-scrollbar">
                                                {result.error}
                                            </div>
                                        </div>
                                    ) : failedTest ? (
                                        <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
                                            <div className="p-4 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
                                                <span className="font-bold text-red-400 flex items-center gap-2">
                                                    <FaExclamationTriangle /> Test Case Failed
                                                </span>
                                                {failedTest.isHidden && <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">Hidden Test Case</span>}
                                            </div>
                                            <div className="p-6 space-y-4">
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Input</label>
                                                    <div className="bg-black/40 p-3 rounded-lg border border-gray-700 font-mono text-sm text-gray-300 overflow-x-auto">
                                                        {formatTestCaseInput(failedTest.input, problemParameters)}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Expected Output</label>
                                                        <div className="bg-green-900/20 p-3 rounded-lg border border-green-900/40 font-mono text-sm text-green-400 overflow-x-auto">
                                                            {formatTestCaseOutput(failedTest.expectedOutput)}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Your Output</label>
                                                        <div className="bg-red-900/20 p-3 rounded-lg border border-red-900/40 font-mono text-sm text-red-400 overflow-x-auto">
                                                            {failedActualOutput}
                                                        </div>
                                                    </div>
                                                </div>
                                                {failedTest.error && !failedTest.actualOutput && (
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Error Details</label>
                                                        <div className="bg-red-900/20 p-3 rounded-lg border border-red-900/40 font-mono text-sm text-red-300 whitespace-pre-wrap">
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
