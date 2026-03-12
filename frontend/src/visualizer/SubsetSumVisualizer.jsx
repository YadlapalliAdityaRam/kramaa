import React, { useState, useEffect, useMemo } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateSubsetSumSteps } from '../algorithms/dp/subsetSum';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import './SubsetSumVisualizer.css';

const SubsetSumVisualizer = () => {
    const [arrStr, setArrStr] = useState("3, 34, 4, 12, 5, 2");
    const [targetStr, setTargetStr] = useState("9");
    const [arr, setArr] = useState([3, 34, 4, 12, 5, 2]);
    const [targetSum, setTargetSum] = useState(9);
    const [activeLanguage, setActiveLanguage] = useState("javascript");

    const steps = useMemo(() => generateSubsetSumSteps(arr, targetSum), [arr, targetSum]);

    const {
        currentStep,
        currentStepIndex,
        isPlaying,
        play,
        pause,
        reset,
        stepForward,
        stepBackward,
        speed,
        setSpeed,
        setIndex
    } = useGenericAnimation(steps);

    const handleApply = () => {
        try {
            const parsedArr = arrStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
            const parsedTarget = parseInt(targetStr);

            if (parsedArr.length === 0) throw new Error("Need at least one valid positive integer.");
            if (isNaN(parsedTarget) || parsedTarget < 0) throw new Error("Target sum must be a non-negative integer.");
            if (parsedTarget > 50) {
                toast.error("Target sum is too large for visualization (max 50).");
                return;
            }
            if (parsedArr.length > 10) {
                toast.error("Too many items for visualization (max 10).");
                return;
            }

            setArr(parsedArr);
            setTargetSum(parsedTarget);
            reset();
            toast.success("Updated parameters!");
        } catch (error) {
            toast.error(error.message || "Invalid input format.");
        }
    };

    const getActiveLine = (snapshot) => {
        if (!snapshot) return 0;
        switch (snapshot.type) {
            case 'init': return 3;
            case 'checking': return 8;
            case 'updated': return 11;
            case 'traceback_start':
            case 'traceback_step': return 15;
            case 'complete': return 15;
            default: return 0;
        }
    };

    const isCellActive = (i, j) => currentStep?.activeRow === i && currentStep?.activeCol === j;
    
    const isTraceCell = (i, j) => {
        if (!currentStep?.subsetPath) return false;
        return currentStep.subsetPath.some(cell => cell.r === i && cell.c === j);
    };

    const isTraceHead = (i, j) => {
        if (!currentStep || currentStep.type !== 'traceback_step') return false;
        return currentStep.activeRow === i && currentStep.activeCol === j;
    };

    const getCellClass = (i, j, val) => {
        let classes = val === 'T' ? 'true-val' : 'false-val';

        if (isTraceHead(i, j)) return classes + ' trace-head';
        if (isTraceCell(i, j)) return classes + ' trace-path';

        if (isCellActive(i, j)) {
            return classes + ' cell-active';
        }

        return classes;
    };

    const isItemChosen = (idx) => {
        if (!currentStep?.chosenItems) return false;
        return currentStep.chosenItems.some(item => item.index === idx);
    };

    const isItemChecking = (idx) => {
        if (currentStep?.type === 'checking' || currentStep?.type === 'updated') {
            return currentStep.activeRow - 1 === idx;
        }
        if (currentStep?.type === 'traceback_step') {
            return currentStep.activeRow - 1 === idx;
        }
        return false;
    };

    const codeSnippet = algorithmCodes.subsetSum?.[activeLanguage] || "";

    return (
        <DualView
            algorithmName="Subset Sum (DP)"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={currentStep?.description || "Select parameters and press Play."}
        >
            <div className="subset-container">
                <div className="subset-input-bar">
                    <div className="subset-inputs">
                        <div className="subset-input-group">
                            <span className="subset-label">Set of Numbers:</span>
                            <input
                                type="text"
                                className="subset-array-input"
                                value={arrStr}
                                onChange={(e) => setArrStr(e.target.value)}
                                placeholder="3, 34, 4, 12, 5, 2"
                            />
                        </div>
                        <div className="subset-input-group">
                            <span className="subset-label">Target Sum:</span>
                            <input
                                type="number"
                                className="subset-target-input"
                                value={targetStr}
                                onChange={(e) => setTargetStr(e.target.value)}
                                placeholder="9"
                                min="0"
                                max="50"
                            />
                        </div>
                    </div>
                    <button className="cs-btn cs-btn-primary" onClick={handleApply}>Generate Matrix</button>
                </div>

                <div className="subset-main-area">
                    <div className="subset-table-container">
                        <div className="subset-table-scroll">
                            <table className="subset-table">
                                <thead>
                                    <tr>
                                        <th className="row-header">Item \ Sum</th>
                                        {Array.from({ length: targetSum + 1 }).map((_, j) => (
                                            <th key={`col-${j}`}>{j}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentStep?.table && currentStep.table.map((row, i) => (
                                        <tr key={`row-${i}`}>
                                            <th className="row-header">
                                                {i === 0 ? "0 (Base)" : `[${i - 1}] Val: ${arr[i - 1]}`}
                                            </th>
                                            {row.map((val, j) => (
                                                <td key={`cell-${i}-${j}`}>
                                                    <div className={`subset-cell ${getCellClass(i, j, val)}`}>
                                                        {val}
                                                    </div>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="subset-array-display">
                            {arr.map((val, idx) => (
                                <div
                                    key={`arr-item-${idx}`}
                                    className={`subset-array-item ${isItemChosen(idx) ? 'chosen' : ''} ${isItemChecking(idx) ? 'currently-checking' : ''}`}
                                >
                                    <span className="subset-array-item-index">[{idx}]</span>
                                    {val}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="subset-side-panel">
                        <div className="subset-info-card">
                            <div className="subset-info-title">Logic Breakdown</div>
                            {currentStep?.type === 'checking' || currentStep?.type === 'updated' ? (
                                <div className="subset-formula-box">
                                    <div className="subset-formula-row">
                                        <span>Current Item:</span>
                                        <span className="subset-f-green" style={{ fontFamily: 'monospace' }}>{arr[currentStep.activeRow - 1]}</span>
                                    </div>
                                    <div className="subset-formula-row">
                                        <span>Target Sum:</span>
                                        <span className="subset-f-green" style={{ fontFamily: 'monospace' }}>{currentStep.activeCol}</span>
                                    </div>
                                    <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '15px 0' }} />
                                    <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{currentStep.description}</p>
                                </div>
                            ) : currentStep?.type?.includes('traceback') ? (
                                <div className="subset-formula-box" style={{ borderLeftColor: '#10b981' }}>
                                    <h4 style={{ margin: '0 0 10px 0', color: '#a7f3d0' }}>Traceback Phase</h4>
                                    <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                                        Walking backwards to find which items form the sum {targetSum}.
                                    </p>
                                    <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{currentStep.description}</p>
                                </div>
                            ) : (
                                <div style={{ color: '#64748b', fontStyle: 'italic', padding: '20px 0', textAlign: 'center' }}>
                                    {currentStep?.type === 'complete' ? "Algorithm Finished." : "Press Play to begin computation."}
                                </div>
                            )}

                            <div className="subset-legend">
                                <div className="subset-info-title" style={{ marginTop: '10px', marginBottom: '10px' }}>Legend</div>
                                <div className="subset-legend-item"><div className="subset-legend-color subset-l-yellow"></div> Current Cell</div>
                                <div className="subset-legend-item"><div className="subset-legend-color subset-l-green"></div> Found Path</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="subset-controls-wrapper">
                    <AnimationControls inputType="none"
                        onNext={stepForward}
                        onPrev={stepBackward}
                        onPlay={play}
                        onPause={pause}
                        onReset={reset}
                        isPlaying={isPlaying}
                        speed={speed}
                        onSpeedChange={setSpeed}
                        currentStep={currentStepIndex}
                        totalSteps={steps.length}
                        onScrub={setIndex}
                    />
                </div>
            </div>
        </DualView>
    );
};

export default SubsetSumVisualizer;
