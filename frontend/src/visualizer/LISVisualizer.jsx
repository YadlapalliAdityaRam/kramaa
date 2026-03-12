import React, { useState, useMemo, useEffect } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateLISSteps } from '../algorithms/dp/lis';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { FaPlay, FaRandom } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import './LISVisualizer.css';

const LISVisualizer = () => {
    const [inputVal, setInputVal] = useState('10, 9, 2, 5, 3, 7, 101, 18');
    const [arrayData, setArrayData] = useState([10, 9, 2, 5, 3, 7, 101, 18]);
    const [activeLanguage, setActiveLanguage] = useState('javascript');

    const steps = useMemo(() => generateLISSteps(arrayData), [arrayData]);

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
    }, [arrayData]);

    const handleApply = () => {
        const parsed = inputVal.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        if (parsed.length === 0) {
            toast.error("Please enter valid numbers separated by commas.");
            return;
        }
        if (parsed.length > 20) {
            toast.error("Maximum 20 elements allowed for clear visualization.");
            return;
        }
        setArrayData(parsed);
        toast.success("Array applied");
    };

    const handleRandomize = () => {
        const randomArr = Array.from({ length: 8 }, () => Math.floor(Math.random() * 50) + 1);
        setArrayData(randomArr);
        setInputVal(randomArr.join(', '));
        toast.success("Array randomized");
    };

    const codeSnippet = algorithmCodes.lis?.[activeLanguage] || '';

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'init': return 3;
            case 'select-i': return 6;
            case 'compare-valid': return 9;
            case 'compare-invalid': return 7;
            case 'dp-set': return 10;
            case 'completed': return 0;
            default: return 0;
        }
    };

    const currentArray = currentStep?.arraySnapshot || arrayData;
    const { dpArray, currentI, currentJ, comparisonResult, lisIndices, type } = currentStep || {};
    
    // Derived values
    const safeI = currentI !== undefined && currentI !== null ? currentI : -1;
    const safeJ = currentJ !== undefined && currentJ !== null ? currentJ : -1;
    const safeDP = dpArray || new Array(currentArray.length).fill(1);
    const safeLIS = lisIndices || [];

    return (
        <DualView
            algorithmName="Longest Increasing Subsequence"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={currentStep?.description || "Finds the longest subsequence where elements strictly increase."}
        >
            <div className="lis-container">
                <div className="lis-input-bar">
                    <div className="lis-input-group">
                        <label>Array:</label>
                        <input
                            type="text"
                            className="lis-value-input"
                            value={inputVal}
                            onChange={(e) => setInputVal(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleApply()}
                            placeholder="e.g. 10, 9, 2, 5, 3, 7, 101, 18"
                        />
                    </div>
                    <button className="lis-btn btn-primary" onClick={handleApply}>
                        <FaPlay style={{fontSize: '0.8rem'}} /> Apply
                    </button>
                    <button className="lis-btn btn-secondary" onClick={handleRandomize}>
                        <FaRandom /> Random
                    </button>
                </div>

                <div className="lis-visual-workspace">
                    <div className="lis-workspace-header">
                        <div className="panel-label">Input Array & DP Table</div>
                        <div className="lis-hud-badge">
                            Max LIS Found: <strong>{currentStep?.lisLength || 0}</strong>
                        </div>
                    </div>

                    <div className="lis-main-display">
                        <div className="lis-arrays-wrapper">
                            {/* Original Array Row */}
                            <div className="lis-row">
                                <div className="lis-row-label">arr[i]</div>
                                <div className="lis-cells">
                                    <AnimatePresence>
                                        {currentArray.map((val, idx) => {
                                            let boxClass = 'lis-box';
                                            let statusLabel = null;
                                            
                                            const isI = idx === safeI;
                                            const isJ = idx === safeJ;
                                            const isFinalPath = type === 'completed' && safeLIS.includes(idx);
                                            
                                            if (isFinalPath) {
                                                boxClass += ' final-box';
                                            } else if (isI) {
                                                boxClass += ' current-i-box';
                                                statusLabel = 'i';
                                            } else if (isJ) {
                                                if (comparisonResult === 'update') boxClass += ' valid-update-box';
                                                else if (comparisonResult === 'no-update') boxClass += ' valid-noupdate-box';
                                                else boxClass += ' invalid-box';
                                                statusLabel = 'j';
                                            } else {
                                                boxClass += ' default-box';
                                                if (safeI !== -1 && idx > safeI) boxClass += ' pending-box';
                                            }

                                            return (
                                                <div key={`arr-item-${idx}`} className="lis-item-wrapper">
                                                    {statusLabel && (
                                                        <div className={`lis-status-label ${isI ? 'lbl-i' : isJ ? 'lbl-j' : ''}`}>
                                                            {statusLabel}
                                                        </div>
                                                    )}
                                                    <motion.div 
                                                        className={boxClass}
                                                        animate={{
                                                            y: isI ? -10 : (isJ ? -5 : 0),
                                                            scale: isFinalPath ? 1.05 : 1
                                                        }}
                                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                                    >
                                                        <span className="lis-val">{val}</span>
                                                    </motion.div>
                                                    <div className="lis-idx">{idx}</div>
                                                </div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </div>
                            </div>
                            
                            {/* Vertical Connector Spacer */}
                            <div className="lis-spacer-row"></div>

                            {/* DP Array Row */}
                            <div className="lis-row dp-row">
                                <div className="lis-row-label">dp[i]</div>
                                <div className="lis-cells">
                                    {safeDP.map((val, idx) => {
                                        let dpClass = 'lis-dp-box';
                                        
                                        const isI = idx === safeI;
                                        const isJ = idx === safeJ;
                                        const isFinalPath = type === 'completed' && safeLIS.includes(idx);
                                        const isJustUpdated = type === 'dp-set' && isI;
                                        
                                        if (isFinalPath) {
                                            dpClass += ' dp-final';
                                        } else if (isJustUpdated) {
                                            dpClass += ' dp-set';
                                        } else if (isI) {
                                            dpClass += ' dp-i';
                                        } else if (isJ) {
                                            dpClass += ' dp-j';
                                        } else {
                                            dpClass += ' dp-default';
                                        }

                                        return (
                                            <div key={`dp-item-${idx}`} className="lis-item-wrapper">
                                                <div className={dpClass}>
                                                    <span className="lis-dp-val">{val}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {type === 'completed' && safeLIS.length > 0 && (
                            <div className="lis-path-panel">
                                <span className="path-title">Extracted Subsequence:</span>
                                <div className="path-trace">
                                    {safeLIS.map((index, i) => (
                                        <React.Fragment key={`path-${index}`}>
                                            <div className="path-element">
                                                <div className="path-val">{currentArray[index]}</div>
                                                <div className="path-idx">idx: {index}</div>
                                            </div>
                                            {i < safeLIS.length - 1 && <div className="path-arrow">→</div>}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="lis-footer">
                    <div className="lis-legend">
                        <div className="leg-item"><span className="dot yellow"></span> Current (i)</div>
                        <div className="leg-item"><span className="dot blue"></span> Compare (j)</div>
                        <div className="leg-item"><span className="dot red"></span> Invalid (Not Increasing)</div>
                        <div className="leg-item"><span className="dot green"></span> DP Update</div>
                        <div className="leg-item"><span className="dot purple"></span> Final LIS Path</div>
                    </div>
                </div>

                <div className="lis-controls-wrapper">
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
                                The Longest Increasing Subsequence (LIS) problem is to find the length of the longest subsequence 
                                of a given sequence such that all elements of the subsequence are sorted in strictly increasing order.
                            </p>
                            <h3 style={{ marginTop: '16px' }}>Dynamic Programming</h3>
                            <p>
                                A dynamic programming approach is used here. We maintain an array `dp` where `dp[i]` represents the length 
                                of the longest increasing subsequence that ends with the element at index `i`. For each element `i`, we check 
                                all previous elements `j`. If `arr[j] &lt; arr[i]`, we can append `arr[i]` to the subsequence ending at `j`.
                            </p>
                        </div>
                        <div className="cs-edu-section">
                            <h3>Complexity</h3>
                            <div className="cs-complexity-bubble">
                                <div className="cs-complexity-item">
                                    <span>Time Complexity</span>
                                    <span style={{ color: '#fbbf24' }}>O(n²)</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Space Complexity</span>
                                    <span style={{ color: '#34d399' }}>O(n)</span>
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

export default LISVisualizer;
