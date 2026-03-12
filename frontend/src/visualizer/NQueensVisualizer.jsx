import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import { generateNQueensSteps } from '../algorithms/backtracking/nQueens';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { algorithmCodes } from '../data/algorithmCodes';
import { algorithmLineMaps } from '../data/algorithmLineMaps';
import { toast } from 'react-hot-toast';
import './NQueensVisualizer.css';

const NQueensVisualizer = () => {
    const [n, setN] = useState(8);
    const [fixedQueens, setFixedQueens] = useState([]);
    const [mode, setMode] = useState('interactive'); // 'interactive' | 'solving'
    const [sizeModalOpen, setSizeModalOpen] = useState(false);
    const [tempN, setTempN] = useState(8);

    // Generate steps for the current config
    const steps = useMemo(() => {
        if (mode === 'solving') {
            return generateNQueensSteps(n, fixedQueens);
        }
        // In interactive mode, show a single placeholder step
        return [{
            type: 'info', indices: [], sortedIndices: [],
            description: `Click cells to place queens, then press Solve.`,
            arraySnapshot: new Array(n * n).fill(0)
        }];
    }, [n, fixedQueens, mode]);

    const anim = useGenericAnimation(steps);

    // Find all solution step indices for navigation
    const solutionIndices = useMemo(() => {
        return steps.map((s, i) => s.isSolution ? i : -1).filter(i => i >= 0);
    }, [steps]);

    const currentSolutionNum = useMemo(() => {
        const idx = solutionIndices.indexOf(anim.currentStepIndex);
        return idx >= 0 ? idx + 1 : 0;
    }, [solutionIndices, anim.currentStepIndex]);

    const activeLanguage = 'javascript';
    const codeSnippet = algorithmCodes.nQueens?.[activeLanguage] || '// Code not available';
    const map = algorithmLineMaps.nQueens?.[activeLanguage];

    const getActiveLine = () => {
        if (!anim.currentStep || !map) return 0;
        return map[anim.currentStep.type] || map.info || 1;
    };

    // Toggle queen on click (interactive mode only)
    const handleCellClick = useCallback((row, col) => {
        if (mode !== 'interactive') return;
        setFixedQueens(prev => {
            const exists = prev.find(q => q.row === row && q.col === col);
            if (exists) return prev.filter(q => !(q.row === row && q.col === col));
            return [...prev, { row, col }];
        });
    }, [mode]);

    // Validate fixed queens don't attack each other
    const hasConflict = useMemo(() => {
        for (let i = 0; i < fixedQueens.length; i++) {
            for (let j = i + 1; j < fixedQueens.length; j++) {
                const a = fixedQueens[i], b = fixedQueens[j];
                if (a.row === b.row || a.col === b.col || Math.abs(a.row - b.row) === Math.abs(a.col - b.col)) {
                    return true;
                }
            }
        }
        return false;
    }, [fixedQueens]);

    // Get attacked cells from current fixed queens (for highlighting)
    const attackedCells = useMemo(() => {
        if (mode !== 'interactive') return new Set();
        const cells = new Set();
        fixedQueens.forEach(({ row, col }) => {
            for (let i = 0; i < n; i++) {
                cells.add(`${row}-${i}`);
                cells.add(`${i}-${col}`);
                if (row + i < n && col + i < n) cells.add(`${row + i}-${col + i}`);
                if (row - i >= 0 && col - i >= 0) cells.add(`${row - i}-${col - i}`);
                if (row + i < n && col - i >= 0) cells.add(`${row + i}-${col - i}`);
                if (row - i >= 0 && col + i < n) cells.add(`${row - i}-${col + i}`);
            }
        });
        // Remove queen positions themselves from "attacked" highlighting
        fixedQueens.forEach(({ row, col }) => cells.delete(`${row}-${col}`));
        return cells;
    }, [fixedQueens, n, mode]);

    const handleSolve = () => {
        if (hasConflict) {
            toast.error('Invalid configuration! Some queens are attacking each other.');
            return;
        }
        setMode('solving');
    };

    const handleReset = () => {
        setMode('interactive');
        setFixedQueens([]);
        anim.reset();
    };

    const handleClearQueens = () => {
        if (mode === 'solving') setMode('interactive');
        setFixedQueens([]);
    };

    const goToNextSolution = () => {
        const next = solutionIndices.find(i => i > anim.currentStepIndex);
        if (next !== undefined) anim.setStep(next);
        else toast('No more solutions ahead.', { icon: '📭' });
    };

    const goToPrevSolution = () => {
        const prev = [...solutionIndices].reverse().find(i => i < anim.currentStepIndex);
        if (prev !== undefined) anim.setStep(prev);
        else toast('No earlier solutions.', { icon: '📭' });
    };

    // Render the board
    const renderBoard = () => {
        const boardSize = n;
        const snapshot = mode === 'solving' ? (anim.currentStep?.arraySnapshot || []) : null;
        const activeIndices = anim.currentStep?.indices || [];

        return (
            <div className="nq-viz">
                <div
                    className="nq-board"
                    style={{
                        gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
                        width: `min(${Math.min(boardSize * 52, 420)}px, 90vw)`,
                        height: `min(${Math.min(boardSize * 52, 420)}px, 90vw)`
                    }}
                >
                    {Array.from({ length: boardSize * boardSize }).map((_, idx) => {
                        const r = Math.floor(idx / boardSize);
                        const c = idx % boardSize;
                        const isLight = (r + c) % 2 === 0;

                        // Determine queen state
                        const isFixed = fixedQueens.some(q => q.row === r && q.col === c);
                        let hasDynamicQueen = false;
                        let hasQueenFromSnapshot = false;

                        if (mode === 'solving' && snapshot) {
                            const val = snapshot[idx];
                            if (val === 95) hasQueenFromSnapshot = true; // fixed
                            if (val === 90) { hasDynamicQueen = true; hasQueenFromSnapshot = true; }
                        }

                        const showQueen = mode === 'interactive' ? isFixed : hasQueenFromSnapshot;
                        const isActive = mode === 'solving' && activeIndices.includes(idx);
                        const isBacktracking = mode === 'solving' && anim.currentStep?.type === 'swap' && isActive;
                        const isConflictCell = mode === 'solving' && anim.currentStep?.type === 'swap' && isActive;
                        const isPlacing = mode === 'solving' && anim.currentStep?.type === 'compare' && isActive;
                        const isAttacked = mode === 'interactive' && attackedCells.has(`${r}-${c}`) && !isFixed;

                        return (
                            <div
                                key={idx}
                                className={`nq-cell ${isLight ? 'nq-light' : 'nq-dark'}
                                    ${isActive ? 'nq-active' : ''}
                                    ${isBacktracking ? 'nq-backtrack' : ''}
                                    ${isPlacing ? 'nq-placing' : ''}
                                    ${isAttacked ? 'nq-attacked' : ''}
                                    ${mode === 'interactive' ? 'nq-clickable' : ''}`}
                                onClick={() => handleCellClick(r, c)}
                            >
                                <AnimatePresence>
                                    {showQueen && (
                                        <motion.div
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            className={`nq-queen ${isFixed && mode === 'solving' ? 'nq-queen-fixed' : ''} ${hasDynamicQueen ? 'nq-queen-dynamic' : ''} ${isFixed && mode === 'interactive' ? 'nq-queen-user' : ''}`}
                                        >
                                            ♛
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <DualView
            algorithmName={`N-Queens Solver (N=${n})`}
            description={anim.currentStep?.description || 'Click cells to place queens, then press Solve.'}
            code={codeSnippet}
            activeLine={getActiveLine()}
            activeLanguage={activeLanguage}
            onLanguageChange={() => { }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '10px' }}>
                {/* Status Bar */}
                <div className="nq-status-bar">
                    <span className="nq-mode-badge">
                        {mode === 'interactive' ? '🖱️ Interactive Mode' : '⚙️ Solving...'}
                    </span>
                    {fixedQueens.length > 0 && (
                        <span className="nq-fixed-count">🔒 {fixedQueens.length} fixed queen{fixedQueens.length > 1 ? 's' : ''}</span>
                    )}
                    {hasConflict && (
                        <span className="nq-conflict-badge">⚠️ Queens attacking each other!</span>
                    )}
                    {mode === 'solving' && solutionIndices.length > 0 && (
                        <span className="nq-solution-badge">
                            {currentSolutionNum > 0
                                ? `Solution ${currentSolutionNum} of ${solutionIndices.length}`
                                : `${solutionIndices.length} solution${solutionIndices.length > 1 ? 's' : ''} found`}
                        </span>
                    )}
                    {mode === 'solving' && solutionIndices.length === 0 && anim.currentStepIndex === steps.length - 1 && (
                        <span className="nq-no-solution-badge">❌ No solutions found</span>
                    )}
                </div>

                {/* Board */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {renderBoard()}
                </div>

                {/* Legend */}
                <div className="nq-legend">
                    <div className="nq-legend-item"><span className="nq-leg-dot nq-leg-gold"></span> Fixed Queen</div>
                    <div className="nq-legend-item"><span className="nq-leg-dot nq-leg-green"></span> Placed (safe)</div>
                    <div className="nq-legend-item"><span className="nq-leg-dot nq-leg-red"></span> Conflict / Backtrack</div>
                    <div className="nq-legend-item"><span className="nq-leg-dot nq-leg-attack"></span> Attacked Cell</div>
                </div>

                {/* Controls */}
                <div className="nq-controls-bar">
                    {mode === 'solving' && (
                        <AnimationControls
                            isPlaying={anim.isPlaying}
                            onPlay={anim.play}
                            onPause={anim.pause}
                            onStepForward={anim.stepForward}
                            onStepBackward={anim.stepBackward}
                            onReset={anim.reset}
                            speed={anim.speed}
                            onSpeedChange={anim.setSpeed}
                            currentStep={anim.currentStepIndex}
                            totalSteps={anim.totalSteps}
                            onScrub={anim.setStep}
                            inputType="none"
                        />
                    )}

                    <div className="nq-action-row">
                        {mode === 'interactive' && (
                            <>
                                <button className="nq-btn nq-btn-primary" onClick={handleSolve} disabled={hasConflict}>
                                    ▶️ Solve
                                </button>
                                <button className="nq-btn" onClick={handleClearQueens}>
                                    🧹 Clear Queens
                                </button>
                                <button className="nq-btn" onClick={() => { setTempN(n); setSizeModalOpen(true); }}>
                                    📐 Board Size: {n}
                                </button>
                            </>
                        )}
                        {mode === 'solving' && (
                            <>
                                <button className="nq-btn" onClick={goToPrevSolution}>⏮ Prev Solution</button>
                                <button className="nq-btn" onClick={goToNextSolution}>Next Solution ⏭</button>
                                <button className="nq-btn nq-btn-danger" onClick={handleReset}>🔄 Reset Board</button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Size Modal */}
            {sizeModalOpen && (
                <div className="nq-modal-overlay" onClick={() => setSizeModalOpen(false)}>
                    <div className="nq-modal" onClick={e => e.stopPropagation()}>
                        <h3>Select Board Size</h3>
                        <div className="nq-size-buttons">
                            {[4, 5, 6, 7, 8].map(sz => (
                                <button
                                    key={sz}
                                    className={`nq-size-btn ${tempN === sz ? 'nq-size-active' : ''}`}
                                    onClick={() => setTempN(sz)}
                                >
                                    {sz}×{sz}
                                </button>
                            ))}
                        </div>

                        {/* Preview grid */}
                        <div className="nq-preview-grid" style={{ gridTemplateColumns: `repeat(${tempN}, 32px)` }}>
                            {Array.from({ length: tempN * tempN }).map((_, idx) => {
                                const r = Math.floor(idx / tempN);
                                const c = idx % tempN;
                                return (
                                    <div key={idx} className={`nq-preview-cell ${(r + c) % 2 === 0 ? 'nq-prev-light' : 'nq-prev-dark'}`}>
                                        <span className="nq-prev-coord">{r},{c}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="nq-modal-actions">
                            <button className="nq-btn" onClick={() => setSizeModalOpen(false)}>Cancel</button>
                            <button className="nq-btn nq-btn-primary" onClick={() => {
                                setN(tempN);
                                setFixedQueens([]);
                                setMode('interactive');
                                setSizeModalOpen(false);
                            }}>
                                Apply {tempN}×{tempN}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DualView>
    );
};

export default NQueensVisualizer;
