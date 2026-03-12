import React, { useState, useMemo, useEffect } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateTimSortSteps } from '../algorithms/sorting/timSort';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { FaPlay, FaRandom, FaLayerGroup } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import './TimSortVisualizer.css';

const TimSortVisualizer = () => {
    const [inputVal, setInputVal] = useState('5, 8, 9, 3, 4, 7, 1, 2, 6, 10, 12, 11');
    const [arrayData, setArrayData] = useState([5, 8, 9, 3, 4, 7, 1, 2, 6, 10, 12, 11]);
    const [activeLanguage, setActiveLanguage] = useState('javascript');

    const steps = useMemo(() => generateTimSortSteps(arrayData), [arrayData]);

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
        const randomArr = Array.from({ length: 14 }, () => Math.floor(Math.random() * 90) + 10);
        setArrayData(randomArr);
        setInputVal(randomArr.join(', '));
        toast.success("Array randomized");
    };

    const codeSnippet = algorithmCodes.timSort?.[activeLanguage] || '';

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'identify-run': return 9;
            case 'compare': return 13;
            case 'shift': return 16;
            case 'insert-complete': return 21;
            case 'merge-start': return 30;
            case 'merge-compare': return 39;
            case 'merge-copy': return 42;
            case 'completed': return 55;
            default: return 0;
        }
    };

    const viewingArr = currentStep?.arraySnapshot || arrayData;

    return (
        <DualView
            algorithmName="Tim Sort"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={currentStep?.description || "Sort by building sorted Runs (Insertion Sort), then Merging them."}
        >
            <div className="ts-container">
                <div className="ts-input-bar">
                    <div className="ts-input-group">
                        <label>Array:</label>
                        <input
                            type="text"
                            className="ts-value-input"
                            value={inputVal}
                            onChange={(e) => setInputVal(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleApply()}
                            placeholder="e.g. 5, 8, 9, 3, 4, 7"
                        />
                    </div>
                    <button className="ts-btn btn-primary" onClick={handleApply}>
                        <FaPlay style={{fontSize: '0.8rem'}} /> Apply
                    </button>
                    <button className="ts-btn btn-secondary" onClick={handleRandomize}>
                        <FaRandom /> Random
                    </button>
                </div>

                <div className="ts-visual-workspace">
                    <div className="panel-label">
                        <FaLayerGroup /> Hybrid Sorting State
                        {currentStep?.leftRun && currentStep?.rightRun && (
                            <span className="mode-badge merge">Merge Phase</span>
                        )}
                        {currentStep?.activeRun && !currentStep?.leftRun && (
                            <span className="mode-badge insert">Insertion Phase</span>
                        )}
                    </div>
                    
                    <div className="ts-main-array">
                        <AnimatePresence>
                            {viewingArr.map((val, idx) => {
                                let boxClass = 'ts-array-box';
                                const isSorted = currentStep?.sortedIndices?.includes(idx);
                                const isRunSorted = currentStep?.sortedElements?.includes(idx) || currentStep?.isRunComplete && currentStep?.activeRun && idx >= currentStep.activeRun[0] && idx <= currentStep.activeRun[1];
                                
                                const isActiveRun = currentStep?.activeRun && idx >= currentStep.activeRun[0] && idx <= currentStep.activeRun[1];
                                const isCompare = currentStep?.compareIndices?.includes(idx);
                                const isShift = currentStep?.type === 'shift' && isCompare;

                                const isLeftRun = currentStep?.leftRun && idx >= currentStep.leftRun[0] && idx <= currentStep.leftRun[1];
                                const isRightRun = currentStep?.rightRun && idx >= currentStep.rightRun[0] && idx <= currentStep.rightRun[1];
                                const isMergeCopy = currentStep?.mergeTarget && currentStep?.copiedIndex === idx;

                                if (isSorted) boxClass += ' fully-sorted';
                                else if (isMergeCopy) boxClass += ' merge-copied';
                                else if (isCompare && isShift) boxClass += ' shifting';
                                else if (isCompare) boxClass += ' comparing';
                                else if (isRunSorted) boxClass += ' run-sorted';
                                else if (isActiveRun) boxClass += ' active-run';
                                else if (isLeftRun) boxClass += ' left-run';
                                else if (isRightRun) boxClass += ' right-run';

                                return (
                                    <motion.div 
                                        key={`item-${idx}`} 
                                        className="ts-array-item"
                                        layout
                                        transition={{type: "spring", stiffness: 300, damping: 20}}
                                    >
                                        <div className={boxClass}>
                                            {val}
                                        </div>
                                        <div className="ts-array-idx">{idx}</div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {/* Brackets to show runs explicitly forming */}
                    <div className="ts-brackets-area">
                        {currentStep?.activeRun && !currentStep?.leftRun && (
                            <div className="bracket-group" style={{
                                gridColumnStart: currentStep.activeRun[0] + 1,
                                gridColumnEnd: currentStep.activeRun[1] + 2
                            }}>
                                <div className="bracket-top"></div>
                                <div className="bracket-label">Active Run (Max Size 4)</div>
                            </div>
                        )}

                        {currentStep?.leftRun && currentStep?.rightRun && (
                            <>
                                <div className="bracket-group left-merge" style={{
                                    gridColumnStart: currentStep.leftRun[0] + 1,
                                    gridColumnEnd: currentStep.leftRun[1] + 2
                                }}>
                                    <div className="bracket-top"></div>
                                    <div className="bracket-label">Left Run</div>
                                </div>
                                <div className="bracket-group right-merge" style={{
                                    gridColumnStart: currentStep.rightRun[0] + 1,
                                    gridColumnEnd: currentStep.rightRun[1] + 2
                                }}>
                                    <div className="bracket-top"></div>
                                    <div className="bracket-label">Right Run</div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="ts-footer">
                    <div className="ts-legend">
                        <div className="leg-item"><span className="dot blue"></span> Active Run</div>
                        <div className="leg-item"><span className="dot yellow"></span> Comparing</div>
                        <div className="leg-item"><span className="dot red"></span> Shifting / Moving</div>
                        <div className="leg-item"><span className="dot purple"></span> Merging Target</div>
                        <div className="leg-item"><span className="dot teal"></span> Intermediate Sorted</div>
                        <div className="leg-item"><span className="dot green"></span> Final Sorted</div>
                    </div>
                </div>

                <div className="ts-controls-wrapper">
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
                                Tim Sort is a hybrid sorting algorithm derived from Merge Sort and Insertion Sort, 
                                designed to perform well on many kinds of real-world data. It was invented by Tim Peters.
                            </p>
                            <h3 style={{ marginTop: '16px' }}>Runs and Merging</h3>
                            <p>
                                It first analyzes the array to find existing ordered subsequences called "runs". 
                                If runs are smaller than a minimum run size (e.g., 4 or 32 elements), it uses Insertion Sort 
                                to boost their size. Finally, it uses a highly optimized Merge Sort to merge the runs together.
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
                                    <span style={{ color: '#fbbf24' }}>O(n log n)</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Time (Worst)</span>
                                    <span style={{ color: '#f87171' }}>O(n log n)</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Space Complexity</span>
                                    <span style={{ color: '#fbbf24' }}>O(n)</span>
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

export default TimSortVisualizer;
