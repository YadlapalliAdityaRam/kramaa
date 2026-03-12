import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateBucketSortSteps } from '../algorithms/sorting/bucketSort';
import { FaRandom, FaPlus, FaMinus } from 'react-icons/fa';
import './BucketSortVisualizer.css';

const MAX_ARRAY_SIZE = 15;
const MIN_ARRAY_SIZE = 5;

const BucketSortVisualizer = () => {
    const [array, setArray] = useState([]);
    const [bucketCount, setBucketCount] = useState(5);
    const [inputString, setInputString] = useState('');
    const [isAscending, setIsAscending] = useState(true);

    const [steps, setSteps] = useState([]);

    const {
        currentStepIndex,
        isPlaying,
        speed,
        play,
        pause,
        stepForward,
        stepBackward,
        reset,
        setSpeed,
        totalSteps
    ,
        setIndex
    } = useGenericAnimation(steps);

    const isFinished = currentStepIndex === steps.length - 1 && steps.length > 0;

    const currentStep = steps[currentStepIndex];

    const generateRandomArray = (size = 10, isDecimal = true) => {
        const newArr = [];
        for (let i = 0; i < size; i++) {
            if (isDecimal) {
                // Random decimals between 0.01 and 0.99
                newArr.push(Number((Math.random() * 0.98 + 0.01).toFixed(2)));
            } else {
                newArr.push(Math.floor(Math.random() * 100));
            }
        }
        setArray(newArr);
        setInputString(newArr.join(', '));
        reset();
    };

    useEffect(() => {
        // Init with random decimals
        generateRandomArray(10, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Whenever array or bucket details change, regenerate steps.
    useEffect(() => {
        if (array.length > 0) {
            const newSteps = generateBucketSortSteps(array, bucketCount, isAscending);
            setSteps(newSteps);
        }
    }, [array, bucketCount, isAscending, setSteps]);

    const handleInputStringChange = (e) => {
        setInputString(e.target.value);
    };

    const applyInputString = () => {
        const parsed = inputString.split(',')
            .map(s => s.trim())
            .filter(s => s !== '')
            .map(Number)
            .filter(n => !isNaN(n));

        if (parsed.length > 0) {
            setArray(parsed);
            reset();
        } else {
            alert('Please enter a valid comma-separated list of numbers.');
        }
    };

    const handleBucketCountChange = (delta) => {
        setBucketCount(prev => {
            const newVal = prev + delta;
            if (newVal >= 2 && newVal <= 10) return newVal;
            return prev;
        });
        reset();
    };

    const renderArray = () => {
        // If sorting started, show the snapshot. Otherwise show raw base array.
        const arrToRender = currentStep?.arraySnapshot || array;
        const activeIndices = currentStep?.activeIndices || [];
        const sortedIndices = currentStep?.sortedIndices || [];

        return (
            <div className="bs-main-array">
                <AnimatePresence>
                    {arrToRender.map((val, idx) => {
                        let stateClass = 'default';
                        if (activeIndices.includes(idx)) {
                            stateClass = 'active'; // Scatter/Gather target
                        } else if (sortedIndices.includes(idx)) {
                            stateClass = 'sorted';
                        }

                        // Treat nulls as empty placeholders for visually "removing" items
                        const isEmpty = val === null || val === undefined;

                        return (
                            <motion.div
                                key={`arr-${idx}-${val}`}
                                layout
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className={`bs-array-box bs-box-${isEmpty ? 'empty' : stateClass}`}
                            >
                                {!isEmpty ? val : ''}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        );
    };

    const renderBuckets = () => {
        // Initial state or active step snapshot
        let bucketsToRender = currentStep?.bucketsSnapshot;
        if (!bucketsToRender) {
            bucketsToRender = Array.from({ length: bucketCount }, () => []);
        }

        const activeBuckets = currentStep?.activeBuckets || [];

        return (
            <div className="bs-buckets-container">
                {bucketsToRender.map((bucket, bIdx) => {
                    const isActiveBucket = activeBuckets.includes(bIdx);
                    let bucketClass = 'default';

                    if (isActiveBucket && currentStep.type === 'scatter') bucketClass = 'receiving';
                    else if (isActiveBucket && currentStep.type.startsWith('sort')) bucketClass = 'sorting';
                    else if (isActiveBucket && currentStep.type.startsWith('gather')) bucketClass = 'gathering';
                    else if (isActiveBucket && currentStep.type === 'bucket-sorted') bucketClass = 'sorted';

                    return (
                        <div key={`bucket-${bIdx}`} className={`bs-bucket bs-bucket-${bucketClass}`}>
                            <div className="bs-bucket-header">Bucket {bIdx}</div>
                            <div className="bs-bucket-contents">
                                <AnimatePresence>
                                    {bucket.map((val, vIdx) => {
                                        let itemClass = 'default';

                                        // If sorting internally, highlight comparisons/swaps
                                        if (isActiveBucket && currentStep.activeBucketItems) {
                                            if (currentStep.activeBucketItems.includes(vIdx)) {
                                                itemClass = currentStep.type === 'compare' ? 'comparing' : 'swapping';
                                            }
                                        }

                                        return (
                                            <motion.div
                                                key={`b-${bIdx}-v-${val}-${vIdx}`}
                                                layout
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                                className={`bs-bucket-item bs-item-${itemClass}`}
                                            >
                                                {val}
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <DualView
            algorithmName="Bucket Sort"
            language="javascript"
            codeSnippetCategory="sorting"
            description={
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <span className="step-badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '4px 10px', borderRadius: '12px' }}>
                        Step {currentStepIndex + 1} / {steps.length || 1}
                    </span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {currentStep?.description || 'Ready to start'}
                    </span>
                </div>
            }
        >
            <div className="bs-layout">
                <div className="bs-controls-panel">
                    <div className="bs-input-group">
                        <label>Input Array (comma separated):</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                value={inputString}
                                onChange={handleInputStringChange}
                                placeholder="e.g. 0.78, 0.17, 0.39"
                                className="bs-input"
                                disabled={isPlaying}
                            />
                            <button className="bs-btn bs-apply-btn" onClick={applyInputString} disabled={isPlaying}>
                                Apply
                            </button>
                        </div>
                    </div>

                    <div className="bs-toolbar">
                        <div className="bs-tool-group">
                            <span>Random:</span>
                            <button className="bs-btn bs-icon-btn" onClick={() => generateRandomArray(10, true)} title="Random Decimals" disabled={isPlaying}>
                                <FaRandom /> [0, 1)
                            </button>
                            <button className="bs-btn bs-icon-btn" onClick={() => generateRandomArray(10, false)} title="Random Integers" disabled={isPlaying}>
                                <FaRandom /> Integers
                            </button>
                        </div>

                        <div className="bs-tool-group">
                            <span>Buckets:</span>
                            <div className="bs-counter">
                                <button className="bs-counter-btn" onClick={() => handleBucketCountChange(-1)} disabled={isPlaying || bucketCount <= 2}><FaMinus /></button>
                                <div className="bs-counter-val">{bucketCount}</div>
                                <button className="bs-counter-btn" onClick={() => handleBucketCountChange(1)} disabled={isPlaying || bucketCount >= 10}><FaPlus /></button>
                            </div>
                        </div>

                        <div className="bs-tool-group">
                            <span>Order:</span>
                            <button
                                className={`bs-btn ${isAscending ? 'active' : ''}`}
                                onClick={() => { setIsAscending(true); reset(); }}
                                disabled={isPlaying}
                            >
                                Asc
                            </button>
                            <button
                                className={`bs-btn ${!isAscending ? 'active' : ''}`}
                                onClick={() => { setIsAscending(false); reset(); }}
                                disabled={isPlaying}
                            >
                                Desc
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bs-visualization-area">
                    <div className="bs-section-title">Main Array</div>
                    {renderArray()}

                    <div className="bs-divider">
                        <div className="bs-divider-line"></div>
                        <span>Distribution Mapping (index = floor(k * val))</span>
                        <div className="bs-divider-line"></div>
                    </div>

                    <div className="bs-section-title">Buckets ({bucketCount})</div>
                    {renderBuckets()}
                </div>

                <AnimationControls
                    onPlay={play}
                    onPause={pause}
                    onStepForward={stepForward}
                    onStepBackward={stepBackward}
                    onReset={reset}
                    onSpeedChange={setSpeed}
                    isPlaying={isPlaying}
                    speed={speed}
                    currentStep={currentStepIndex}
                    totalSteps={totalSteps}
                    onScrub={setIndex}
                    inputType="none"
                />
            </div>

        </DualView>
    );
};

export default BucketSortVisualizer;
