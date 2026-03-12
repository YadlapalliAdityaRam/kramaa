import React, { useState, useMemo, useEffect } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateInsertionSortSteps } from '../algorithms/sorting/insertionSort';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { FaPlay, FaRandom, FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import './InsertionSortVisualizer.css';

const InsertionSortVisualizer = () => {
    const [inputVal, setInputVal] = useState('8, 3, 5, 2, 9, 1');
    const [arrayData, setArrayData] = useState([8, 3, 5, 2, 9, 1]);
    const [activeLanguage, setActiveLanguage] = useState('javascript');
    const [isAscending, setIsAscending] = useState(true);

    const steps = useMemo(() => generateInsertionSortSteps(arrayData, isAscending), [arrayData, isAscending]);

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

    const codeSnippet = algorithmCodes.insertionSort?.[activeLanguage] || '';

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'select': return 3;
            case 'compare': return 5;
            case 'shift': return 6;
            case 'no-shift': return 8;
            case 'insert': return 10;
            case 'completed': return 0;
            default: return 0;
        }
    };

    const currentArray = currentStep?.arraySnapshot || arrayData;
    const { 
        sortedIndices = [0], 
        currentIndex, 
        compareIndex, 
        shiftIndices = [], 
        keyValue, 
        type 
    } = currentStep || {};

    return (
        <DualView
            algorithmName="Insertion Sort"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={currentStep?.description || "Builds the sorted array one element at a time by sliding larger numbers to the right to make space for the key."}
        >
            <div className="insertion-container">
                <div className="insertion-input-bar">
                    <div className="insertion-input-group">
                        <label>Array:</label>
                        <input
                            type="text"
                            className="insertion-value-input"
                            value={inputVal}
                            onChange={(e) => setInputVal(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleApply()}
                            placeholder="e.g. 8, 3, 5, 2, 9, 1"
                        />
                    </div>
                    
                    <button 
                        className="insertion-btn btn-outline" 
                        onClick={() => setIsAscending(!isAscending)}
                        title={`Currently sorting ${isAscending ? 'Ascending' : 'Descending'}`}
                    >
                        {isAscending ? <FaSortAmountUp /> : <FaSortAmountDown />} 
                        {isAscending ? ' ASC' : ' DESC'}
                    </button>

                    <button className="insertion-btn btn-primary" onClick={handleApply}>
                        <FaPlay style={{fontSize: '0.8rem'}} /> Sort
                    </button>
                    <button className="insertion-btn btn-secondary" onClick={handleRandomize}>
                        <FaRandom /> Random
                    </button>
                </div>

                <div className="insertion-visual-workspace">
                    <div className="insertion-top-hud">
                        <div className="insertion-hud-badge">
                            Active Key: <strong>{keyValue !== null && keyValue !== undefined ? keyValue : 'N/A'}</strong>
                        </div>
                    </div>

                    <div className="insertion-main-display">
                        <div className="insertion-arrays-wrapper">
                            <AnimatePresence>
                                {currentArray.map((val, idx) => {
                                    let boxClass = 'insertion-box';
                                    let label = null;
                                    
                                    const isKey = (type === 'select' || type === 'compare' || type === 'shift' || type === 'no-shift') && idx === currentIndex;
                                    const isComparing = type === 'compare' && idx === compareIndex;
                                    const isShifting = type === 'shift' && shiftIndices.includes(idx);
                                    const isInserting = type === 'insert' && idx === currentIndex;
                                    const isSorted = sortedIndices.includes(idx) || type === 'completed';

                                    if (isInserting) {
                                        boxClass += ' insert-box';
                                        label = 'Inserted';
                                    } else if (isKey) {
                                        boxClass += ' key-box';
                                        label = 'Key';
                                    } else if (isShifting) {
                                        boxClass += ' shift-box';
                                    } else if (isComparing) {
                                        boxClass += ' compare-box';
                                        label = 'Compare';
                                    } else if (isSorted) {
                                        boxClass += ' sorted-box';
                                    } else {
                                        boxClass += ' unsorted-box';
                                    }

                                    return (
                                        <div key={`arr-item-${idx}`} className={`insertion-item-wrapper ${isSorted ? 'in-sorted-region' : ''}`}>
                                            {label && (
                                                <div className={`insertion-status-label ${isKey ? 'lbl-key' : isComparing ? 'lbl-compare' : isInserting ? 'lbl-insert' : ''}`}>
                                                    {label}
                                                </div>
                                            )}
                                            <motion.div 
                                                className={boxClass}
                                                animate={{
                                                    y: isKey ? -30 : (isInserting ? -10 : 0),
                                                    x: isShifting ? 10 : 0,
                                                    scale: isInserting || isKey ? 1.05 : 1
                                                }}
                                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                            >
                                                {/* Show empty slot if it's the current target of a shifting step but not the key itself */}
                                                <span className="insertion-val">
                                                    {(type === 'shift' || type === 'compare' || type === 'select') && idx === currentIndex ? '?' : val}
                                                </span>
                                            </motion.div>
                                            <div className="insertion-idx">{idx}</div>
                                        </div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                <div className="insertion-footer">
                    <div className="insertion-legend">
                        <div className="leg-item"><span className="dot yellow"></span> Held Key</div>
                        <div className="leg-item"><span className="dot blue"></span> Comparing</div>
                        <div className="leg-item"><span className="dot red"></span> Shifting Right</div>
                        <div className="leg-item"><span className="dot green"></span> Sorted Section</div>
                    </div>
                </div>

                <div className="insertion-controls-wrapper">
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
                                Insertion Sort builds the final sorted array one item at a time. It iterates, consuming one input element 
                                each repetition, and grows a sorted output list.
                            </p>
                            <h3 style={{ marginTop: '16px' }}>The Sorting Process</h3>
                            <p>
                                At each iteration, insertion sort removes one element from the input data, finds the location it belongs within the sorted list, 
                                and inserts it there. It repeats until no input elements remain. This is similar to how you array playing cards in your hands.
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

export default InsertionSortVisualizer;
