import React, { useState, useMemo, useCallback } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import { generateNQueensSteps } from '../algorithms/backtracking/nQueens';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { FaPlay, FaRedo, FaTrashAlt, FaStepForward, FaStepBackward } from 'react-icons/fa';
import './NQueensVisualizer.css';

const NQueensVisualizer = () => {
    const [n, setN]                           = useState(8);
    const [fixedQueens, setFixedQueens]       = useState([]);
    const [mode, setMode]                     = useState('interactive');
    const [activeLanguage, setActiveLanguage] = useState('javascript');

    const steps = useMemo(() => {
        if (mode === 'solving') {
            return generateNQueensSteps(n, fixedQueens);
        }
        return [{
            type: 'info', indices: [], sortedIndices: [],
            description: `Click any tile on the chessboard to place/remove queens. Press Solve to start backtracking.`,
            arraySnapshot: new Array(n * n).fill(0)
        }];
    }, [n, fixedQueens, mode]);

    const anim = useGenericAnimation(steps);

    const solutionIndices = useMemo(() => {
        return steps.map((s, i) => s.isSolution ? i : -1).filter(i => i >= 0);
    }, [steps]);

    const currentSolutionNum = useMemo(() => {
        const idx = solutionIndices.indexOf(anim.currentStepIndex);
        return idx >= 0 ? idx + 1 : 0;
    }, [solutionIndices, anim.currentStepIndex]);

    const codeSnippet = algorithmCodes.nQueens?.[activeLanguage] || '';

    const getActiveLine = () => {
        if (!anim.currentStep) return 0;
        switch (anim.currentStep.type) {
            case 'place':     return 9;
            case 'backtrack': return 15;
            case 'solution':  return 4;
            default:          return 1;
        }
    };

    const handleCellClick = useCallback((row, col) => {
        if (mode !== 'interactive') return;
        setFixedQueens(prev => {
            const exists = prev.find(q => q.row === row && q.col === col);
            if (exists) return prev.filter(q => !(q.row === row && q.col === col));
            return [...prev, { row, col }];
        });
    }, [mode]);

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
        fixedQueens.forEach(({ row, col }) => cells.delete(`${row}-${col}`));
        return cells;
    }, [fixedQueens, n, mode]);

    const handleSolve = () => {
        if (hasConflict) {
            toast.error('Invalid placement! Fixed queens attack each other.');
            return;
        }
        setMode('solving');
    };

    const handleReset = () => {
        setMode('interactive');
        anim.reset();
    };

    const handleClearQueens = () => {
        setFixedQueens([]);
        setMode('interactive');
        anim.reset();
    };

    const goToNextSolution = () => {
        const nextSol = solutionIndices.find(idx => idx > anim.currentStepIndex);
        if (nextSol !== undefined) {
            anim.setIndex(nextSol);
        } else if (solutionIndices.length > 0) {
            anim.setIndex(solutionIndices[0]);
        }
    };

    const goToPrevSolution = () => {
        const prevSols = solutionIndices.filter(idx => idx < anim.currentStepIndex);
        if (prevSols.length > 0) {
            anim.setIndex(prevSols[prevSols.length - 1]);
        } else if (solutionIndices.length > 0) {
            anim.setIndex(solutionIndices[solutionIndices.length - 1]);
        }
    };

    const stepData = anim.currentStep || {};
    const snapshot = stepData.arraySnapshot || [];
    const queenCount = mode === 'solving' ? snapshot.filter(val => val > 0).length : fixedQueens.length;
    const colHeaders = Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i));

    return (
        <DualView
            algorithmName="N-Queens Problem (Backtracking)"
            code={codeSnippet}
            activeLine={getActiveLine()}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            codeSnippetCategory="backtracking"
            description={
                <div className="nq-desc-wrapper">
                    <span className="nq-badge">{n}×{n} Chessboard</span>
                    <span className="nq-desc-text">
                        {stepData.description || 'Click tiles to place queens, then press Solve.'}
                    </span>
                </div>
            }
        >
            <div className="nq-visualizer-wrapper">

                {/* Top Input Control Panel */}
                <div className="nq-input-panel">
                    <div className="nq-input-group">
                        <label className="nq-input-label">Board Size:</label>
                        <select
                            value={n}
                            onChange={(e) => {
                                const newN = parseInt(e.target.value, 10);
                                setN(newN);
                                setFixedQueens([]);
                                setMode('interactive');
                                anim.reset();
                            }}
                            className="nq-select-input"
                        >
                            <option value={4}>4 × 4</option>
                            <option value={5}>5 × 5</option>
                            <option value={6}>6 × 6</option>
                            <option value={7}>7 × 7</option>
                            <option value={8}>8 × 8</option>
                        </select>
                    </div>

                    <div className="nq-btn-group">
                        {mode === 'interactive' ? (
                            <>
                                <button className="nq-btn nq-btn-primary" onClick={handleSolve} disabled={hasConflict}>
                                    <FaPlay /> Solve
                                </button>
                                <button className="nq-btn nq-btn-outline" onClick={handleClearQueens}>
                                    <FaTrashAlt /> Clear
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="nq-btn nq-btn-secondary" onClick={goToPrevSolution}>
                                    <FaStepBackward /> Prev Sol
                                </button>
                                <button className="nq-btn nq-btn-secondary" onClick={goToNextSolution}>
                                    Next Sol <FaStepForward />
                                </button>
                                <button className="nq-btn nq-btn-outline" onClick={handleReset}>
                                    <FaRedo /> Editor
                                </button>
                            </>
                        )}
                    </div>

                    <div className="nq-legend">
                        <div className="nq-leg-item"><span className="nq-dot gold"></span> Queen</div>
                        <div className="nq-leg-item"><span className="nq-dot yellow"></span> Testing</div>
                        <div className="nq-leg-item"><span className="nq-dot red"></span> Conflict</div>
                        <div className="nq-leg-item"><span className="nq-dot green"></span> Solution</div>
                    </div>
                </div>

                {/* Main Stage: Stats & Chessboard Grid */}
                <div className="nq-canvas-wrapper">
                    
                    {/* Metrics Header */}
                    <div className="nq-stats-row">
                        <div className="nq-stat-card">
                            <span className="stat-lbl">Placed Queens</span>
                            <span className="stat-val gold">{queenCount} / {n}</span>
                        </div>
                        <div className="nq-stat-card">
                            <span className="stat-lbl">Total Solutions</span>
                            <span className="stat-val green">{solutionIndices.length}</span>
                        </div>
                        {currentSolutionNum > 0 && (
                            <div className="nq-stat-card">
                                <span className="stat-lbl">Viewing Solution</span>
                                <span className="stat-val purple">#{currentSolutionNum}</span>
                            </div>
                        )}
                    </div>

                    {/* Chessboard Container with Left Row Labels & Top Col Labels */}
                    <div className="nq-board-container">
                        <div className="nq-board-layout">

                            {/* Left Row Labels (1, 2, 3...) */}
                            <div className="nq-row-labels" style={{ gridTemplateRows: `repeat(${n}, minmax(38px, 54px))` }}>
                                {Array.from({ length: n }).map((_, r) => (
                                    <span key={`r-${r}`} className="nq-coord-label">{r + 1}</span>
                                ))}
                            </div>

                            {/* Right Section: Top Col Labels (A, B, C...) + N x N Grid */}
                            <div className="nq-board-right">
                                <div className="nq-col-labels" style={{ gridTemplateColumns: `repeat(${n}, minmax(38px, 54px))` }}>
                                    {colHeaders.map(ch => (
                                        <span key={ch} className="nq-coord-label">{ch}</span>
                                    ))}
                                </div>

                                <div
                                    className="nq-chessboard"
                                    style={{
                                        gridTemplateColumns: `repeat(${n}, minmax(38px, 54px))`,
                                        gridTemplateRows: `repeat(${n}, minmax(38px, 54px))`
                                    }}
                                >
                                    {Array.from({ length: n * n }).map((_, idx) => {
                                        const r = Math.floor(idx / n);
                                        const c = idx % n;
                                        const isDark = (r + c) % 2 === 1;

                                        let hasQueen = false;
                                        let isCurrentCell = false;
                                        let isConflict = false;
                                        let isAttacked = attackedCells.has(`${r}-${c}`);
                                        let isSolutionCell = false;

                                        if (mode === 'interactive') {
                                            hasQueen = fixedQueens.some(q => q.row === r && q.col === c);
                                            if (hasQueen && hasConflict) {
                                                isConflict = fixedQueens.some(q =>
                                                    (q.row !== r || q.col !== c) &&
                                                    (q.row === r || q.col === c || Math.abs(q.row - r) === Math.abs(q.col - c))
                                                );
                                            }
                                        } else {
                                            hasQueen = snapshot[idx] > 0;
                                            isCurrentCell = stepData.indices && stepData.indices.includes(idx);
                                            isConflict = (stepData.type === 'conflict' || stepData.type === 'backtrack') && isCurrentCell;
                                            isSolutionCell = stepData.isSolution && hasQueen;
                                        }

                                        let tileClass = isDark ? 'tile-dark' : 'tile-light';
                                        if (isConflict) tileClass += ' tile-conflict';
                                        else if (isCurrentCell) tileClass += ' tile-current';
                                        else if (isSolutionCell) tileClass += ' tile-solution';
                                        else if (isAttacked) tileClass += ' tile-attacked';

                                        return (
                                            <div
                                                key={idx}
                                                className={`nq-tile ${tileClass} ${mode === 'interactive' ? 'interactive' : ''}`}
                                                onClick={() => handleCellClick(r, c)}
                                                title={`Row ${r + 1}, Col ${colHeaders[c]}`}
                                            >
                                                {hasQueen && <span className="nq-queen-icon">👑</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                        </div>
                    </div>

                </div>

                {/* YouTube Video Player Controls */}
                {mode === 'solving' && (
                    <div className="nq-controls-wrapper">
                        <AnimationControls
                            isPlaying={anim.isPlaying}
                            onPlay={anim.play}
                            onPause={anim.pause}
                            onNext={anim.stepForward}
                            onPrev={anim.stepBackward}
                            onReset={anim.reset}
                            speed={anim.speed}
                            onSpeedChange={anim.setSpeed}
                            currentStep={anim.currentStepIndex}
                            totalSteps={steps.length}
                            onScrub={anim.setIndex}
                            inputType="none"
                        />
                    </div>
                )}

            </div>
        </DualView>
    );
};

export default NQueensVisualizer;
