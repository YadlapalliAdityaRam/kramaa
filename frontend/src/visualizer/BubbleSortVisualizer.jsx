import React, { useState, useMemo, useEffect } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateBubbleSortSteps } from '../algorithms/sorting/bubbleSort';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { FaPlay, FaRandom, FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import './BubbleSortVisualizer.css';

const BubbleSortVisualizer = () => {
    const [inputVal, setInputVal] = useState('5, 1, 4, 2, 8');
    const [arrayData, setArrayData] = useState([5, 1, 4, 2, 8]);
    const [activeLanguage, setActiveLanguage] = useState('javascript');
    const [isAscending, setIsAscending] = useState(true);

    const steps = useMemo(() => generateBubbleSortSteps(arrayData, isAscending), [arrayData, isAscending]);

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
            toast.error("Please enter valid numbers.");
            return;
        }
        if (parsed.length > 20) {
            toast.error("Max 20 numbers allowed for clear visualization.");
            return;
        }
        setArrayData(parsed);
        toast.success("Array applied");
    };

    const handleRandomize = () => {
        const randomArr = Array.from({ length: 8 }, () => Math.floor(Math.random() * 100) + 1);
        setArrayData(randomArr);
        setInputVal(randomArr.join(', '));
        toast.success("Array randomized");
    };

    const codeSnippet = algorithmCodes.bubbleSort?.[activeLanguage] || '';

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'pass-start': return 3;
            case 'compare': return 6;
            case 'swap': return 8;
            case 'no-swap': return 6;
            case 'sorted': return 4;
            case 'completed': return 0;
            default: return 0;
        }
    };

    const currentArray = currentStep?.arraySnapshot || arrayData;
    const { indices = [], sortedIndices = [], type } = currentStep || {};

    return (
        <DualView
            algorithmName="Bubble Sort"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={currentStep?.description || "Repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order."}
        >
            <div className="bubble-container">
                <div className="bubble-input-bar">
                    <div className="bubble-input-group">
                        <label>Array:</label>
                        <input
                            type="text"
                            className="bubble-value-input"
                            value={inputVal}
                            onChange={(e) => setInputVal(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleApply()}
                            placeholder="e.g. 5, 1, 4, 2, 8"
                        />
                    </div>
                    
                    <button 
                        className="bubble-btn btn-outline" 
                        onClick={() => setIsAscending(!isAscending)}
                        title={`Currently sorting ${isAscending ? 'Ascending' : 'Descending'}`}
                    >
                        {isAscending ? <FaSortAmountUp /> : <FaSortAmountDown />} 
                        {isAscending ? ' ASC' : ' DESC'}
                    </button>

                    <button className="bubble-btn btn-primary" onClick={handleApply}>
                        <FaPlay style={{fontSize: '0.8rem'}} /> Sort
                    </button>
                    <button className="bubble-btn btn-secondary" onClick={handleRandomize}>
                        <FaRandom /> Random
                    </button>
                </div>

                <div className="bubble-visual-workspace">
                    <div className="bubble-main-display">
                        <div className="bubble-arrays-wrapper">
                            <AnimatePresence>
                                {currentArray.map((val, idx) => {
                                    let boxClass = 'bubble-box';
                                    let label = null;
                                    
                                    const isComparing = type === 'compare' && indices.includes(idx);
                                    const isSwapping = type === 'swap' && indices.includes(idx);
                                    const isNoSwap = type === 'no-swap' && indices.includes(idx);
                                    const isNewlySorted = type === 'sorted' && indices.includes(idx);
                                    const isSorted = sortedIndices.includes(idx) || type === 'completed';

                                    if (isNewlySorted) {
                                        boxClass += ' new-sorted-box';
                                        label = 'Locked';
                                    } else if (isSorted) {
                                        boxClass += ' sorted-box';
                                    } else if (isSwapping) {
                                        boxClass += ' swap-box';
                                        label = 'Swap';
                                    } else if (isComparing) {
                                        boxClass += ' compare-box';
                                        label = 'Compare';
                                    } else if (isNoSwap) {
                                        boxClass += ' noswap-box';
                                        label = 'OK';
                                    } else {
                                        boxClass += ' default-box';
                                    }

                                    return (
                                        <div key={`arr-item-${idx}`} className="bubble-item-wrapper">
                                            {label && (
                                                <div className={`bubble-status-label ${isSwapping ? 'lbl-swap' : isComparing ? 'lbl-compare' : isNoSwap ? 'lbl-noswap' : isNewlySorted ? 'lbl-sorted' : ''}`}>
                                                    {label}
                                                </div>
                                            )}
                                            <motion.div 
                                                className={boxClass}
                                                animate={{
                                                    y: isSwapping ? (idx === indices[0] ? -15 : 15) : (isComparing ? -5 : 0),
                                                    x: isSwapping ? (idx === indices[0] ? 20 : -20) : 0,
                                                    scale: isNewlySorted ? 1.05 : 1
                                                }}
                                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                            >
                                                <span className="bubble-val">{val}</span>
                                            </motion.div>
                                            <div className="bubble-idx">{idx}</div>
                                        </div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                <div className="bubble-footer">
                    <div className="bubble-legend">
                        <div className="leg-item"><span className="dot yellow"></span> Comparing</div>
                        <div className="leg-item"><span className="dot red"></span> Swapping</div>
                        <div className="leg-item"><span className="dot green"></span> Sorted Region</div>
                    </div>
                </div>

                <div className="bubble-controls-wrapper">
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
                                Bubble Sort repeatedly steps through the list, compares adjacent elements, 
                                and swaps them if they are in the wrong order. This process "bubbles" the 
                                largest remaining element to the end of the array in each pass.
                            </p>
                            <h3 style={{ marginTop: '16px' }}>Optimization</h3>
                            <p>
                                A boolean flag tracks if any swaps occurred during a pass. If a full pass 
                                completes without any swaps, the algorithm knows the array is fully sorted 
                                and can terminate early, saving unnecessary comparisons.
                            </p>
                        </div>
                        <div className="cs-edu-section">
                            <h3>Complexity</h3>
                            <div className="cs-complexity-bubble">
                                <div className="cs-complexity-item">
                                    <span>Time (Best)</span>
                                    <span style={{ color: '#34d399' }}>O(n)</span>
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

export default BubbleSortVisualizer;
