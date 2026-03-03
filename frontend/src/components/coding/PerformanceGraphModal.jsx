import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { FaTimes, FaChartLine, FaSyncAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const formatMetric = (value, suffix, decimals = 2) => {
    const num = toNumber(value);
    return `${num.toFixed(decimals)} ${suffix}`;
};

const formatDateTime = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const NeighborTable = ({ title, rows }) => (
    <div style={{ background: 'rgba(17,24,39,0.65)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#e5e7eb', fontSize: '0.9rem' }}>{title}</h4>
        {rows.length === 0 ? (
            <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.8rem' }}>No nearby submissions.</p>
        ) : (
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: '500px', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ color: '#94a3b8', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            <th style={{ padding: '6px 8px', fontSize: '0.74rem' }}>User</th>
                            <th style={{ padding: '6px 8px', fontSize: '0.74rem' }}>Runtime</th>
                            <th style={{ padding: '6px 8px', fontSize: '0.74rem' }}>Memory</th>
                            <th style={{ padding: '6px 8px', fontSize: '0.74rem' }}>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.submissionId} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <td style={{ padding: '7px 8px', color: '#f3f4f6', fontSize: '0.8rem' }}>{row.user?.username || 'Unknown'}</td>
                                <td style={{ padding: '7px 8px', color: '#d1d5db', fontSize: '0.8rem' }}>{formatMetric(row.runtime, 'ms', 2)}</td>
                                <td style={{ padding: '7px 8px', color: '#d1d5db', fontSize: '0.8rem' }}>{formatMetric(row.memory, 'MB', 3)}</td>
                                <td style={{ padding: '7px 8px', color: '#9ca3af', fontSize: '0.8rem' }}>{formatDateTime(row.createdAt)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
);

const PerformanceGraphModal = ({ isOpen, onClose, data, loading, error, onRetry }) => {
    if (!isOpen) return null;

    const runtimePercentile = Math.max(0, Math.min(100, toNumber(data?.beats?.runtimePercentile)));
    const memoryPercentile = Math.max(0, Math.min(100, toNumber(data?.beats?.memoryPercentile)));
    const totalTestCases = Math.max(0, Math.trunc(toNumber(data?.submission?.totalTestCases)));
    const testCasesPassedRaw = Math.max(0, Math.trunc(toNumber(data?.submission?.testCasesPassed)));
    const testCasesPassed = totalTestCases > 0
        ? Math.min(testCasesPassedRaw, totalTestCases)
        : testCasesPassedRaw;
    const testCasePassRate = totalTestCases > 0
        ? (testCasesPassed / totalTestCases) * 100
        : 0;
    const runtimeRowsAbove = Array.isArray(data?.neighbors?.runtime?.above) ? data.neighbors.runtime.above : [];
    const runtimeRowsBelow = Array.isArray(data?.neighbors?.runtime?.below) ? data.neighbors.runtime.below : [];
    const memoryRowsAbove = Array.isArray(data?.neighbors?.memory?.above) ? data.neighbors.memory.above : [];
    const memoryRowsBelow = Array.isArray(data?.neighbors?.memory?.below) ? data.neighbors.memory.below : [];

    const runtimeChartData = [
        { name: 'Better', value: toNumber(data?.beats?.runtimeAboveCount), fill: '#ef4444' },
        { name: 'You', value: 1, fill: '#22c55e' },
        { name: 'Worse', value: toNumber(data?.beats?.runtimeBelowCount), fill: '#3b82f6' }
    ];

    const memoryChartData = [
        { name: 'Lower Mem', value: toNumber(data?.beats?.memoryAboveCount), fill: '#ef4444' },
        { name: 'You', value: 1, fill: '#22c55e' },
        { name: 'Higher Mem', value: toNumber(data?.beats?.memoryBelowCount), fill: '#3b82f6' }
    ];

    return (
        <AnimatePresence>
            <div
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                style={{ background: 'rgba(0,0,0,0.75)' }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 10 }}
                    transition={{ duration: 0.2 }}
                    onClick={(event) => event.stopPropagation()}
                    style={{
                        width: 'min(1100px, 100%)',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        background: '#0f172a',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '14px',
                        color: '#e5e7eb'
                    }}
                >
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaChartLine style={{ color: '#60a5fa' }} />
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Submission Performance Graph</h3>
                                <p style={{ margin: '2px 0 0', color: '#94a3b8', fontSize: '0.78rem' }}>
                                    {data?.problem?.title || 'Accepted Submission'}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{ border: 'none', background: 'transparent', color: '#9ca3af', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1 }}
                        >
                            <FaTimes />
                        </button>
                    </div>

                    {loading ? (
                        <div style={{ padding: '30px', textAlign: 'center', color: '#9ca3af' }}>Loading performance graph...</div>
                    ) : error ? (
                        <div style={{ padding: '24px', textAlign: 'center' }}>
                            <p style={{ margin: '0 0 12px', color: '#fca5a5' }}>{error}</p>
                            <button
                                type="button"
                                onClick={onRetry}
                                style={{
                                    border: '1px solid rgba(59,130,246,0.4)',
                                    borderRadius: '8px',
                                    background: 'rgba(59,130,246,0.15)',
                                    color: '#93c5fd',
                                    padding: '8px 12px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <FaSyncAlt /> Retry
                            </button>
                        </div>
                    ) : (
                        <div style={{ padding: '16px', display: 'grid', gap: '14px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                                <div style={{ background: 'rgba(30,41,59,0.7)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <div style={{ color: '#93c5fd', fontSize: '0.78rem' }}>Runtime</div>
                                    <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '1.3rem' }}>{formatMetric(data?.submission?.runtime, 'ms')}</div>
                                    <div style={{ marginTop: '4px', fontSize: '0.82rem', color: '#86efac' }}>Beats {runtimePercentile.toFixed(2)}% (same cohort)</div>
                                </div>
                                <div style={{ background: 'rgba(30,41,59,0.7)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <div style={{ color: '#93c5fd', fontSize: '0.78rem' }}>Memory</div>
                                    <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '1.3rem' }}>{formatMetric(data?.submission?.memory, 'MB', 3)}</div>
                                    <div style={{ marginTop: '4px', fontSize: '0.82rem', color: '#86efac' }}>Beats {memoryPercentile.toFixed(2)}% (same cohort)</div>
                                </div>
                                <div style={{ background: 'rgba(30,41,59,0.7)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <div style={{ color: '#93c5fd', fontSize: '0.78rem' }}>Test Cases Passed</div>
                                    <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '1.3rem' }}>
                                        {totalTestCases > 0 ? `${testCasesPassed}/${totalTestCases}` : '-'}
                                    </div>
                                    <div style={{ marginTop: '4px', fontSize: '0.82rem', color: '#cbd5e1' }}>
                                        {totalTestCases > 0 ? `${testCasePassRate.toFixed(0)}% passed` : 'No test case data'}
                                    </div>
                                </div>
                                <div style={{ background: 'rgba(30,41,59,0.7)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <div style={{ color: '#93c5fd', fontSize: '0.78rem' }}>Compared Against</div>
                                    <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '1.05rem' }}>
                                        {data?.cohort?.languageScoped ? `Language: ${data?.cohort?.language || '-'}` : 'All Languages'}
                                    </div>
                                    <div style={{ marginTop: '4px', fontSize: '0.82rem', color: '#cbd5e1' }}>
                                        Runtime peers: {toNumber(data?.cohort?.runtimeComparisons)} | Memory peers: {toNumber(data?.cohort?.memoryComparisons)}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
                                <div style={{ background: 'rgba(15,23,42,0.75)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', padding: '10px', minHeight: '220px' }}>
                                    <p style={{ margin: '0 0 8px', color: '#dbeafe', fontSize: '0.85rem', fontWeight: 600 }}>Runtime Rank Graph</p>
                                    <ResponsiveContainer width="100%" height={180}>
                                        <BarChart data={runtimeChartData} margin={{ top: 10, right: 10, left: -14, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                                            <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={11} />
                                            <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={11} />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(148,163,184,0.08)' }}
                                                contentStyle={{ background: '#111827', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8, color: '#e5e7eb' }}
                                            />
                                            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                                {runtimeChartData.map((entry) => (
                                                    <Cell key={entry.name} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div style={{ background: 'rgba(15,23,42,0.75)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', padding: '10px', minHeight: '220px' }}>
                                    <p style={{ margin: '0 0 8px', color: '#dbeafe', fontSize: '0.85rem', fontWeight: 600 }}>Memory Rank Graph</p>
                                    <ResponsiveContainer width="100%" height={180}>
                                        <BarChart data={memoryChartData} margin={{ top: 10, right: 10, left: -14, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                                            <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={11} />
                                            <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={11} />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(148,163,184,0.08)' }}
                                                contentStyle={{ background: '#111827', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8, color: '#e5e7eb' }}
                                            />
                                            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                                {memoryChartData.map((entry) => (
                                                    <Cell key={entry.name} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
                                <NeighborTable title="Runtime: Above You (faster)" rows={runtimeRowsAbove} />
                                <NeighborTable title="Runtime: Below You (slower)" rows={runtimeRowsBelow} />
                                <NeighborTable title="Memory: Above You (lower)" rows={memoryRowsAbove} />
                                <NeighborTable title="Memory: Below You (higher)" rows={memoryRowsBelow} />
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default PerformanceGraphModal;
