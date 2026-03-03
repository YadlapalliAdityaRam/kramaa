import React from 'react';
import { motion } from 'framer-motion';
import './DPTableCanvas.css';

const cellColors = {
    empty: 'rgba(255,255,255,0.03)',
    computing: '#f59e0b',
    filled: '#3b82f6',
    'optimal-path': '#10b981',
    comparing: '#8b5cf6'
};

const DPTableCanvas = ({ table, cellStates = {}, rowLabels = [], colLabels = [], highlightCells = [] }) => {
    if (!table || table.length === 0) {
        return <div className="dp-canvas-empty">No DP table data</div>;
    }

    const highlightSet = new Set(highlightCells.map(c => `${c[0]}-${c[1]}`));

    return (
        <div className="dp-canvas">
            <div className="dp-table-wrapper">
                <table className="dp-table">
                    {colLabels.length > 0 && (
                        <thead>
                            <tr>
                                {rowLabels.length > 0 && <th className="dp-corner"></th>}
                                {colLabels.map((label, j) => (
                                    <th key={`col-${j}`} className="dp-col-label">{label}</th>
                                ))}
                            </tr>
                        </thead>
                    )}
                    <tbody>
                        {table.map((row, i) => (
                            <tr key={`row-${i}`}>
                                {rowLabels.length > 0 && (
                                    <td className="dp-row-label">{rowLabels[i]}</td>
                                )}
                                {row.map((val, j) => {
                                    const key = `${i}-${j}`;
                                    const state = cellStates[key] || 'empty';
                                    const isHighlight = highlightSet.has(key);
                                    const bgColor = isHighlight ? cellColors['optimal-path'] : cellColors[state] || cellColors.empty;

                                    return (
                                        <td key={key} className="dp-cell-container">
                                            <motion.div
                                                className={`dp-cell ${state !== 'empty' ? 'dp-cell-active' : ''}`}
                                                style={{
                                                    backgroundColor: state === 'empty' ? cellColors.empty : bgColor,
                                                    color: state === 'empty' ? 'var(--text-muted)' : 'white'
                                                }}
                                                animate={{
                                                    backgroundColor: state === 'empty' ? cellColors.empty : bgColor,
                                                    scale: state === 'computing' ? [1, 1.1, 1] : 1
                                                }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                {val !== null && val !== undefined ? val : '—'}
                                            </motion.div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DPTableCanvas;
