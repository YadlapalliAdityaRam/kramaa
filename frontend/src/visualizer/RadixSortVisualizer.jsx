import React, { useState, useMemo, useEffect } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateRadixSortSteps } from '../algorithms/sorting/radixSort';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { FaPlay, FaRandom, FaSortAmountUp } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import './RadixSortVisualizer.css';

const RadixSortVisualizer = () => {
    const [inputVal, setInputVal] = useState('170, 45, 75, 90, 802, 24, 2, 66');
    const [arrayData, setArrayData] = useState([170, 45, 75, 90, 802, 24, 2, 66]);
    const [activeLanguage, setActiveLanguage] = useState('javascript');

    const steps = useMemo(() => generateRadixSortSteps(arrayData, true), [arrayData]);

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
        const parsed = inputVal.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n >= 0);
        if (parsed.length === 0) {
            toast.error("Please enter valid positive numbers separated by commas.");
            return;
        }
        if (parsed.length > 15) {
            toast.error("Maximum 15 elements allowed for clear visualization.");
            return;
        }
        setArrayData(parsed);
        toast.success("Array applied");
    };

    const handleRandomize = () => {
        const randomArr = Array.from({ length: 8 }, () => {
             const digits = Math.floor(Math.random() * 3) + 1; // 1 to 3 digit numbers
             if (digits === 1) return Math.floor(Math.random() * 10);
             if (digits === 2) return Math.floor(Math.random() * 90) + 10;
             return Math.floor(Math.random() * 900) + 100;
        });
        setArrayData(randomArr);
        setInputVal(randomArr.join(', '));
        toast.success("Array randomized");
    };

    const codeSnippet = algorithmCodes.radixSort?.[activeLanguage] || '';

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'info': return 9;
            case 'evaluate': return 16;
            case 'distributed': return 17;
            case 'collecting': return 21;
            case 'collected': return 23;
            case 'pass-complete': return 25;
            default: return 0;
        }
    };

    const buckets = currentStep?.buckets || Array.from({length: 10}, () => []);
    const viewingArr = currentStep?.viewingArray || currentStep?.arraySnapshot || arrayData;
    const activeDiv = currentStep?.activeDivisor || 1;

    // Helper to render a number, highlighting the active digit
    const renderDigitNumber = (num, highlighted) => {
        if (num === null || num === undefined) return null;
        if (!highlighted || currentStep?.isPassEnd || currentStep?.sortedIndices) return num; // Just string
        
        const numStr = num.toString();
        // Calculate which character index represents the current active place
        // Divisor 1 (ones) -> last char. Divisor 10 (tens) -> 2nd to last char, etc.
        const exponent = Math.round(Math.log10(activeDiv));
        const charIdx = numStr.length - 1 - exponent;

        if (charIdx < 0) {
            // Implicit 0
            return (
                <span className="padded-num">
                    <span className="active-digit-high">0</span>{numStr}
                </span>
            );
        }

        return (
            <span>
                {numStr.substring(0, charIdx)}
                <span className="active-digit-high">{numStr[charIdx]}</span>
                {numStr.substring(charIdx + 1)}
            </span>
        );
    };

    return (
        <DualView
            algorithmName="Radix Sort"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={currentStep?.description || "Sort numbers digit by digit using Bucket Sort securely."}
        >
            <div className="rs-container">
                <div className="rs-input-bar">
                    <div className="rs-input-group">
                        <label>Numbers:</label>
                        <input
                            type="text"
                            className="rs-value-input"
                            value={inputVal}
                            onChange={(e) => setInputVal(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleApply()}
                            placeholder="e.g. 170, 45, 75, 90"
                        />
                    </div>
                    <button className="rs-btn btn-primary" onClick={handleApply}>
                        <FaPlay style={{fontSize: '0.8rem'}} /> Apply
                    </button>
                    <button className="rs-btn btn-secondary" onClick={handleRandomize}>
                        <FaRandom /> Random
                    </button>
                </div>

                <div className="rs-visual-workspace">
                    <div className="panel-label">
                        <FaSortAmountUp /> Main Array
                        {currentStep && currentStep.activeDivisor && !currentStep.sortedIndices && (
                            <span className="active-pass-badge">
                                Active Place: {currentStep.activeDivisor === 1 ? '1s' : currentStep.activeDivisor === 10 ? '10s' : '100s'}
                            </span>
                        )}
                    </div>
                    
                    <div className="rs-main-array">
                        {viewingArr.map((val, idx) => {
                            let boxClass = 'rs-array-box';
                            const isSorted = currentStep?.sortedIndices && currentStep.sortedIndices.includes(idx);
                            const isActive = currentStep?.activeIdx === idx && val !== null;
                            const isTarget = currentStep?.targetIdx === idx;

                            if (isSorted) boxClass += ' sorted-box';
                            else if (isActive && currentStep?.action === 'extracting') boxClass += ' moving-box';
                            else if (isActive && currentStep?.action !== 'extracting') boxClass += ' collecting-box';
                            else if (isTarget) boxClass += ' target-box';
                            else if (val === null) boxClass += ' empty-box';

                            return (
                                <div key={idx} className="rs-array-item">
                                    <div className={boxClass}>
                                        {val !== null ? renderDigitNumber(val, true) : ''}
                                    </div>
                                    <div className="rs-array-idx">{idx}</div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="panel-label" style={{marginTop: '2rem'}}>
                        Distribution Buckets (0-9)
                    </div>

                    <div className="rs-buckets-grid">
                        {buckets.map((bktArr, bNum) => {
                            let bktClass = 'rs-bucket';
                            if (currentStep?.activeBucket === bNum) bktClass += ' bucket-active';
                            if (currentStep?.sourceBucket === bNum) bktClass += ' bucket-collecting';

                            return (
                                <div key={bNum} className="rs-bucket-col">
                                    <div className={bktClass}>
                                        <div className="bucket-label">{bNum}</div>
                                        <div className="bucket-contents">
                                            {bktArr.map((bVal, i) => (
                                                <motion.div 
                                                    key={`${bNum}-${i}-${bVal}`} 
                                                    className="rs-bucket-val"
                                                    initial={{ opacity: 0, y: -20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    {renderDigitNumber(bVal, false)}
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="rs-footer">
                    <div className="rs-legend">
                        <div className="leg-item">
                            <span className="digit-sample">7<span className="active-digit-high">5</span>2</span> Active Digit
                        </div>
                        <div className="leg-item"><span className="dot orange"></span> Evaluating / Moving</div>
                        <div className="leg-item"><span className="dot blue"></span> Target Bucket</div>
                        <div className="leg-item"><span className="dot green"></span> Sorted Complete</div>
                    </div>
                </div>

                <div className="rs-controls-wrapper">
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
                                Radix Sort is a non-comparative sorting algorithm. It avoids comparison by creating and 
                                distributing elements into buckets according to their radix (base). 
                            </p>
                            <h3 style={{ marginTop: '16px' }}>Digit by Digit</h3>
                            <p>
                                For elements with multiple significant digits, the bucketing process is repeated for each digit, 
                                starting from the least significant digit (LSD) up to the most significant digit (MSD). 
                                Because it uses a stable sort (like counting sort or bucket sort) internally, the numbers 
                                end up completely sorted.
                            </p>
                        </div>
                        <div className="cs-edu-section">
                            <h3>Complexity</h3>
                            <div className="cs-complexity-bubble">
                                <div className="cs-complexity-item">
                                    <span>Time (Best)</span>
                                    <span style={{ color: '#34d399' }}>O(nk)</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Time (Average)</span>
                                    <span style={{ color: '#fbbf24' }}>O(nk)</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Time (Worst)</span>
                                    <span style={{ color: '#f87171' }}>O(nk)</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Space Complexity</span>
                                    <span style={{ color: '#fbbf24' }}>O(n + k)</span>
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

export default RadixSortVisualizer;
