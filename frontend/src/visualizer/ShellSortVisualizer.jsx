import React, { useState, useMemo, useEffect } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateShellSortSteps } from '../algorithms/sorting/shellSort';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { FaPlay, FaRandom } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import './ShellSortVisualizer.css';

const ShellSortVisualizer = () => {
    const [inputVal, setInputVal] = useState('23, 12, 1, 8, 34, 54, 2, 3');
    const [arrayData, setArrayData] = useState([23, 12, 1, 8, 34, 54, 2, 3]);
    const [activeLanguage, setActiveLanguage] = useState('javascript');

    const steps = useMemo(() => generateShellSortSteps(arrayData), [arrayData]);

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
        const randomArr = Array.from({ length: 8 }, () => Math.floor(Math.random() * 90) + 10);
        setArrayData(randomArr);
        setInputVal(randomArr.join(', '));
        toast.success("Array randomized");
    };

    const codeSnippet = algorithmCodes.shellSort?.[activeLanguage] || '';

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'gap-change': return 2;
            case 'compare': return 6;
            case 'swap': return 9;
            case 'placed': return 12;
            case 'completed': return 0;
            default: return 0;
        }
    };

    const currentArray = currentStep?.arraySnapshot || arrayData;
    const currentGap = currentStep?.gap || 0;

    return (
        <DualView
            algorithmName="Shell Sort"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={currentStep?.description || "Sorts elements far apart first, shrinking the gap down to 1."}
        >
            <div className="shell-container">
                <div className="shell-input-bar">
                    <div className="shell-input-group">
                        <label>Array:</label>
                        <input
                            type="text"
                            className="shell-value-input"
                            value={inputVal}
                            onChange={(e) => setInputVal(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleApply()}
                            placeholder="e.g. 23, 12, 1, 8, 34, 54, 2, 3"
                        />
                    </div>
                    <button className="shell-btn btn-primary" onClick={handleApply}>
                        <FaPlay style={{fontSize: '0.8rem'}} /> Apply
                    </button>
                    <button className="shell-btn btn-secondary" onClick={handleRandomize}>
                        <FaRandom /> Random
                    </button>
                </div>

                <div className="shell-visual-workspace">
                    <div className="shell-workspace-header">
                        <div className="panel-label">Array State</div>
                        <div className="shell-gap-badge">
                            Current Gap: <strong>{currentGap}</strong>
                        </div>
                    </div>

                    <div className="shell-main-array">
                        <div className="shell-array-track">
                            <AnimatePresence>
                                {currentArray.map((val, idx) => {
                                    let boxClass = 'shell-box';
                                    let statusLabel = null;
                                    
                                    const isCompleted = currentStep?.type === 'completed';
                                    const inCurrentGroup = currentStep?.currentGroup?.includes(idx);
                                    const isComparing = currentStep?.comparingIndices?.includes(idx);
                                    const isSwapping = currentStep?.swapIndices?.includes(idx);

                                    if (isCompleted) {
                                        boxClass += ' sorted-box';
                                    } else if (isSwapping) {
                                        boxClass += ' swap-box';
                                        statusLabel = 'Swapping';
                                    } else if (isComparing) {
                                        boxClass += ' compare-box';
                                        statusLabel = 'Compare';
                                    } else if (inCurrentGroup) {
                                        boxClass += ' group-box';
                                    } else {
                                        boxClass += ' default-box';
                                    }

                                    // Elevate swap candidates
                                    const isSwappingOut = isSwapping;

                                    return (
                                        <div key={`shell-item-${idx}`} className="shell-item-wrapper">
                                            {statusLabel && (
                                                <div className="shell-status-label">{statusLabel}</div>
                                            )}
                                            {inCurrentGroup && !isCompleted && (
                                                <div className="shell-group-indicator"></div>
                                            )}
                                            <motion.div 
                                                className={boxClass}
                                                animate={{
                                                    y: isSwappingOut ? -30 : 0,
                                                    scale: isComparing ? 1.05 : 1
                                                }}
                                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                            >
                                                <span className="shell-val">{val}</span>
                                            </motion.div>
                                            <div className="shell-idx">{idx}</div>
                                        </div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                        
                        {/* Gap Connector Visualization */}
                        {currentStep && currentStep.comparingIndices && currentStep.comparingIndices.length === 2 && (
                            <div className="shell-gap-connector">
                                Gap = {currentGap}
                            </div>
                        )}
                    </div>
                </div>

                <div className="shell-footer">
                    <div className="shell-legend">
                        <div className="leg-item"><span className="dot default"></span> Ignored / Out of bounds</div>
                        <div className="leg-item"><span className="dot blue"></span> Current Gap Group</div>
                        <div className="leg-item"><span className="dot yellow"></span> Comparing Elements</div>
                        <div className="leg-item"><span className="dot red"></span> Swapping</div>
                        <div className="leg-item"><span className="dot green"></span> Sorted</div>
                    </div>
                </div>

                <div className="shell-controls-wrapper">
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
                                Shell Sort is a highly efficient sorting algorithm and is based on insertion sort. 
                                This algorithm avoids large shifts as in case of insertion sort, if the smaller value is 
                                to the right and has to be moved to the far left.
                            </p>
                            <h3 style={{ marginTop: '16px' }}>The Gap Sequence</h3>
                            <p>
                                It does this by sorting elements that are far apart from each other and successively reducing the interval 
                                (or gap) between the elements to be sorted. By the time the gap is 1, the array is almost sorted, and a final 
                                insertion sort finishes the job quickly.
                            </p>
                        </div>
                        <div className="cs-edu-section">
                            <h3>Complexity</h3>
                            <div className="cs-complexity-bubble">
                                <div className="cs-complexity-item">
                                    <span>Time (Best)</span>
                                    <span style={{ color: '#34d399' }}>O(n log n)</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Time (Average)</span>
                                    <span style={{ color: '#fbbf24' }}>Depends on gap</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Time (Worst)</span>
                                    <span style={{ color: '#f87171' }}>O(n²)</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Space Complexity</span>
                                    <span style={{ color: '#6366f1' }}>O(1)</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Stable Sort</span>
                                    <span style={{ color: '#f87171' }}>No</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DualView>
    );
};

export default ShellSortVisualizer;
