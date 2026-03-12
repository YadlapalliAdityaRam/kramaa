import React, { useState, useMemo, useEffect } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateSelectionSortSteps } from '../algorithms/sorting/selectionSort';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { FaPlay, FaRandom, FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import './SelectionSortVisualizer.css';

const SelectionSortVisualizer = () => {
    const [inputVal, setInputVal] = useState('64, 25, 12, 22, 11');
    const [arrayData, setArrayData] = useState([64, 25, 12, 22, 11]);
    const [isAscending, setIsAscending] = useState(true);
    const [activeLanguage, setActiveLanguage] = useState('javascript');

    const steps = useMemo(() => generateSelectionSortSteps(arrayData, isAscending), [arrayData, isAscending]);

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
    }, [arrayData, isAscending]);

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

    const codeSnippet = algorithmCodes.selectionSort?.[activeLanguage] || '';

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'start-pass': return 3;
            case 'compare': return 6;
            case 'new-min': return 9;
            case 'swap-start': return 13;
            case 'swap': return 16;
            case 'sorted': return 16; // Just the swap area for sorted completion
            case 'completed': return 0;
            default: return 0;
        }
    };

    const currentArray = currentStep?.arraySnapshot || arrayData;
    const extremeLabel = isAscending ? 'Minimum' : 'Maximum';

    return (
        <DualView
            algorithmName="Selection Sort"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={currentStep?.description || "Repeatedly finds the smallest element from the unsorted part and places it at the beginning."}
        >
            <div className="selsort-container">
                <div className="selsort-input-bar">
                    <div className="selsort-input-group">
                        <label>Array:</label>
                        <input
                            type="text"
                            className="selsort-value-input"
                            value={inputVal}
                            onChange={(e) => setInputVal(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleApply()}
                            placeholder="e.g. 64, 25, 12, 22, 11"
                        />
                    </div>
                    <button className="selsort-btn btn-primary" onClick={handleApply}>
                        <FaPlay style={{fontSize: '0.8rem'}} /> Apply
                    </button>
                    <button className="selsort-btn btn-secondary" onClick={handleRandomize}>
                        <FaRandom /> Random
                    </button>
                    <button 
                        className="selsort-btn btn-ghost" 
                        onClick={() => setIsAscending(!isAscending)}
                        title={`Currently sorting ${isAscending ? 'Ascending' : 'Descending'}`}
                    >
                        {isAscending ? <FaSortAmountDown /> : <FaSortAmountUp />} 
                        {isAscending ? ' Ascending' : ' Descending'}
                    </button>
                </div>

                <div className="selsort-visual-workspace">
                    <div className="selsort-workspace-header">
                        <div className="panel-label">Array Array State</div>
                        <div className="selsort-tracking-badge">
                            Target: <strong>{extremeLabel}</strong>
                        </div>
                    </div>

                    <div className="selsort-main-array">
                        <AnimatePresence>
                            {currentArray.map((val, idx) => {
                                let boxClass = 'selsort-box';
                                let statusLabel = null;
                                
                                const isSorted = currentStep?.sortedIndices?.includes(idx);
                                const isMin = currentStep?.currentMin === idx;
                                const isScanning = currentStep?.activeScan === idx;
                                const isSwapTarget = currentStep?.swapTargets?.includes(idx);

                                if (isSorted) {
                                    boxClass += ' sorted-box';
                                } else if (isSwapTarget) {
                                    boxClass += ' swap-box';
                                    statusLabel = 'Swapping';
                                } else if (isMin) {
                                    boxClass += ' min-box';
                                    statusLabel = `Current ${extremeLabel}`;
                                } else if (isScanning) {
                                    boxClass += ' scan-box';
                                    statusLabel = 'Scanning';
                                } else {
                                    boxClass += ' unsorted-box';
                                }

                                // In swap phase, shift up slightly to look like a swap animation
                                const isSwappingOut = currentStep?.type === 'swap-start' && isSwapTarget;

                                return (
                                    <div key={`item-wrapper-${idx}`} className="selsort-item-wrapper">
                                        {statusLabel && (
                                            <div className="selsort-status-label">{statusLabel}</div>
                                        )}
                                        <motion.div 
                                            key={`item-${idx}`} 
                                            className={boxClass}
                                            animate={{
                                                y: isSwappingOut ? -40 : 0,
                                                scale: isMin ? 1.05 : 1
                                            }}
                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                        >
                                            <span className="selsort-val">{val}</span>
                                        </motion.div>
                                        <div className="selsort-idx">{idx}</div>
                                        
                                        {/* Sorted boundary divider line */}
                                        {currentStep?.sortedBoundary === idx + 1 && currentStep?.sortedBoundary < currentArray.length && (
                                            <div className="selsort-boundary-divider"></div>
                                        )}
                                    </div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="selsort-footer">
                    <div className="selsort-legend">
                        <div className="leg-item"><span className="dot green"></span> Sorted Portion</div>
                        <div className="leg-item"><span className="dot default"></span> Unsorted Portion</div>
                        <div className="leg-item"><span className="dot yellow"></span> Scanning / Comparing</div>
                        <div className="leg-item"><span className="dot blue"></span> Current {extremeLabel}</div>
                        <div className="leg-item"><span className="dot red"></span> Swapping Elements</div>
                    </div>
                </div>

                <div className="selsort-controls-wrapper">
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
                                Selection Sort divides the input list into two parts: a sorted sublist of items which is built up from left to right at the front (left) of the list, 
                                and a sublist of the remaining unsorted items that occupy the rest of the list.
                            </p>
                            <h3 style={{ marginTop: '16px' }}>The Algorithm</h3>
                            <p>
                                Initially, the sorted sublist is empty and the unsorted sublist is the entire input list. 
                                The algorithm proceeds by finding the smallest (or largest) element in the unsorted sublist, 
                                exchanging (swapping) it with the leftmost unsorted element, and moving the sublist boundaries one element to the right.
                            </p>
                        </div>
                        <div className="cs-edu-section">
                            <h3>Complexity</h3>
                            <div className="cs-complexity-bubble">
                                <div className="cs-complexity-item">
                                    <span>Time (Best)</span>
                                    <span style={{ color: '#fbbf24' }}>O(n²)</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Time (Average)</span>
                                    <span style={{ color: '#fbbf24' }}>O(n²)</span>
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

export default SelectionSortVisualizer;
