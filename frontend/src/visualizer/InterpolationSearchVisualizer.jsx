import React, { useState, useMemo, useEffect } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateInterpolationSearchSteps } from '../algorithms/searching/interpolationSearch';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { FaPlay, FaRandom } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import './InterpolationSearchVisualizer.css';

const InterpolationSearchVisualizer = () => {
    const [inputVal, setInputVal] = useState('10, 20, 30, 40, 50, 60, 70');
    const [targetVal, setTargetVal] = useState('60');
    const [arrayData, setArrayData] = useState([10, 20, 30, 40, 50, 60, 70]);
    const [activeTarget, setActiveTarget] = useState(60);
    const [activeLanguage, setActiveLanguage] = useState('javascript');

    const steps = useMemo(() => generateInterpolationSearchSteps(arrayData, activeTarget), [arrayData, activeTarget]);

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
        
        // Sorting the array since Interpolation Search requires sorted data
        const sortedArr = [...parsedArr].sort((a, b) => a - b);
        setArrayData(sortedArr);
        setActiveTarget(parsedTarget);
        toast.success("Array and Target applied. Array sorted.");
    };

    const handleRandomize = () => {
        const randomArr = Array.from({ length: 15 }, () => Math.floor(Math.random() * 100) + 1).sort((a, b) => a - b);
        const randomTarget = randomArr[Math.floor(Math.random() * randomArr.length)];
        
        setArrayData(randomArr);
        setActiveTarget(randomTarget);
        setInputVal(randomArr.join(', '));
        setTargetVal(randomTarget.toString());
        toast.success("Randomized array and target");
    };

    const codeSnippet = algorithmCodes.interpolationSearch?.[activeLanguage] || '';

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'calculate': return 5;
            case 'compare': return 6;
            case 'found': return 7;
            case 'narrow': return (step.description.includes('less')) ? 11 : 14;
            case 'not-found': return 19;
            default: return 0;
        }
    };

    const currentArray = currentStep?.arraySnapshot || arrayData;
    const { low, high, pos, type } = currentStep || {};
    
    // Safety check for UI rendering if properties don't exist yet
    const safeLow = low !== undefined && low !== null ? low : -1;
    const safeHigh = high !== undefined && high !== null ? high : -1;
    const safePos = pos !== undefined && pos !== null ? pos : -1;

    return (
        <DualView
            algorithmName="Interpolation Search"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={currentStep?.description || "Estimates the index of the target using a value-based formula."}
        >
            <div className="interp-container">
                <div className="interp-input-bar">
                    <div className="interp-input-group">
                        <label>Sorted Array:</label>
                        <input
                            type="text"
                            className="interp-value-input"
                            value={inputVal}
                            onChange={(e) => setInputVal(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleApply()}
                            placeholder="10, 20, 30..."
                            style={{width: '240px'}}
                        />
                    </div>
                    <div className="interp-input-group">
                        <label>Target:</label>
                        <input
                            type="number"
                            className="interp-value-input"
                            style={{ width: '80px' }}
                            value={targetVal}
                            onChange={(e) => setTargetVal(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleApply()}
                        />
                    </div>
                    <button className="interp-btn btn-primary" onClick={handleApply}>
                        <FaPlay style={{fontSize: '0.8rem'}} /> Search
                    </button>
                    <button className="interp-btn btn-secondary" onClick={handleRandomize}>
                        <FaRandom /> Random
                    </button>
                </div>

                <div className="interp-visual-workspace">
                    <div className="interp-top-hud">
                        <div className="interp-math-board">
                            <div className="math-title">Estimation Formula</div>
                            {safeLow !== -1 && safeHigh !== -1 && safePos !== -1 && type === 'calculate' ? (
                                <div className="math-equation active-math">
                                    pos = {safeLow} + &lfloor; (({activeTarget} - {currentArray[safeLow]}) &times; ({safeHigh} - {safeLow})) / ({currentArray[safeHigh]} - {currentArray[safeLow]}) &rfloor; = <strong>{safePos}</strong>
                                </div>
                            ) : (
                                <div className="math-equation dim-math">
                                    pos = low + &lfloor; ((target - arr[low]) &times; (high - low)) / (arr[high] - arr[low]) &rfloor;
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="interp-main-array">
                        <AnimatePresence>
                            {currentArray.map((val, idx) => {
                                let boxClass = 'interp-box';
                                let statusLabel = null;
                                
                                const isOut = (safeLow !== -1 && idx < safeLow) || (safeHigh !== -1 && idx > safeHigh);
                                const isLow = idx === safeLow;
                                const isHigh = idx === safeHigh && safeLow !== safeHigh;
                                const isProbe = idx === safePos;
                                const isFound = type === 'found' && idx === safePos;

                                if (isOut) {
                                    boxClass += ' out-box';
                                } else if (isFound) {
                                    boxClass += ' found-box';
                                    statusLabel = 'Target Found!';
                                } else if (isProbe) {
                                    boxClass += ' probe-box';
                                    statusLabel = 'pos (Probe)';
                                } else if (isLow) {
                                    boxClass += ' low-box';
                                    statusLabel = 'Low';
                                } else if (isHigh) {
                                    boxClass += ' high-box';
                                    statusLabel = 'High';
                                } else {
                                    boxClass += ' default-box';
                                }

                                return (
                                    <div key={`item-${idx}`} className="interp-item-wrapper">
                                        {statusLabel && (
                                            <div className={`interp-status-label ${isProbe ? 'probe-lbl' : isLow ? 'low-lbl' : isHigh ? 'high-lbl' : isFound ? 'found-lbl' : ''}`}>
                                                {statusLabel}
                                            </div>
                                        )}
                                        <motion.div 
                                            className={boxClass}
                                            animate={{
                                                y: isProbe && type !== 'calculate' ? -15 : 0,
                                                scale: isFound ? 1.05 : 1
                                            }}
                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                        >
                                            <span className="interp-val">{val}</span>
                                        </motion.div>
                                        <div className="interp-idx">{idx}</div>
                                    </div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="interp-footer">
                    <div className="interp-legend">
                        <div className="leg-item"><span className="dot blue"></span> Low Pointer</div>
                        <div className="leg-item"><span className="dot orange"></span> High Pointer</div>
                        <div className="leg-item"><span className="dot yellow"></span> Estimated Pos</div>
                        <div className="leg-item"><span className="dot green"></span> Target Found</div>
                    </div>
                </div>

                <div className="interp-controls-wrapper">
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
                                Interpolation Search is an improvement over Binary Search for instances, where the values in a sorted array are uniformly distributed. 
                                Binary Search always goes to the middle element to check. On the other hand, interpolation search may go to different locations according to the value of the key being searched.
                            </p>
                            <h3 style={{ marginTop: '16px' }}>The Probe Formula</h3>
                            <p>
                                For example, if the value of the key is closer to the last element, interpolation search is likely to start search toward the end side.
                                The position to be probed is calculated dynamically using a mathematical formula that linearly interpolates the expected position based on the data values.
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
                                    <span style={{ color: '#34d399' }}>O(log(log n))</span>
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
                                    <span>Data Requirement</span>
                                    <span style={{ color: '#fbbf24' }}>Uniformly Sorted</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DualView>
    );
};

export default InterpolationSearchVisualizer;
