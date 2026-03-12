import React, { useState, useMemo, useEffect } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateSentinelLinearSearchSteps } from '../algorithms/searching/sentinelLinearSearch';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { FaPlay, FaRandom } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import './SentinelLinearSearchVisualizer.css';

const SentinelLinearSearchVisualizer = () => {
    const defaultArray = [4, 8, 15, 16, 23, 42];
    const [inputVal, setInputVal] = useState('4, 8, 15, 16, 23, 42');
    const [targetVal, setTargetVal] = useState('16');
    const [arrayData, setArrayData] = useState(defaultArray);
    const [activeTarget, setActiveTarget] = useState(16);
    const [activeLanguage, setActiveLanguage] = useState('javascript');

    const steps = useMemo(() => generateSentinelLinearSearchSteps(arrayData, activeTarget), [arrayData, activeTarget]);

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

        if (parsedArr.length < 2) {
            toast.error("Please enter at least 2 numbers for the array.");
            return;
        }
        if (isNaN(parsedTarget)) {
            toast.error("Please enter a valid target number.");
            return;
        }
        
        setArrayData(parsedArr);
        setActiveTarget(parsedTarget);
        toast.success("Array and Target applied.");
    };

    const handleRandomize = () => {
        const randomArr = Array.from({ length: 8 }, () => Math.floor(Math.random() * 100) + 1);
        // 70% chance to pick a number from the array, 30% to pick a completely random one
        const randomTarget = Math.random() > 0.3 
            ? randomArr[Math.floor(Math.random() * (randomArr.length - 1))] // Avoid picking the last element as target for better demo
            : Math.floor(Math.random() * 100) + 1;
        
        setArrayData(randomArr);
        setActiveTarget(randomTarget);
        setInputVal(randomArr.join(', '));
        setTargetVal(randomTarget.toString());
        toast.success("Randomized array and target");
    };

    const codeSnippet = algorithmCodes.sentinelLinearSearch?.[activeLanguage] || '';

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'sentinel-placed': return 4;
            case 'scan': return 7;
            case 'loop-stopped': return 10;
            case 'found': return 13;
            case 'not-found': return 16;
            default: return 0;
        }
    };

    const currentArray = currentStep?.arraySnapshot || arrayData;
    const { currentIndex, sentinelIndex, foundIndex, type, target } = currentStep || {};

    return (
        <DualView
            algorithmName="Sentinel Linear Search"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={currentStep?.description || "Temporarily overwrites the last array element with the target to avoid checking array bounds on every step."}
        >
            <div className="sentinel-container">
                <div className="sentinel-input-bar">
                    <div className="sentinel-input-group">
                        <label>Array:</label>
                        <input
                            type="text"
                            className="sentinel-value-input"
                            value={inputVal}
                            onChange={(e) => setInputVal(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleApply()}
                            placeholder="e.g. 4, 8, 15, 16, 23, 42"
                            style={{width: '280px'}}
                        />
                    </div>
                    <div className="sentinel-input-group">
                        <label>Target:</label>
                        <input
                            type="number"
                            className="sentinel-value-input"
                            style={{ width: '80px' }}
                            value={targetVal}
                            onChange={(e) => setTargetVal(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleApply()}
                        />
                    </div>
                    <button className="sentinel-btn btn-primary" onClick={handleApply}>
                        <FaPlay style={{fontSize: '0.8rem'}} /> Search
                    </button>
                    <button className="sentinel-btn btn-secondary" onClick={handleRandomize}>
                        <FaRandom /> Random
                    </button>
                </div>

                <div className="sentinel-visual-workspace">
                    <div className="sentinel-top-hud">
                        <div className="sentinel-info-board">
                           Target: <strong>{target !== undefined ? target : activeTarget}</strong>
                        </div>
                    </div>

                    <div className="sentinel-main-array">
                        <AnimatePresence>
                            {currentArray.map((val, idx) => {
                                let boxClass = 'sentinel-box';
                                let statusLabel = null;
                                
                                const isSentinel = idx === sentinelIndex;
                                const isCurrent = idx === currentIndex;
                                const isFound = idx === foundIndex;
                                const isDiscarded = type !== 'info' && (!isSentinel && !isCurrent && !isFound && currentIndex !== null && idx < currentIndex);
                                
                                if (isDiscarded) {
                                    boxClass += ' discarded-box';
                                } else if (isFound) {
                                    boxClass += ' found-box';
                                    statusLabel = 'Match!';
                                } else if (isCurrent) {
                                    boxClass += ' scan-box';
                                    statusLabel = 'Scan';
                                } else if (isSentinel) {
                                    boxClass += ' sentinel-node-box';
                                    statusLabel = 'Sentinel';
                                } else {
                                    boxClass += ' default-box';
                                }

                                return (
                                    <div key={`item-${idx}`} className="sentinel-item-wrapper">
                                        {statusLabel && (
                                            <div className={`sentinel-status-label ${isFound ? 'found-lbl' : isSentinel ? 'sentinel-lbl' : isCurrent ? 'scan-lbl' : ''}`}>
                                                {statusLabel}
                                            </div>
                                        )}
                                        <motion.div 
                                            className={boxClass}
                                            animate={{
                                                y: isCurrent ? -15 : (isSentinel ? -5 : 0),
                                                scale: isFound ? 1.05 : 1
                                            }}
                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                        >
                                            <span className="sentinel-val">{val}</span>
                                        </motion.div>
                                        <div className="sentinel-idx">{idx}</div>
                                    </div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="sentinel-footer">
                    <div className="sentinel-legend">
                        <div className="leg-item"><span className="dot yellow"></span> Scanning</div>
                        <div className="leg-item"><span className="dot purple"></span> Sentinel Boundary</div>
                        <div className="leg-item"><span className="dot green"></span> Target Found</div>
                    </div>
                </div>

                <div className="sentinel-controls-wrapper">
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
                                Sentinel Linear Search is an optimized version of the standard Linear Search algorithm. 
                                In standard linear search, the condition to check if the current index is out of bounds is evaluated in every iteration of the loop.
                            </p>
                            <h3 style={{ marginTop: '16px' }}>The "Sentinel"</h3>
                            <p>
                                The optimization is to temporarily replace the last element of the array with the target value (the sentinel). 
                                This guarantees the search will find the target without needing an out-of-bounds check in the inner loop, saving one comparison per iteration.
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
                                    <span style={{ color: '#f87171' }}>O(n)</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Time (Worst)</span>
                                    <span style={{ color: '#f87171' }}>O(n)</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Space Complexity</span>
                                    <span style={{ color: '#6366f1' }}>O(1)</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Optimization Level</span>
                                    <span style={{ color: '#34d399' }}>Micro-optimization</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DualView>
    );
};

export default SentinelLinearSearchVisualizer;
