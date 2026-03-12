import React, { useState, useMemo, useEffect } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateMatrixChainSteps } from '../algorithms/dp/matrixChain';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { FaPlay, FaRandom, FaProjectDiagram } from 'react-icons/fa';
import './MatrixChainVisualizer.css';

const MatrixChainVisualizer = () => {
    const [inputVal, setInputVal] = useState('10, 30, 5, 60');
    const [dimensionData, setDimensionData] = useState([10, 30, 5, 60]);
    const [activeLanguage, setActiveLanguage] = useState('javascript');

    const steps = useMemo(() => generateMatrixChainSteps(dimensionData), [dimensionData]);

    const {
        currentStep,
        currentStepIndex,
        isPlaying,
        play,
        pause,
        reset,
        stepForward,
        stepBackward,
        setIndex,
        speed,
        setSpeed
    } = useGenericAnimation(steps);

    useEffect(() => {
        reset();
    }, [dimensionData]);

    const handleApply = () => {
        const parsed = inputVal.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
        if (parsed.length < 3) {
            toast.error("Please enter at least 3 dimensions (for 2 matrices).");
            return;
        }
        if (parsed.length > 8) {
            toast.error("Maximum 8 dimensions (7 matrices) allowed for clear visualization.");
            return;
        }
        setDimensionData(parsed);
        toast.success("Dimensions applied");
    };

    const handleRandomize = () => {
        const lengths = [4, 5, 6];
        const numDims = lengths[Math.floor(Math.random() * lengths.length)];
        const randomDims = Array.from({ length: numDims }, () => Math.floor(Math.random() * 40) + 5);
        setDimensionData(randomDims);
        setInputVal(randomDims.join(', '));
        toast.success("Randomized dimensions");
    };

    const codeSnippet = algorithmCodes.matrixChain?.[activeLanguage] || '';

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'base-cases': return 5;
            case 'evaluate-chain': return 8;
            case 'try-split': return 15;
            case 'new-min': return 18;
            case 'cell-complete': return 23;
            case 'completed': return 26;
            default: return 0;
        }
    };

    // Render logic for the DP Table
    const renderDPTable = () => {
        if (!currentStep) return null;
        const n = dimensionData.length - 1;
        
        return (
            <div className="mcm-table-wrapper">
                <table className="mcm-dp-table">
                    <thead>
                        <tr>
                            <th>DP</th>
                            {Array.from({length: n}, (_, i) => <th key={`col-${i}`}>j={i+1}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {currentStep.dpTable.map((row, i) => (
                            <tr key={`row-${i}`}>
                                <th>i={i+1}</th>
                                {row.map((val, j) => {
                                    if (i > j) {
                                        return <td key={`${i}-${j}`} className="empty-cell">-</td>;
                                    }
                                    
                                    let cellClass = 'dp-cell';
                                    const state = currentStep.cellStates[`${i}-${j}`];
                                    
                                    if (state === 'active') cellClass += ' active-cell';
                                    else if (state === 'filled') cellClass += ' filled-cell';
                                    
                                    // Highlight if it's part of the current subproblems being looked up
                                    if (currentStep.leftSub && currentStep.leftSub[0] === i && currentStep.leftSub[1] === j) cellClass += ' highlight-lookup';
                                    if (currentStep.rightSub && currentStep.rightSub[0] === i && currentStep.rightSub[1] === j) cellClass += ' highlight-lookup';

                                    const displayVal = val === Infinity ? '∞' : val;
                                    const splitPoint = currentStep.sTable[i][j];

                                    return (
                                        <td key={`${i}-${j}`} className={cellClass}>
                                            <div className="val">{displayVal}</div>
                                            {state === 'filled' && splitPoint !== undefined && splitPoint !== 0 && i !== j && (
                                                <div className="split-val">s={splitPoint + 1}</div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <DualView
            algorithmName="Matrix Chain Multiplication"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={currentStep?.description || "Find the most efficient way to multiply a given sequence of matrices."}
        >
            <div className="mcm-container">
                <div className="mcm-input-bar">
                    <div className="mcm-input-group">
                        <label>Dimensions [P₀, P₁, ...]:</label>
                        <input
                            type="text"
                            className="mcm-value-input"
                            value={inputVal}
                            onChange={(e) => setInputVal(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleApply()}
                            placeholder="e.g. 10, 30, 5, 60"
                        />
                    </div>
                    <button className="mcm-btn btn-primary" onClick={handleApply}>
                        <FaPlay style={{fontSize: '0.8rem'}} /> Apply
                    </button>
                    <button className="mcm-btn btn-secondary" onClick={handleRandomize}>
                        <FaRandom /> Random
                    </button>
                </div>

                <div className="mcm-visual-grid">
                    <div className="mcm-matrix-chain">
                        <div className="panel-label">
                            <FaProjectDiagram /> Matrix Sequence
                        </div>
                        <div className="matrix-blocks">
                            {(currentStep?.matrices || []).map((m, idx) => {
                                let blockClass = 'matrix-block';
                                const isActive = currentStep?.activeRange && idx >= currentStep.activeRange[0] && idx <= currentStep.activeRange[1];
                                const isSplitLeft = currentStep?.splitPoint !== undefined && isActive && idx <= currentStep.splitPoint;
                                const isSplitRight = currentStep?.splitPoint !== undefined && isActive && idx > currentStep.splitPoint;

                                if (isSplitLeft) blockClass += ' split-left';
                                else if (isSplitRight) blockClass += ' split-right';
                                else if (isActive) blockClass += ' active-block';

                                return (
                                    <div key={idx} className={blockClass}>
                                        <div className="m-id">{m.id}</div>
                                        <div className="m-dim">{m.rows} × {m.cols}</div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        {(currentStep?.optimalParens || currentStep?.currentOptimalParens) && (
                            <div className="parens-display">
                                <strong>Current Best Parenthesization: </strong> 
                                <span className="parens-text">{currentStep.optimalParens || currentStep.currentOptimalParens}</span>
                            </div>
                        )}
                    </div>

                    <div className="mcm-dp-panel">
                        <div className="panel-label">
                            Minimum Cost Table (DP)
                        </div>
                        {renderDPTable()}
                    </div>
                </div>

                <div className="mcm-footer">
                    <div className="mcm-legend">
                        <div className="leg-item"><span className="dot yellow"></span> Evaluating Chain</div>
                        <div className="leg-item"><span className="dot blue"></span> Left Split Segment</div>
                        <div className="leg-item"><span className="dot teal"></span> Right Split Segment</div>
                        <div className="leg-item"><span className="dot purple"></span> Completed DP Cell</div>
                    </div>
                </div>

                <div className="mcm-controls-wrapper">
                    <AnimationControls
                        inputType="none"
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

                {/* Education Panel */}
                <div className="cs-education-panel">
                    <div className="cs-edu-grid">
                        <div className="cs-edu-section">
                            <h3>How It Works</h3>
                            <p>
                                Matrix Chain Multiplication is an optimization problem that can be solved using dynamic programming. 
                                Given a sequence of matrices, the goal is to find the most efficient way to multiply these matrices. 
                            </p>
                            <h3 style={{ marginTop: '16px' }}>Dynamic Programming</h3>
                            <p>
                                The problem is not actually to perform the multiplications, but merely to decide the sequence of the matrix multiplications 
                                involved. We build a DP table where `dp[i][j]` stores the minimum operations needed to multiply the chain from matrix i to j.
                                We split the chain at every possible point k to minimize `dp[i][k] + dp[k+1][j] + cost`.
                            </p>
                        </div>
                        <div className="cs-edu-section">
                            <h3>Complexity</h3>
                            <div className="cs-complexity-bubble">
                                <div className="cs-complexity-item">
                                    <span>Time Complexity</span>
                                    <span style={{ color: '#f87171' }}>O(n³)</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Space Complexity</span>
                                    <span style={{ color: '#fbbf24' }}>O(n²)</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Method</span>
                                    <span style={{ color: '#6366f1' }}>Dynamic Programming</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Optimal Substructure</span>
                                    <span style={{ color: '#34d399' }}>Yes</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Overlapping Subproblems</span>
                                    <span style={{ color: '#34d399' }}>Yes</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DualView>
    );
};

export default MatrixChainVisualizer;
