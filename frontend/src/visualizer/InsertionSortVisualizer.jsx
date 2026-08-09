import React, { useState, useMemo, useEffect } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateInsertionSortSteps } from '../algorithms/sorting/insertionSort';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { FaRandom, FaCheck, FaSortAmountDown, FaSortAmountUp, FaRedo } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import './InsertionSortVisualizer.css';

const DEFAULT_ARRAY = [8, 3, 5, 2, 9, 1];

const InsertionSortVisualizer = () => {
    const [inputVal, setInputVal]         = useState(DEFAULT_ARRAY.join(', '));
    const [arrayData, setArrayData]       = useState(DEFAULT_ARRAY);
    const [activeLanguage, setActiveLanguage] = useState('javascript');
    const [isAscending, setIsAscending]   = useState(true);

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
        const parsed = inputVal.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
        if (parsed.length === 0) {
            toast.error("Please enter valid numbers.");
            return;
        }
        if (parsed.length > 15) {
            toast.error("Max 15 numbers allowed.");
            return;
        }
        setArrayData(parsed);
        toast.success("Array applied!");
    };

    const handleRandomize = () => {
        const randomArr = Array.from({ length: 8 }, () => Math.floor(Math.random() * 90) + 10);
        setArrayData(randomArr);
        setInputVal(randomArr.join(', '));
        toast.success("Array randomized!");
    };

    const codeSnippet = algorithmCodes.insertionSort?.[activeLanguage] || '';

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'select':   return 3;
            case 'compare':  return 5;
            case 'shift':    return 6;
            case 'no-shift': return 5;
            case 'insert':   return 9;
            case 'completed':return 11;
            default:         return 0;
        }
    };

    const currentArray = currentStep?.arraySnapshot || arrayData;
    const maxValue     = Math.max(...currentArray, 1);
    const { 
        sortedIndices = [0], 
        currentIndex, 
        compareIndex, 
        keyValue 
    } = currentStep || {};

    return (
        <DualView
            algorithmName="Insertion Sort"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            codeSnippetCategory="sorting"
            description={
                <div className="ins-desc-wrapper">
                    <span className="ins-badge">Incremental Sorting O(N²) / O(1) Space</span>
                    <span className="ins-desc-text">
                        {currentStep?.description || "Press Play to observe elements sliding into their correct sorted position."}
                    </span>
                </div>
            }
        >
            <div className="ins-visualizer-wrapper">

                {/* ── Top Input Controls Panel ──────────────────────────── */}
                <div className="ins-input-panel">
                    <div className="ins-input-group">
                        <label className="ins-input-label">Custom Array:</label>
                        <input
                            type="text"
                            value={inputVal}
                            onChange={(e) => setInputVal(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                            placeholder="8, 3, 5, 2, 9, 1"
                            className="ins-text-input"
                        />
                        <button onClick={handleApply} className="ins-btn ins-btn-primary">
                            <FaCheck /> Apply
                        </button>
                    </div>

                    <div className="ins-btn-group">
                        <button onClick={() => setIsAscending(!isAscending)} className="ins-btn ins-btn-secondary">
                            {isAscending ? <FaSortAmountDown /> : <FaSortAmountUp />} {isAscending ? 'Ascending' : 'Descending'}
                        </button>
                        <button onClick={handleRandomize} className="ins-btn ins-btn-secondary">
                            <FaRandom /> Random
                        </button>
                        <button onClick={() => { setArrayData(DEFAULT_ARRAY); setInputVal(DEFAULT_ARRAY.join(", ")); reset(); }} className="ins-btn ins-btn-outline">
                            <FaRedo /> Reset
                        </button>
                    </div>

                    <div className="ins-legend">
                        <div className="ins-leg-item"><span className="ins-dot blue"></span> Key Item ({keyValue ?? 'None'})</div>
                        <div className="ins-leg-item"><span className="ins-dot yellow"></span> Comparing</div>
                        <div className="ins-leg-item"><span className="ins-dot green"></span> Sorted Subarray</div>
                    </div>
                </div>

                {/* ── Main Canvas Stage: Sorting Bar Chart ──────────────── */}
                <div className="ins-canvas-wrapper">
                    <div className="ins-bars-container">
                        <AnimatePresence mode="popLayout">
                            {currentArray.map((val, idx) => {
                                const heightPercent = Math.max(15, (val / maxValue) * 100);

                                let stateClass = 'default';
                                if (sortedIndices.includes(idx)) stateClass = 'sorted';
                                if (idx === compareIndex) stateClass = 'comparing';
                                if (idx === currentIndex) stateClass = 'key';

                                return (
                                    <motion.div
                                        key={`${idx}-${val}`}
                                        layout
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.2 }}
                                        className="ins-bar-wrapper"
                                    >
                                        <div
                                            className={`ins-bar ${stateClass}`}
                                            style={{ height: `${heightPercent}%` }}
                                        >
                                            <span className="ins-bar-val">{val}</span>
                                        </div>
                                        <span className="ins-bar-idx">{idx}</span>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>

                {/* ── YouTube Video Player Controls ────────────────────── */}
                <div className="ins-controls-wrapper">
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

            </div>
        </DualView>
    );
};

export default InsertionSortVisualizer;
