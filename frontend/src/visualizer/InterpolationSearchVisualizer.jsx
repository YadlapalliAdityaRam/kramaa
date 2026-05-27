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

const EXAMPLES = [
    { label: 'Example 1', array: [10, 20, 30, 40, 50, 60, 70], target: 50 },
    { label: 'Example 2', array: [5, 10, 15, 20, 25, 30], target: 25 }
];

const createUniformArray = () => {
    const length = Math.floor(Math.random() * 5) + 8;
    const start = Math.floor(Math.random() * 10) + 5;
    const step = Math.floor(Math.random() * 6) + 5;
    return Array.from({ length }, (_, index) => start + index * step);
};

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
        const sortedArr = [...new Set(parsedArr)].sort((a, b) => a - b);
        setArrayData(sortedArr);
        setActiveTarget(parsedTarget);
        toast.success("Array and Target applied. Array sorted.");
    };

    const handleRandomize = () => {
        const randomArr = createUniformArray();
        const randomTarget = randomArr[Math.floor(Math.random() * randomArr.length)];
        
        setArrayData(randomArr);
        setActiveTarget(randomTarget);
        setInputVal(randomArr.join(', '));
        setTargetVal(randomTarget.toString());
        toast.success("Generated a uniformly distributed demo array.");
    };

    const loadExample = (example) => {
        setArrayData(example.array);
        setActiveTarget(example.target);
        setInputVal(example.array.join(', '));
        setTargetVal(example.target.toString());
        toast.success(`${example.label} loaded.`);
    };

    const codeSnippet = algorithmCodes.interpolationSearch?.[activeLanguage] || '';

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'estimate': return 4;
            case 'compare': return 6;
            case 'found': return 7;
            case 'move-left': return 8;
            case 'move-right': return 9;
            case 'not-found': return 11;
            case 'compare-single': return 7;
            default: return 0;
        }
    };

    const currentArray = currentStep?.arraySnapshot || arrayData;
    const { low, high, pos, type, formula, searchRangeIndices = [], discardedIndices = [], comparison, decision } = currentStep || {};
    
    // Safety check for UI rendering if properties don't exist yet
    const safeLow = low !== undefined && low !== null ? low : -1;
    const safeHigh = high !== undefined && high !== null ? high : -1;
    const safePos = pos !== undefined && pos !== null ? pos : -1;
    const safeCompared = Number.isInteger(currentStep?.comparedIndex) ? currentStep.comparedIndex : -1;
    const safeFound = Number.isInteger(currentStep?.foundIndex) ? currentStep.foundIndex : -1;
    const rangeSize = searchRangeIndices.length;

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
                    <div className="interp-example-row">
                        {EXAMPLES.map((example) => (
                            <button
                                key={example.label}
                                className="interp-btn btn-example"
                                onClick={() => loadExample(example)}
                            >
                                {example.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="interp-visual-workspace">
                    <div className="interp-top-hud">
                        <div className="interp-range-board">
                            <div className="interp-range-card low-card">
                                <span>Low</span>
                                <strong>{safeLow !== -1 ? `${safeLow} (${currentArray[safeLow]})` : '—'}</strong>
                            </div>
                            <div className="interp-range-card high-card">
                                <span>High</span>
                                <strong>{safeHigh !== -1 ? `${safeHigh} (${currentArray[safeHigh]})` : '—'}</strong>
                            </div>
                            <div className="interp-range-card pos-card">
                                <span>Estimated Pos</span>
                                <strong>{safePos !== -1 ? `${safePos}${safeCompared !== -1 ? ` (${currentArray[safePos]})` : ''}` : '—'}</strong>
                            </div>
                            <div className="interp-range-card range-card">
                                <span>Range Size</span>
                                <strong>{rangeSize || 0}</strong>
                            </div>
                        </div>
                        <div className="interp-math-board">
                            <div className="math-title">Estimation Formula</div>
                            {formula ? (
                                <div className="math-equation active-math">
                                    pos = {formula.low} + &lfloor; (({activeTarget} - {formula.lowValue}) &times; ({formula.high} - {formula.low})) / ({formula.highValue} - {formula.lowValue}) &rfloor; = <strong>{formula.pos}</strong>
                                </div>
                            ) : (
                                <div className="math-equation dim-math">
                                    pos = low + &lfloor; ((target - arr[low]) &times; (high - low)) / (arr[high] - arr[low]) &rfloor;
                                </div>
                            )}
                            {formula && (
                                <div className="interp-formula-breakdown">
                                    <span>Numerator: {formula.numerator}</span>
                                    <span>Denominator: {formula.denominator}</span>
                                    <span>Uniform data makes this estimate more accurate.</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="interp-status-strip">
                        <div className="interp-status-card">
                            <span>Comparison</span>
                            <strong>{comparison || 'Waiting for probe...'}</strong>
                        </div>
                        <div className="interp-status-card">
                            <span>Decision</span>
                            <strong>{decision || 'Search has not started yet.'}</strong>
                        </div>
                        <div className="interp-status-card">
                            <span>Search Window</span>
                            <strong>{safeLow !== -1 && safeHigh !== -1 ? `[${safeLow}..${safeHigh}]` : 'invalid / complete'}</strong>
                        </div>
                    </div>

                    <div className="interp-main-array">
                        <AnimatePresence>
                            {currentArray.map((val, idx) => {
                                let boxClass = 'interp-box';
                                
                                const isOut = discardedIndices.includes(idx);
                                const isLow = idx === safeLow;
                                const isHigh = idx === safeHigh && safeLow !== safeHigh;
                                const isEstimate = idx === safePos && type === 'estimate';
                                const isCompare = idx === safeCompared && (type === 'compare' || type === 'compare-single');
                                const isFound = idx === safeFound || (type === 'found' && idx === safePos);
                                const badges = [];

                                if (isOut) {
                                    boxClass += ' out-box';
                                } else if (isFound) {
                                    boxClass += ' found-box';
                                } else if (isCompare) {
                                    boxClass += ' compare-box';
                                } else if (isEstimate) {
                                    boxClass += ' estimate-box';
                                } else if (isLow) {
                                    boxClass += ' low-box';
                                } else if (isHigh) {
                                    boxClass += ' high-box';
                                } else {
                                    boxClass += ' default-box';
                                }

                                if (isLow) badges.push({ label: 'Low', className: 'low-lbl' });
                                if (isHigh) badges.push({ label: 'High', className: 'high-lbl' });
                                if (isEstimate) badges.push({ label: 'Estimated', className: 'estimate-lbl' });
                                if (isCompare) badges.push({ label: 'Compare', className: 'compare-lbl' });
                                if (isFound) badges.push({ label: 'Found', className: 'found-lbl' });

                                return (
                                    <div key={`item-${idx}`} className="interp-item-wrapper">
                                        {badges.length > 0 && (
                                            <div className="interp-status-stack">
                                                {badges.map((badge) => (
                                                    <div key={`${idx}-${badge.label}`} className={`interp-status-label ${badge.className}`}>
                                                        {badge.label}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <motion.div 
                                            className={boxClass}
                                            animate={{
                                                y: isEstimate || isCompare || isFound ? -14 : 0,
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
                        <div className="leg-item"><span className="dot yellow"></span> Estimated Position</div>
                        <div className="leg-item"><span className="dot purple"></span> Compared Element</div>
                        <div className="leg-item"><span className="dot green"></span> Target Found</div>
                        <div className="leg-item"><span className="dot gray"></span> Discarded Range</div>
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
                                Interpolation Search does not always probe the middle. It estimates where the target should be based on its value, so large targets probe closer to the end and small targets probe closer to the start.
                            </p>
                            <h3 style={{ marginTop: '16px' }}>The Probe Formula</h3>
                            <p>
                                The formula uses the current low value, high value, and target value to predict an index. When the array is uniformly distributed, the yellow estimate lands close to the real answer and the search range shrinks quickly.
                            </p>
                        </div>
                        <div className="cs-edu-section">
                            <h3>Complexity</h3>
                            <div className="cs-complexity-bubble">
                                <div className="cs-complexity-item">
                                    <span>Time (Best)</span>
                                    <span style={{ color: '#34d399' }}>O(log log n)</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Time (Average)</span>
                                    <span style={{ color: '#34d399' }}>O(log log n)</span>
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
                            <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>
                                Interpolation Search works best when values are spread evenly, because the estimated position is usually close to the target.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </DualView>
    );
};

export default InterpolationSearchVisualizer;
