import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateBucketSortSteps } from '../algorithms/sorting/bucketSort';
import { algorithmCodes } from '../data/algorithmCodes';
import { FaRandom, FaPlus, FaMinus, FaCheck, FaRedo } from 'react-icons/fa';
import './BucketSortVisualizer.css';

const BucketSortVisualizer = () => {
    const [array, setArray]               = useState([]);
    const [bucketCount, setBucketCount]   = useState(5);
    const [inputString, setInputString]   = useState('');
    const [isAscending, setIsAscending]   = useState(true);
    const [activeLanguage, setActiveLanguage] = useState('javascript');

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
        totalSteps,
        setIndex
    } = useGenericAnimation(steps);

    const currentStep = steps[currentStepIndex];

    const generateRandomArray = (size = 10, isDecimal = true) => {
        const newArr = [];
        for (let i = 0; i < size; i++) {
            if (isDecimal) {
                newArr.push(Number((Math.random() * 0.98 + 0.01).toFixed(2)));
            } else {
                newArr.push(Math.floor(Math.random() * 90) + 10);
            }
        }
        setArray(newArr);
        setInputString(newArr.join(', '));
        reset();
    };

    useEffect(() => {
        generateRandomArray(10, true);
    }, []);

    useEffect(() => {
        if (array.length > 0) {
            const newSteps = generateBucketSortSteps(array, bucketCount, isAscending);
            setSteps(newSteps);
        }
    }, [array, bucketCount, isAscending]);

    const applyInputString = () => {
        const parsed = inputString.split(',')
            .map(s => s.trim())
            .filter(s => s !== '')
            .map(Number)
            .filter(n => !isNaN(n));

        if (parsed.length > 0) {
            setArray(parsed);
            reset();
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

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'scatter': return 9;
            case 'sort':    return 13;
            case 'gather':  return 14;
            case 'done':    return 14;
            default:        return 0;
        }
    };

    const codeSnippet = algorithmCodes.bucketSort?.[activeLanguage] || "";

    const renderArray = () => {
        const arrToRender = currentStep?.arraySnapshot || array;
        const activeIndices = currentStep?.activeIndices || [];
        const sortedIndices = currentStep?.sortedIndices || [];

        return (
            <div className="bkt-main-array">
                <AnimatePresence mode="popLayout">
                    {arrToRender.map((val, idx) => {
                        let stateClass = 'default';
                        if (activeIndices.includes(idx)) {
                            stateClass = 'active';
                        } else if (sortedIndices.includes(idx)) {
                            stateClass = 'sorted';
                        }

                        return (
                            <motion.div
                                key={`${idx}-${val}`}
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.25 }}
                                className={`bkt-arr-item ${stateClass}`}
                            >
                                <span className="bkt-val">{val}</span>
                                <span className="bkt-idx">[{idx}]</span>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        );
    };

    const renderBuckets = () => {
        const bucketsToRender = currentStep?.bucketsSnapshot || Array.from({ length: bucketCount }, () => []);
        const activeBucketIdx = currentStep?.activeBucketIndex;

        return (
            <div className="bkt-buckets-grid">
                {bucketsToRender.map((bucket, bIdx) => {
                    const isActive = activeBucketIdx === bIdx;

                    return (
                        <div key={`bkt-${bIdx}`} className={`bkt-bucket-card ${isActive ? 'active-bucket' : ''}`}>
                            <div className="bkt-header-label">
                                Bucket {bIdx}
                                <span className="bkt-count">{bucket.length}</span>
                            </div>
                            <div className="bkt-items-container">
                                <AnimatePresence mode="popLayout">
                                    {bucket.map((item, itemIdx) => (
                                        <motion.div
                                            key={`${bIdx}-${itemIdx}-${item}`}
                                            layout
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bkt-item-chip"
                                        >
                                            {item}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {bucket.length === 0 && <span className="bkt-empty-text">Empty</span>}
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
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            codeSnippetCategory="sorting"
            description={
                <div className="bkt-desc-wrapper">
                    <span className="bkt-badge">Distribution Sort O(N + K)</span>
                    <span className="bkt-desc-text">
                        {currentStep?.description || "Press Play to observe Scatter -> Sort -> Gather bucket distribution."}
                    </span>
                </div>
            }
        >
            <div className="bkt-visualizer-wrapper">

                {/* ── Top Input Panel ──────────────────────────────────────── */}
                <div className="bkt-input-panel">
                    <div className="bkt-input-group">
                        <label className="bkt-input-label">Custom Array:</label>
                        <input
                            type="text"
                            value={inputString}
                            onChange={(e) => setInputString(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyInputString()}
                            placeholder="0.42, 0.32, 0.23, 0.52"
                            className="bkt-text-input"
                        />
                        <button onClick={applyInputString} className="bkt-btn bkt-btn-primary">
                            <FaCheck /> Apply
                        </button>
                    </div>

                    <div className="bkt-input-group">
                        <label className="bkt-input-label">Buckets ({bucketCount}):</label>
                        <button onClick={() => handleBucketCountChange(-1)} className="bkt-btn mini">
                            <FaMinus />
                        </button>
                        <button onClick={() => handleBucketCountChange(1)} className="bkt-btn mini">
                            <FaPlus />
                        </button>
                    </div>

                    <div className="bkt-btn-group">
                        <button onClick={() => generateRandomArray(10, true)} className="bkt-btn bkt-btn-secondary">
                            <FaRandom /> Decimals
                        </button>
                        <button onClick={() => generateRandomArray(10, false)} className="bkt-btn bkt-btn-secondary">
                            <FaRandom /> Integers
                        </button>
                        <button onClick={() => generateRandomArray(10, true)} className="bkt-btn bkt-btn-outline">
                            <FaRedo /> Reset
                        </button>
                    </div>
                </div>

                {/* ── Main Canvas Stage: Input Array & Buckets ──────────────── */}
                <div className="bkt-canvas-wrapper">
                    <div className="bkt-stage-card">
                        <div className="bkt-card-title">Main Array Snapshot</div>
                        {renderArray()}
                    </div>

                    <div className="bkt-stage-card">
                        <div className="bkt-card-title">Buckets ({bucketCount})</div>
                        {renderBuckets()}
                    </div>
                </div>

                {/* ── YouTube Video Player Controls ────────────────────── */}
                <div className="bkt-controls-wrapper">
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
                        totalSteps={totalSteps}
                        onScrub={setIndex}
                    />
                </div>

            </div>
        </DualView>
    );
};

export default BucketSortVisualizer;
