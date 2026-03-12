import React, { useState, useMemo, useEffect } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateJumpSearchSteps } from '../algorithms/searching/jumpSearch';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { FaPlay, FaRandom } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import './JumpSearchVisualizer.css';

const JumpSearchVisualizer = () => {
    const [inputVal, setInputVal] = useState('2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30');
    const [targetVal, setTargetVal] = useState('24');
    const [arrayData, setArrayData] = useState([2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30]);
    const [activeTarget, setActiveTarget] = useState(24);
    const [activeLanguage, setActiveLanguage] = useState('javascript');

    const steps = useMemo(() => generateJumpSearchSteps(arrayData, activeTarget), [arrayData, activeTarget]);

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
    }, [arrayData, activeTarget]);

    const handleApply = () => {
        const parsedArr = inputVal.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        const parsedTarget = parseInt(targetVal);

        if (parsedArr.length === 0) {
            toast.error("Please enter valid numbers for the array.");
            return;
        }
        if (isNaN(parsedTarget)) {
            toast.error("Please enter a valid target number.");
            return;
        }
        
        // Sorting the array since Jump Search requires sorted data
        const sortedArr = [...parsedArr].sort((a, b) => a - b);
        setArrayData(sortedArr);
        setActiveTarget(parsedTarget);
        toast.success("Array and Target applied. Array sorted.");
    };

    const handleRandomize = () => {
        const randomArr = Array.from({ length: 16 }, () => Math.floor(Math.random() * 100) + 1).sort((a, b) => a - b);
        const randomTarget = randomArr[Math.floor(Math.random() * randomArr.length)];
        
        setArrayData(randomArr);
        setActiveTarget(randomTarget);
        setInputVal(randomArr.join(', '));
        setTargetVal(randomTarget.toString());
        toast.success("Randomized array and target");
    };

    const codeSnippet = algorithmCodes.jumpSearch?.[activeLanguage] || '';

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'jumping': return 5;
            case 'jump-stop': return 9;
            case 'linear-scan': return 12;
            case 'found': return 15;
            case 'not-found': return 19;
            default: return 0;
        }
    };

    const currentArray = currentStep?.arraySnapshot || arrayData;
    const { jumpSize, prev, curr, scanIndex, type } = currentStep || {};
    
    // Derived values
    const safePrev = prev !== undefined && prev !== null ? prev : -1;
    const safeCurr = curr !== undefined && curr !== null ? curr : -1;
    const safeScan = scanIndex !== undefined && scanIndex !== null ? scanIndex : -1;

    // Helper to generate block boundaries
    const getBlocks = () => {
        const blocks = [];
        if (!jumpSize) return blocks;
        for (let i = 0; i < currentArray.length; i += jumpSize) {
            blocks.push(i);
        }
        return blocks;
    };
    const blockStarts = getBlocks();

    return (
        <DualView
            algorithmName="Jump Search"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={currentStep?.description || "Jumps ahead in block sizes of √N, then performs a linear scan behind the overshoot."}
        >
            <div className="jump-search-container">
                <div className="jump-input-bar">
                    <div className="jump-input-group">
                        <label>Sorted Array:</label>
                        <input
                            type="text"
                            className="jump-value-input"
                            value={inputVal}
                            onChange={(e) => setInputVal(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleApply()}
                            placeholder="2, 4, 6..."
                            style={{width: '320px'}}
                        />
                    </div>
                    <div className="jump-input-group">
                        <label>Target:</label>
                        <input
                            type="number"
                            className="jump-value-input"
                            style={{ width: '80px' }}
                            value={targetVal}
                            onChange={(e) => setTargetVal(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleApply()}
                        />
                    </div>
                    <button className="jump-btn btn-primary" onClick={handleApply}>
                        <FaPlay style={{fontSize: '0.8rem'}} /> Search
                    </button>
                    <button className="jump-btn btn-secondary" onClick={handleRandomize}>
                        <FaRandom /> Random
                    </button>
                </div>

                <div className="jump-visual-workspace">
                    <div className="jump-top-hud">
                        <div className="jump-info-board">
                           Length: <strong>{currentArray.length}</strong> 
                           <span className="divider">|</span>
                           Target: <strong>{activeTarget}</strong>
                           <span className="divider">|</span>
                           Block Size (√N): <strong>{jumpSize || Math.floor(Math.sqrt(currentArray.length))}</strong>
                        </div>
                    </div>

                    <div className="jump-main-array">
                        <AnimatePresence>
                            {currentArray.map((val, idx) => {
                                let boxClass = 'jump-box';
                                let statusLabel = null;
                                
                                const isBlockStart = blockStarts.includes(idx);
                                
                                // Logic for states
                                const isCurrentJumpHead = type === 'jumping' && idx === safeCurr;
                                const isPrevJumpTail = type === 'jumping' && idx === safePrev;
                                
                                const isInActiveLinearBlock = (type === 'jump-stop' || type === 'linear-scan') && idx >= safePrev && idx <= safeCurr;
                                const isScanning = type === 'linear-scan' && idx === safeScan;
                                const isFound = type === 'found' && (idx === safeCurr || idx === safeScan);
                                const isDiscarded = (type === 'linear-scan' || type === 'jump-stop' || type === 'found') && (idx < safePrev || idx > safeCurr) && !isFound;
                                
                                if (isDiscarded) {
                                    boxClass += ' discarded-box';
                                } else if (isFound) {
                                    boxClass += ' found-box';
                                    statusLabel = 'Found!';
                                } else if (isScanning) {
                                    boxClass += ' scanning-box';
                                    statusLabel = 'Linear Scan';
                                } else if (isCurrentJumpHead) {
                                    boxClass += ' jumping-head-box';
                                    statusLabel = 'Jump Check';
                                } else if (isPrevJumpTail) {
                                    boxClass += ' jumping-tail-box';
                                } else if (isInActiveLinearBlock) {
                                    boxClass += ' act-block-box';
                                } else {
                                    boxClass += ' default-box';
                                }

                                return (
                                    <div key={`item-${idx}`} className="jump-item-wrapper" style={{ marginRight: isBlockStart && idx !== 0 ? '16px' : '0' }}>
                                        {/* Block Boundary divider simulation using margin on wrapper mapping to blockStarts */}
                                        {statusLabel && (
                                            <div className={`jump-status-label ${isFound ? 'found-lbl' : isScanning ? 'scan-lbl' : 'jump-lbl'}`}>
                                                {statusLabel}
                                            </div>
                                        )}
                                        <motion.div 
                                            className={boxClass}
                                            animate={{
                                                y: isCurrentJumpHead ? -15 : (isScanning ? -10 : 0),
                                                scale: isFound ? 1.05 : 1
                                            }}
                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                        >
                                            <span className="jump-val">{val}</span>
                                        </motion.div>
                                        <div className="jump-idx">{idx}</div>
                                    </div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="jump-footer">
                    <div className="jump-legend">
                        <div className="leg-item"><span className="dot block-indicator"></span> Block Division (√N gap)</div>
                        <div className="leg-item"><span className="dot yellow"></span> Jump Check</div>
                        <div className="leg-item"><span className="dot blue"></span> Target Block</div>
                        <div className="leg-item"><span className="dot orange"></span> Linear Scan</div>
                        <div className="leg-item"><span className="dot green"></span> Found</div>
                    </div>
                </div>

                <div className="jump-controls-wrapper">
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
                                Jump Search is a searching algorithm for sorted arrays. The basic idea is to check fewer elements (than linear search) 
                                by jumping ahead by fixed steps or skipping some elements in place of searching all elements.
                            </p>
                            <h3 style={{ marginTop: '16px' }}>The Block Jump</h3>
                            <p>
                                The optimal block jump size is √N where N is the length of the array. It jumps forward by √N until the element at the 
                                current jump index is greater than the target. Then, it performs a linear search from the previous step to find the target.
                            </p>
                        </div>
                        <div className="cs-edu-section">
                            <h3>Complexity</h3>
                            <div className="cs-complexity-bubble">
                                <div className="cs-complexity-item">
                                    <span>Time (Best)</span>
                                    <span style={{ color: '#34d399' }}>O(1)</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Time (Average)</span>
                                    <span style={{ color: '#fbbf24' }}>O(√n)</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Time (Worst)</span>
                                    <span style={{ color: '#fbbf24' }}>O(√n)</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Space Complexity</span>
                                    <span style={{ color: '#6366f1' }}>O(1)</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Data Requirement</span>
                                    <span style={{ color: '#fbbf24' }}>Sorted Array</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DualView>
    );
};

export default JumpSearchVisualizer;
